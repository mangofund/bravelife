// 跳过一天与未成年限制
import { state, addMoney, addStats, addSkills } from './core.js'
import { passTime, finish, fail, bestBed } from './time.js'
import { age, isMinor, isSchoolDay, festivalToday, isBirthday, monthKey, grade } from './calendar.js'
import { storyDueToday } from './story.js'
import { os } from './fun.js'
import { SKIP_PER_MONTH, DRINK_AGE } from '../data/calendar.js'
import { CAREERS } from '../data/jobs.js'
import { BACKGROUNDS } from '../data/profile.js'

function skipState() {
  const s = state.skip
  const key = monthKey()
  if (s.month !== key) {
    s.month = key
    s.used = 0
  }
  return s
}

export function skipsLeft() {
  return SKIP_PER_MONTH - skipState().used
}

// 不能跳过的原因；返回空字符串表示可以跳
export function skipReason() {
  if (state.pendingStory || state.pendingEvent) return '先把眼前的事处理完'
  const s = skipState()
  if (s.day === state.day) return '今天已经跳过一次了'
  if (s.used >= SKIP_PER_MONTH) return '这个月的 ' + SKIP_PER_MONTH + ' 次跳过已经用完了'
  const f = festivalToday()
  if (f) return '今天是' + f.name + '，不能跳过'
  if (isBirthday()) return '今天是你的生日，不能跳过'
  if (state.courage.quest && state.courage.quest.until === state.day) return '勇气课题今天截止，不能跳过'
  if (storyDueToday()) return '今天有重要的事，不能跳过'
  return ''
}

// 平淡的一天：直接结算到明天 7:00，不触发剧情、邀约和随机事件
export function skipDay() {
  const err = skipReason()
  if (err) return fail(err)
  const s = skipState()
  s.used += 1
  s.day = state.day + 1
  // 邀约视为婉拒，不扣好感
  if (state.invite && state.invite.day === state.day) state.invite.done = true
  const notes = []
  if (isMinor()) {
    if (isSchoolDay() && state.hour < 12 && grade() >= 1 && grade() <= 12) {
      addSkills({ int: 2, cha: 1 })
      state.counters.school = (state.counters.school || 0) + 1
      state.story.done.school_morning = state.day
      notes.push('上学')
    }
  } else {
    const job = state.job
    if (job && job.lastDay !== state.day) {
      const c = CAREERS[job.career]
      const bg = BACKGROUNDS.filter((b) => b.id === state.profile.background)[0]
      const pay = Math.round(c.levels[job.level].pay * (1 + (bg ? bg.payBonus : 0)))
      addMoney(pay, c.name + ' · ' + c.levels[job.level].title + ' 工资')
      addSkills(c.gain)
      job.lastDay = state.day
      job.shifts += 1
      state.counters.shifts = (state.counters.shifts || 0) + 1
      notes.push('上班')
    }
    addMoney(-1500, '平淡的一天 · 伙食')
  }
  state.location = 'home'
  // 白天过完到 22:00，再睡到 7:00
  const toNight = Math.max(0, 22 - state.hour)
  if (toNight) passTime(toNight)
  addStats({ hunger: Math.max(0, 70 - state.stats.hunger), mood: 2 })
  passTime(((7 - state.hour + 24) % 24) || 24, true, bestBed())
  addStats({ hunger: Math.max(0, 60 - state.stats.hunger) })
  os('skip')
  return finish('⏭ 平淡的一天过去了' + (notes.length ? '（' + notes.join('、') + '）' : '') + '，本月还能跳 ' + skipsLeft() + ' 次')
}

// ---------- 未成年限制 ----------

export function placeBlock(locId) {
  if ((locId === 'izakaya' || locId === 'club') && age() < DRINK_AGE) return '未满 ' + DRINK_AGE + ' 岁不能进入'
  return ''
}

export function jobBlock(careerId) {
  if (!isMinor() && age() >= 18) return ''
  if (age() < 15) return '还没到能打工的年纪（15 岁起可以在便利店打工）'
  if (careerId !== 'konbini') return '高中生只能在便利店打工'
  return ''
}

// 高中生每周最多 3 个班
export const MINOR_WEEK_SHIFTS = 3

export function minorShiftBlock() {
  if (!isMinor()) return ''
  const job = state.job
  const week = Math.floor((state.day - 1) / 7)
  if (job.week !== week) {
    job.week = week
    job.weekShifts = 0
  }
  if (job.weekShifts >= MINOR_WEEK_SHIFTS) return '高中生每周最多上 ' + MINOR_WEEK_SHIFTS + ' 个班'
  return ''
}

export function contractBlock() {
  return isMinor() ? '未成年不能签合同，等搬出去住再说吧' : ''
}
