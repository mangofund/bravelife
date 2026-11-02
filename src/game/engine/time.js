import { state, clamp, round1, addMoney, addStats, pushMessage, pushNews, toast, save, fmtMoney } from './core.js'
import { HOMES, RENT_DAYS, PLOTS, BUILD_COST, BUILD_INCOME, FURNITURE, CLEAN_DECAY, DIRTY_LINE } from '../data/world.js'
import { VEHICLES } from '../data/transport.js'
import { NEWS_POOL, GOVERNOR_SALARY } from '../data/events.js'
import { CAREERS } from '../data/jobs.js'
import { WISHES } from '../data/profile.js'
import { resolveElection, daysToElection } from './election.js'
import { socialNewDay } from './social-day.js'
import { checkTutorial } from './tutorial.js'

function cleanerRate() {
  let rate = 1
  state.furniture.placed.forEach((p) => {
    const f = FURNITURE[p.fid]
    if (f && f.cleaner && f.cleaner < rate) rate = f.cleaner
  })
  return rate
}

function tick(step, sleeping, quality) {
  const s = state.stats
  state.clean = round1(clamp((state.clean === undefined ? 80 : state.clean) - CLEAN_DECAY * cleanerRate() * step, 0, 100))
  if (state.clean < DIRTY_LINE && !sleeping) s.mood -= 0.4 * step
  if (sleeping) {
    s.energy += 11 * quality * step
    s.hunger -= 1.5 * step
    s.health += 0.6 * step
  } else {
    s.hunger -= 3 * step
    s.energy -= 2.5 * step
    s.mood -= 0.6 * step
    if (s.hunger >= 50 && s.energy >= 30) s.health += 0.2 * step
  }
  if (s.hunger <= 0) s.health -= 2 * step
  if (!sleeping && s.energy <= 0) s.health -= 1.5 * step
  if (s.mood <= 10) s.health -= 0.5 * step
  Object.keys(s).forEach((k) => {
    s[k] = round1(clamp(s[k], 0, 100))
  })
}

// 推进游戏时间；sleeping 时按睡眠质量恢复精力
export function passTime(hours, sleeping, quality) {
  let left = hours
  while (left > 0.001) {
    const step = Math.min(1, left)
    tick(step, !!sleeping, quality || 1)
    left = Math.round((left - step) * 1e6) / 1e6
    state.hour = Math.round((state.hour + step) * 1e6) / 1e6
    if (state.hour >= 24) {
      state.hour = Math.round((state.hour - 24) * 1e6) / 1e6
      newDay()
    }
  }
}

function newDay() {
  const prev = state.day
  state.day += 1

  if (state.savings > 0) state.savings = Math.round(state.savings * 1.0005)

  const home = HOMES[state.home]
  if (home.rent && (state.day - 1) % RENT_DAYS === 0) {
    addMoney(-home.rent, '房租 · ' + home.name)
    pushMessage('房东', '本周房租 ' + fmtMoney(home.rent) + ' 已从账户扣除。')
  }

  if (state.vehicles && state.vehicles.car && (state.day - 1) % RENT_DAYS === 0) {
    addMoney(-VEHICLES.car.parking, '停车费 · 本周')
  }

  const built = Object.keys(state.plots).filter((id) => state.plots[id].built).length
  if (built > 0) addMoney(built * BUILD_INCOME, '湾岸公寓租金 × ' + built)

  if (state.election.governor) addMoney(GOVERNOR_SALARY, '都知事薪水')

  if (state.money < 0) {
    addStats({ mood: -5 })
    pushMessage('银行', '你的账户已透支 ' + fmtMoney(-state.money) + '，请尽快还款。')
  }

  resolveElection(prev)
  socialNewDay()

  pushNews(NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)])
  const left = daysToElection()
  if (left > 0 && left <= 7) pushNews('东京都知事选举还有 ' + left + ' 天，候选人报名截止到选举前一天。')
  if (left === 0) pushNews('今天是东京都知事选举投票日！投票所 8:00 - 20:00 开放。')
}

export function bestBed() {
  let q = 0.6
  state.furniture.placed.forEach((p) => {
    const f = FURNITURE[p.fid]
    if (f && f.bed && f.bed > q) q = f.bed
  })
  return q
}

export function kitchenLevel() {
  let lv = 0
  state.furniture.placed.forEach((p) => {
    const f = FURNITURE[p.fid]
    if (f && f.kitchen && f.kitchen > lv) lv = f.kitchen
  })
  return lv
}

export function decorScore() {
  return state.furniture.placed.reduce((s, p) => {
    const f = FURNITURE[p.fid]
    return s + (f && f.decor ? f.decor : 0)
  }, 0)
}

export function plotsValue() {
  return PLOTS.reduce((s, p) => {
    const own = state.plots[p.id]
    if (!own) return s
    return s + p.price + (own.built ? BUILD_COST : 0)
  }, 0)
}

export function netWorth() {
  const villa = state.home === 'villa' ? HOMES.villa.price : 0
  return state.money + state.savings + plotsValue() + villa
}

function wishMet(id) {
  if (id === 'ceo') {
    return !!state.job && state.job.level === CAREERS[state.job.career].levels.length - 1
  }
  if (id === 'rich') return netWorth() >= 100000000
  if (id === 'governor') return state.election.governor
  if (id === 'seaview') return state.home === 'villa'
  if (id === 'famous') return state.rep >= 100
  return false
}

export function wishInfo() {
  const w = WISHES.filter((x) => x.id === state.profile.wish)[0]
  return w || WISHES[0]
}

function checkWish() {
  if (state.wishDone || !state.profile) return
  if (!wishMet(state.profile.wish)) return
  state.wishDone = true
  const w = wishInfo()
  pushMessage('人生', '人生愿望达成：' + w.name + '！你在东京活出了自己想要的样子。')
  uni.showModal({ title: '🎉 人生愿望达成', content: w.icon + ' ' + w.name + '\n你可以继续在东京生活下去。', showCancel: false })
}

// 精力或健康耗尽时送医
function checkBody() {
  const s = state.stats
  if (s.health <= 0) {
    state.location = 'hospital'
    passTime(24, true, 0.6)
    addMoney(-150000, '住院费')
    s.health = 60
    s.hunger = Math.max(s.hunger, 60)
    s.energy = Math.max(s.energy, 60)
    s.mood = Math.max(s.mood - 10, 0)
    pushMessage('综合医院', '你因身体透支被送进医院，住院一天，花费 ' + fmtMoney(150000) + '。注意吃饭和休息！')
    return '🚑 你倒下了，被送进医院住院一天'
  }
  if (s.energy <= 0) {
    state.location = 'hospital'
    passTime(6, true, 0.8)
    addMoney(-30000, '急诊费')
    pushMessage('综合医院', '你因过度疲劳晕倒，被送到急诊，花费 ' + fmtMoney(30000) + '。')
    return '😵 你累晕了，在医院醒来'
  }
  return ''
}

// 每个操作结束后统一调用：身体检查、愿望检查、存档、提示
export function finish(msg) {
  const body = checkBody()
  checkWish()
  const tut = checkTutorial()
  save()
  let text = body || msg
  if (tut) text = text ? text + '\n' + tut : tut
  if (text) toast(text)
  return true
}

// 实时时钟：游戏页每秒调用一次，minutes 为本次流逝的游戏分钟数
let unsavedMinutes = 0
export function tickClock(minutes) {
  if (!state.started || minutes <= 0) return
  passTime(minutes / 60)
  const body = checkBody()
  checkWish()
  const tut = checkTutorial()
  unsavedMinutes += minutes
  // 普通流逝每 30 游戏分钟存一次档，有事发生时立即存
  if (body || tut || unsavedMinutes >= 30) {
    save()
    unsavedMinutes = 0
  }
  if (body || tut) toast(body || tut)
}

export function fail(msg) {
  toast(msg)
  return false
}
