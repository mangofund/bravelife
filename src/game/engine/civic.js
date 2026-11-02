import { state, addMoney, addStats, addRep, pushMessage, pushNews, fmtMoney, isOpen, dailyUsed, markDaily } from './core.js'
import { passTime, finish, fail } from './time.js'
import { isElectionDay, campaignGain, addSupport } from './election.js'
import { LOCATION_MAP } from '../data/locations.js'
import { isMinor } from './calendar.js'
import { CAMPAIGNS, CANDIDATES, ELECTION_DEPOSIT, ELECTION_MIN_REP } from '../data/events.js'

function atHall() {
  const loc = LOCATION_MAP.cityhall
  if (state.location !== 'cityhall') return '要去都厅办理'
  if (!isOpen(loc)) return '都厅现在不开放（8:00 - 20:00）'
  return ''
}

export function registerCandidate() {
  const err = atHall()
  if (err) return fail(err)
  const e = state.election
  if (e.registered) return fail('你已经是候选人了')
  if (isMinor()) return fail('未成年不能参选')
  if (isElectionDay()) return fail('今天是投票日，报名已截止')
  if (state.rep < ELECTION_MIN_REP) return fail('声望需要达到 ' + ELECTION_MIN_REP)
  if (state.money < ELECTION_DEPOSIT) return fail('需要缴纳保证金 ' + fmtMoney(ELECTION_DEPOSIT))
  addMoney(-ELECTION_DEPOSIT, '都知事选举保证金')
  e.registered = true
  e.support = 0
  passTime(1)
  pushNews('【选举】' + state.profile.name + ' 宣布参选东京都知事！')
  pushMessage('选举管理委员会', '报名成功。每天可以街头演说、发传单、投电视广告来提升支持度。')
  return finish('🗳️ 报名参选成功！')
}

export function campaign(kind) {
  const err = atHall()
  if (err) return fail(err)
  if (!state.election.registered) return fail('先报名成为候选人')
  if (isElectionDay()) return fail('投票日禁止拉票')
  const c = CAMPAIGNS.filter((x) => x.id === kind)[0]
  const key = 'campaign:' + kind
  if (dailyUsed(key)) return fail('今天已经' + c.name + '过了')
  if (state.money < c.cost) return fail('钱不够，需要 ' + fmtMoney(c.cost))
  const gain = campaignGain(kind)
  passTime(c.hours)
  if (c.cost) addMoney(-c.cost, '竞选 · ' + c.name)
  addStats({ energy: -c.hours * 3 })
  addSupport(gain)
  addRep(1)
  markDaily(key)
  return finish(c.name + '：支持度 +' + gain)
}

export function vote(candId) {
  const err = atHall()
  if (err) return fail(err)
  if (!isElectionDay()) return fail('今天不是投票日')
  const e = state.election
  if (e.voted) return fail('你已经投过票了')
  if (candId === 'me' && !e.registered) return fail('你不是候选人')
  e.voted = true
  passTime(0.5)
  addStats({ mood: 5 })
  addRep(1)
  if (candId === 'me') addSupport(1)
  const name = candId === 'me' ? '自己' : CANDIDATES.filter((c) => c.id === candId)[0].name
  return finish('已投票给 ' + name + '，开票结果明天公布')
}
