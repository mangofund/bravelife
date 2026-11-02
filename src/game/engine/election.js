import { state, clamp, round1, addRep, pushMessage, pushNews } from './core.js'
import { CANDIDATES, ELECTION_CYCLE } from '../data/events.js'

export function electionDay(day) {
  const d = day === undefined ? state.day : day
  return Math.ceil(d / ELECTION_CYCLE) * ELECTION_CYCLE
}

export function isElectionDay() {
  return state.day % ELECTION_CYCLE === 0
}

export function daysToElection() {
  return electionDay() - state.day
}

function playerScore() {
  const e = state.election
  return e.support + state.rep * 0.3 + (e.governor ? 10 : 0)
}

// 不含随机波动的预估得票率，用于界面展示
export function projection() {
  const rows = CANDIDATES.map((c) => ({ id: c.id, name: c.name, icon: c.icon, score: c.base }))
  if (state.election.registered) {
    rows.push({ id: 'me', name: state.profile.name + '（你）', icon: '⭐', score: playerScore() })
  }
  const total = rows.reduce((s, r) => s + r.score, 0)
  rows.forEach((r) => {
    r.pct = total > 0 ? Math.round((r.score / total) * 1000) / 10 : 0
  })
  rows.sort((a, b) => b.pct - a.pct)
  return rows
}

// 在跨天时调用：如果刚过去的那一天是选举日，就开票
export function resolveElection(prevDay) {
  if (prevDay % ELECTION_CYCLE !== 0) return
  const e = state.election
  const rows = CANDIDATES.map((c) => ({ id: c.id, name: c.name, score: c.base * (0.85 + Math.random() * 0.3) }))
  if (e.registered) {
    rows.push({ id: 'me', name: state.profile.name, score: playerScore() * (0.85 + Math.random() * 0.3) })
  }
  const total = rows.reduce((s, r) => s + r.score, 0)
  rows.forEach((r) => {
    r.pct = Math.round((r.score / total) * 1000) / 10
  })
  rows.sort((a, b) => b.score - a.score)
  const winner = rows[0]
  e.last = { day: prevDay, winner: winner.name, results: rows.map((r) => ({ name: r.name, pct: r.pct })) }

  const wasGovernor = e.governor
  if (winner.id === 'me') {
    e.governor = true
    e.wins = (e.wins || 0) + 1
    addRep(15)
    pushMessage('选举管理委员会', '恭喜！你以 ' + winner.pct + '% 的得票率当选东京都知事，每天将领取知事薪水。')
    pushNews('【快讯】新人候选人 ' + state.profile.name + ' 爆冷当选东京都知事！')
  } else {
    e.governor = false
    if (wasGovernor) pushMessage('选举管理委员会', '你的知事任期结束了。新知事是 ' + winner.name + '。')
    else if (e.registered) pushMessage('选举管理委员会', '很遗憾落选了，得票率 ' + rows.filter((r) => r.id === 'me')[0].pct + '%。下次再战！')
    pushNews('【选举】' + winner.name + ' 以 ' + winner.pct + '% 的得票率当选东京都知事。')
  }
  e.registered = false
  e.support = 0
  e.voted = false
}

export function campaignGain(kind) {
  if (kind === 'speech') return round1(3 + state.skills.cha * 0.1)
  if (kind === 'flyer') return round1(5 + state.skills.cre * 0.05)
  if (kind === 'tv') return 22
  return 0
}

export function addSupport(v) {
  state.election.support = round1(clamp(state.election.support + v, 0, 500))
}
