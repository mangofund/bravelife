// 历法与年龄：由 state.day 推出日期，由出生日期推出年龄和年级
import { state } from './core.js'
import { START, SCHOOL_BREAKS, FESTIVALS, ADULT_STAGES, WEATHERS } from '../data/calendar.js'

const DAY_MS = 86400000
const WEEK = ['日', '一', '二', '三', '四', '五', '六']

export function dateOf(day) {
  const t = Date.UTC(START.y, START.m - 1, START.d) + ((day === undefined ? state.day : day) - 1) * DAY_MS
  const d = new Date(t)
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), w: d.getUTCDay() }
}

export function weekday(day) {
  return '周' + WEEK[dateOf(day).w]
}

export function fmtDate(day) {
  const d = dateOf(day)
  return d.y + '年' + d.m + '月' + d.d + '日'
}

export function fmtDay(day) {
  const d = dateOf(day)
  return d.m + '/' + d.d
}

export function monthKey(day) {
  const d = dateOf(day)
  return d.y + '-' + d.m
}

// 出生年：让开局那天正好是 startAge 岁
export function birthYearFor(startAge, birth) {
  const had = birth.m < START.m || (birth.m === START.m && birth.d <= START.d)
  return START.y - startAge - (had ? 0 : 1)
}

export function ageOn(day) {
  const p = state.profile
  if (!p || !p.birth) return 22
  const d = dateOf(day)
  const before = d.m < p.birth.m || (d.m === p.birth.m && d.d < p.birth.d)
  return d.y - p.birthYear - (before ? 1 : 0)
}

export function age() {
  return ageOn(state.day)
}

// 日本学年：4 月 2 日到次年 4 月 1 日出生的是同一届；1-6 小学，7-9 初中，10-12 高中
export function grade() {
  const p = state.profile
  if (!p || !p.birth) return 99
  const d = dateOf()
  const schoolYear = d.m >= 4 ? d.y : d.y - 1
  const after = p.birth.m > 4 || (p.birth.m === 4 && p.birth.d >= 2)
  const fiscalBirth = after ? p.birthYear : p.birthYear - 1
  return schoolYear - fiscalBirth - 6
}

export function isMinor() {
  return !!(state.life && state.life.withParents)
}

export function schoolName(g) {
  const v = g === undefined ? grade() : g
  if (v <= 0) return '幼儿园'
  if (v <= 6) return '小学 ' + v + ' 年级'
  if (v <= 9) return '初中 ' + (v - 6) + ' 年级'
  if (v <= 12) return '高中 ' + (v - 9) + ' 年级'
  return '毕业'
}

export function stageId() {
  if (isMinor()) {
    const g = grade()
    if (g <= 6) return 'elem'
    if (g <= 9) return 'junior'
    return 'high'
  }
  return 'adult'
}

export function lifeStageName() {
  if (isMinor()) {
    const g = grade()
    if (g <= 6) return '小小冒险家'
    if (g <= 9) return '第一次害怕'
    return '选一条路'
  }
  const a = age()
  let name = ADULT_STAGES[0].name
  ADULT_STAGES.forEach((s) => {
    if (a >= s.from) name = s.name
  })
  return name
}

function inRange(md, from, to) {
  const v = md[0] * 100 + md[1]
  const a = from[0] * 100 + from[1]
  const b = to[0] * 100 + to[1]
  return a <= b ? v >= a && v <= b : v >= a || v <= b
}

export function festivalToday(day) {
  const d = dateOf(day)
  return FESTIVALS.filter((f) => inRange([d.m, d.d], f.from, f.to))[0] || null
}

export function schoolBreak(day) {
  const d = dateOf(day)
  return SCHOOL_BREAKS.filter((b) => inRange([d.m, d.d], b.from, b.to))[0] || null
}

export function isSchoolDay(day) {
  const d = dateOf(day)
  if (d.w === 0 || d.w === 6) return false
  return !schoolBreak(day)
}

export function isBirthday(day) {
  const p = state.profile
  if (!p || !p.birth) return false
  const d = dateOf(day)
  return d.m === p.birth.m && d.d === p.birth.d
}

export function weatherInfo() {
  return WEATHERS[state.weather] || WEATHERS.sun
}

export function isRaining() {
  return state.weather === 'rain'
}
