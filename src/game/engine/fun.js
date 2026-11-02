// 好玩层：内心 OS 弹幕、称号、当天活动统计
import { state, pushMessage } from './core.js'
import { ui } from '../ui.js'
import { OS_LINES, OS_ENTER_CHANCE } from '../data/os.js'
import { TITLES, TITLE_MAP } from '../data/titles.js'

const said = {}
let osId = 0

// 弹一句内心 OS；同一类一天只说一次
export function os(key, chance) {
  const pool = OS_LINES[key]
  if (!pool || !pool.length) return
  if (chance !== undefined && Math.random() > chance) return
  if (said[key] === state.day) return
  said[key] = state.day
  osId += 1
  ui.os.push({ id: osId, text: pool[Math.floor(Math.random() * pool.length)], lane: osId % 3 })
  if (ui.os.length > 5) ui.os.splice(0, ui.os.length - 5)
}

export function osEnter(locId) {
  os('enter:' + locId, OS_ENTER_CHANCE)
}

function log() {
  if (!state.dayLog || state.dayLog.day !== state.day) state.dayLog = { day: state.day, acts: 0, grind: 0, talks: 0 }
  return state.dayLog
}

// 记一次「做了事」：grind 为学习/上课/上班的小时数
export function logAct(grind) {
  const l = log()
  l.acts += 1
  if (grind) l.grind += grind
}

export function logTalk() {
  log().talks += 1
}

// 跨天：结算连续天数类的称号计数
export function funNewDay(prevDay) {
  const l = state.dayLog
  const c = state.counters
  const was = l && l.day === prevDay ? l : { acts: 0, talks: 0 }
  c.lazyStreak = was.acts === 0 ? (c.lazyStreak || 0) + 1 : 0
  c.silentStreak = was.talks === 0 ? (c.silentStreak || 0) + 1 : 0
  state.dayLog = { day: state.day, acts: 0, grind: 0, talks: 0 }
}

export function awardTitle(id) {
  const t = TITLE_MAP[id]
  if (!t || state.titles[id]) return ''
  state.titles[id] = state.day
  if (!state.profile.title) state.profile.title = id
  pushMessage('称号', '获得称号「' + t.icon + t.name + '」：' + t.desc)
  return '🏷️ 获得称号「' + t.name + '」'
}

export function checkTitles() {
  let msg = ''
  TITLES.forEach((t) => {
    if (t.story || state.titles[t.id]) return
    if (t.check(state)) msg = awardTitle(t.id)
  })
  return msg
}

export function wearTitle(id) {
  if (id && !state.titles[id]) return false
  state.profile.title = id || ''
  return true
}

export function titleText() {
  const t = state.profile && TITLE_MAP[state.profile.title]
  return t ? t.icon + t.name : ''
}
