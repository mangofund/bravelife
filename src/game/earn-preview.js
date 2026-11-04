import { state, isOpen, round1 } from './engine/core.js'
import { jobQualification, shiftPay } from './engine/actions.js'
import { bestBed } from './engine/time.js'
import { travelOptions } from './engine/transport.js'
import { isMinor } from './engine/calendar.js'
import { locVisible } from './engine/courage.js'
import { MINOR_WEEK_SHIFTS } from './engine/life.js'
import { CAREERS } from './data/jobs.js'
import { LOCATION_MAP } from './data/locations.js'
import { MODE_MAP } from './data/transport.js'

function projectEnergy(energy, hours, rate) {
  while (hours > 0.001) {
    const step = Math.min(1, hours)
    energy = round1(Math.max(0, Math.min(100, energy + step * rate)))
    hours = Math.round((hours - step) * 1e6) / 1e6
  }
  return energy
}

// Evaluate one-shift routes without mutating the live game. Existing jobs are kept.
export function planEarnings(goal) {
  const remaining = goal.balance - state.money
  if (state.day !== goal.day) return { message: '已到次日，今日目标未完成。' }
  if (remaining <= 0) return { message: '目标达成，今日净增 ¥' + (state.money - goal.startBalance) + '。' }

  const job = state.job
  if (job?.lastDay === state.day) return { message: '今天的班次已经用完。' }
  if (job && isMinor() && job.week === Math.floor((state.day - 1) / 7) && job.weekShifts >= MINOR_WEEK_SHIFTS) {
    return { message: '本周的学生兼职班次已用完。' }
  }

  const routes = []
  let bestNet = 0
  for (const id of job ? [job.career] : Object.keys(CAREERS)) {
    const career = CAREERS[id]
    if (!career || !locVisible(career.location) || (!job && jobQualification(id))) continue
    const location = LOCATION_MAP[career.location]
    const pay = shiftPay(id, job?.level ?? 0)
    const options = state.location === career.location ? [{ hours: 0, cost: 0 }] : travelOptions(career.location)
    for (const mode of options) {
      if (mode.ok === false) continue
      for (const nap of state.location === 'home' ? [0, 2] : [0]) {
        const arrival = state.hour + nap + mode.hours
        const applyAt = job || isOpen(location, arrival) ? arrival : Math.max(arrival, location.open[0])
        const readyAt = applyAt + (job ? 0 : 1)
        const start = Math.max(readyAt, career.window[0])
        const end = start + career.hours
        if ((!job && !isOpen(location, applyAt)) || start >= career.window[1] || end >= 24) continue

        let energy = projectEnergy(state.stats.energy, nap, 11 * bestBed())
        energy = projectEnergy(energy, mode.hours, -2.5)
        if (mode.id) energy = Math.max(0, energy - Math.round((MODE_MAP[mode.id].energyPerHour || 0) * mode.hours))
        energy = projectEnergy(energy, applyAt - arrival, -2.5)
        energy = projectEnergy(energy, job ? 0 : 1, -2.5)
        energy = projectEnergy(energy, start - readyAt, -2.5)
        if (energy < 15) continue

        const net = pay - mode.cost
        bestNet = Math.max(bestNet, net)
        if (net < remaining) continue
        const next = nap ? { type: 'nap' } :
          mode.id ? { type: 'travel', destination: career.location, mode: mode.id, label: mode.name } :
          applyAt - state.hour > 0.001 ? { type: 'wait', hours: applyAt - state.hour } :
          !job ? { type: 'apply', career: id } :
          start - state.hour > 0.001 ? { type: 'wait', hours: start - state.hour } : { type: 'work' }
        routes.push({ next, end, net, cost: mode.cost, jobName: career.name })
      }
    }
  }

  routes.sort((a, b) => a.end - b.end || a.cost - b.cost)
  if (routes.length) return routes[0]
  return { message: bestNet
    ? '已检查的合法班次最多净赚 ¥' + bestNet + '，低于还差的 ¥' + remaining + '。'
    : '当前时间、资格和精力下，未找到能在今天结束前完成的班次。' }
}
