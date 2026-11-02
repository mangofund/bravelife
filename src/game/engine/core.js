import { reactive } from 'vue'
import { SKILL_NAMES, STAT_NAMES } from '../data/profile.js'
import { fmtMoney } from '../currency.js'

export const SAVE_KEY = 'bravelife_save_v1'
// 改名前的存档键：新键没有存档时读取它，下次保存写入新键
const LEGACY_SAVE_KEY = 'tokyo_life_save_v1'

function readSave() {
  return uni.getStorageSync(SAVE_KEY) || uni.getStorageSync(LEGACY_SAVE_KEY)
}
const MAX_LOG = 60

export function initialState() {
  return {
    version: 2,
    started: false,
    profile: null,
    day: 1,
    hour: 8,
    money: 0,
    savings: 0,
    stats: { hunger: 80, energy: 90, mood: 70, health: 90 },
    skills: { fit: 0, int: 0, cha: 0, cre: 0, cook: 0 },
    rep: 0,
    location: 'home',
    job: null,
    home: 'wood',
    furniture: { inv: {}, placed: [] },
    nextUid: 1,
    bag: {},
    plots: {},
    election: { registered: false, support: 0, voted: false, governor: false, wins: 0 },
    wishDone: false,
    daily: {},
    messages: [],
    news: [],
    txns: [],
    pendingEvent: null,
    unread: 0,
    social: {},
    invite: null,
    tutorial: { step: 0, done: false },
    counters: { meals: 0, sleeps: 0, shifts: 0 },
    vehicles: {},
    clean: 80,
    weather: 'sun',
    // 人生：是否和父母同住、章节目标完成日
    life: { withParents: false, goals: {} },
    skip: { month: '', used: 0, day: 0 },
    story: { done: {}, flags: {}, turningDay: 0 },
    pendingStory: null,
    courage: {
      value: 0, total: 0, milestone: 0, burstDay: 0, pages: 0, chapters: 0, firsts: {}, charms: {},
      quest: null, questsDone: 0, stock: null, retryUsed: 0, catDay: 0
    },
    titles: {},
    visited: {},
    // 当天的活动统计：用于称号判定
    dayLog: { day: 1, acts: 0, grind: 0, talks: 0 },
    family: { gen: 1, heirloom: '' }
  }
}

export const state = reactive(initialState())

export function resetState(next) {
  const fresh = next || initialState()
  Object.keys(fresh).forEach((k) => {
    state[k] = fresh[k]
  })
}

export function save() {
  try {
    uni.setStorageSync(SAVE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('save failed', e)
  }
}

export function hasSave() {
  try {
    const raw = readSave()
    if (!raw) return false
    const data = JSON.parse(raw)
    return !!(data && data.started)
  } catch (e) {
    return false
  }
}

export function load() {
  try {
    const raw = readSave()
    if (!raw) return false
    const data = JSON.parse(raw)
    if (!data || !data.started) return false
    // 用默认值兜底，防止旧存档缺字段
    const base = initialState()
    // 旧存档没有新手引导字段，视为已完成
    if (data.tutorial === undefined) base.tutorial.done = true
    // v1 存档没有年龄：按 22 岁、4 月 2 日生日的成年人处理，跳过童年
    if (data.profile && !data.profile.birth) {
      data.profile.birth = { m: 4, d: 2 }
      data.profile.birthYear = 2003
      data.profile.startAge = 22
    }
    Object.keys(base).forEach((k) => {
      if (data[k] !== undefined) base[k] = data[k]
    })
    resetState(base)
    return true
  } catch (e) {
    console.error('load failed', e)
    return false
  }
}

export function clearSave() {
  try {
    uni.removeStorageSync(SAVE_KEY)
    uni.removeStorageSync(LEGACY_SAVE_KEY)
  } catch (e) {
    console.error('clear failed', e)
  }
  resetState()
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

export function round1(v) {
  return Math.round(v * 10) / 10
}

export { fmtMoney }

export function fmtHour(h) {
  // 按整分钟取整，避免 7.9999 显示成 07:60
  const total = Math.floor(h * 60 + 1e-6)
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm
}

export function fmtHours(h) {
  if (h < 1) return Math.round(h * 60) + ' 分钟'
  return round1(h) + ' 小时'
}

export function pushMessage(from, text) {
  state.messages.unshift({ day: state.day, hour: state.hour, from, text })
  if (state.messages.length > MAX_LOG) state.messages.length = MAX_LOG
  state.unread += 1
}

export function pushNews(text) {
  state.news.unshift({ day: state.day, text })
  if (state.news.length > MAX_LOG) state.news.length = MAX_LOG
}

export function addMoney(amount, reason) {
  if (!amount) return
  state.money = Math.round(state.money + amount)
  state.txns.unshift({ day: state.day, hour: state.hour, text: reason, amount: Math.round(amount) })
  if (state.txns.length > MAX_LOG) state.txns.length = MAX_LOG
}

export function addStats(effects) {
  if (!effects) return
  Object.keys(STAT_NAMES).forEach((k) => {
    if (effects[k]) state.stats[k] = round1(clamp(state.stats[k] + effects[k], 0, 100))
  })
}

// 能力和声望越高越难涨：0 时 100%，50 时 60%，80 时 36%，最低 25%
export function growth(current) {
  return Math.max(0.25, 1 - current / 125)
}

export function addSkills(skills, mult) {
  if (!skills) return
  const m = mult || 1
  Object.keys(skills).forEach((k) => {
    if (state.skills[k] === undefined) return
    const v = skills[k] * m
    const gain = v > 0 ? v * growth(state.skills[k]) : v
    state.skills[k] = round1(clamp(state.skills[k] + gain, 0, 100))
  })
}

export function addRep(v) {
  if (!v) return
  // 声望的边际收益下降得更快，90 以上只有约 15%
  const gain = v > 0 ? v * Math.max(0.1, 1 - state.rep / 105) : v
  state.rep = round1(clamp(state.rep + gain, 0, 100))
}

// 把效果描述成“饱腹+15 心情+8 智识+2”
export function describe(effects, skills, rep, cost) {
  const parts = []
  if (effects) {
    Object.keys(STAT_NAMES).forEach((k) => {
      if (effects[k]) parts.push(STAT_NAMES[k] + (effects[k] > 0 ? '+' : '') + effects[k])
    })
  }
  if (skills) {
    Object.keys(skills).forEach((k) => {
      if (skills[k]) parts.push(SKILL_NAMES[k] + '+' + skills[k])
    })
  }
  if (rep) parts.push('声望' + (rep > 0 ? '+' : '') + rep)
  if (cost) parts.push('-' + fmtMoney(cost))
  return parts.join(' ')
}

export function toast(title) {
  uni.showToast({ title: String(title).slice(0, 60), icon: 'none', duration: 2200 })
}

export function isOpen(loc, hour) {
  const h = hour === undefined ? state.hour : hour
  const from = loc.open[0]
  const to = loc.open[1]
  if (to >= 24 && from === 0) return true
  if (to <= 24) return h >= from && h < to
  return h >= from || h < to - 24
}

export function openText(loc) {
  if (loc.open[0] === 0 && loc.open[1] >= 24) return '24 小时营业'
  return fmtHour(loc.open[0]) + ' - ' + fmtHour(loc.open[1] % 24)
}

export function dailyUsed(key) {
  return state.daily[key] === state.day
}

export function markDaily(key) {
  state.daily[key] = state.day
}

export function count(key) {
  state.counters[key] = (state.counters[key] || 0) + 1
}
