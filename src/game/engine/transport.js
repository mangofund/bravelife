import { state, addMoney, addStats, fmtMoney, round1 } from './core.js'
import { passTime, finish, fail } from './time.js'
import { LOCATION_MAP } from '../data/locations.js'
import { EVENTS, EVENT_CHANCE } from '../data/events.js'
import { MODES, MODE_MAP, VEHICLES, KM_PER_PCT_X, KM_PER_PCT_Y, FAR_EXTRA_KM, EVENT_RATE } from '../data/transport.js'

export function distanceKm(fromId, toId) {
  const a = LOCATION_MAP[fromId]
  const b = LOCATION_MAP[toId]
  const dx = (a.x - b.x) * KM_PER_PCT_X
  const dy = (a.y - b.y) * KM_PER_PCT_Y
  let km = Math.sqrt(dx * dx + dy * dy)
  if (a.far || b.far) km += FAR_EXTRA_KM
  return Math.max(0.3, round1(km))
}

function hasVehicle(id) {
  return !!(state.vehicles && state.vehicles[id])
}

// 列出去某地的所有出行方式：耗时（小时，按整分钟向上取）、费用、能否选择
export function travelOptions(toId) {
  const km = distanceKm(state.location, toId)
  const far = !!(LOCATION_MAP[state.location].far || LOCATION_MAP[toId].far)
  return MODES.map((m) => {
    const speed = far && m.farSpeed ? m.farSpeed : m.speed
    const minutes = Math.ceil(m.wait + (km / speed) * 60)
    const cost = Math.round((m.base + m.perKm * km) / 10) * 10
    let reason = ''
    let warn = ''
    if (m.needs && !hasVehicle(m.needs)) reason = '还没有' + VEHICLES[m.needs].name
    else if (m.maxKm && km > m.maxKm) {
      // 走路永远可选，保证没钱时也能回家；其他方式太远就不能用
      if (m.id === 'walk') warn = '很远，会非常累'
      else reason = '太远了'
    } else if (state.money < cost) reason = '钱不够'
    return { id: m.id, name: m.name, icon: m.icon, desc: m.desc, km, hours: minutes / 60, cost, ok: !reason, reason, warn }
  })
}

// 没指定方式时（例如家里的「回家」按钮）：有自行车且够近就骑车，否则坐电车，坐不起就走路
export function defaultMode(toId) {
  const opts = travelOptions(toId)
  const pick = (id) => opts.filter((o) => o.id === id && o.ok)[0]
  const chosen = pick('bike') || pick('train') || pick('walk') || pick('car') || pick('taxi')
  return chosen ? chosen.id : 'walk'
}

function rollEvent(mode) {
  if (Math.random() > EVENT_CHANCE * (EVENT_RATE[mode] || 1)) return
  const pool = EVENTS.filter((ev) => {
    if (!ev.cond) return true
    return Object.keys(ev.cond).every((k) => (k === 'money' ? state.money >= ev.cond[k] : state.skills[k] >= ev.cond[k]))
  })
  if (pool.length) state.pendingEvent = pool[Math.floor(Math.random() * pool.length)].id
}

export function travel(toId, modeId) {
  const to = LOCATION_MAP[toId]
  if (!to || to.soon) return fail('这里还没开放')
  if (state.location === toId) return fail('你已经在这里了')
  const mode = modeId || defaultMode(toId)
  const opt = travelOptions(toId).filter((o) => o.id === mode)[0]
  if (!opt) return fail('没有这种出行方式')
  if (!opt.ok) return fail(opt.name + '：' + opt.reason)
  passTime(opt.hours)
  if (opt.cost) addMoney(-opt.cost, opt.name + ' · 前往' + to.name)
  const m = MODE_MAP[mode]
  if (m.energyPerHour) addStats({ energy: -Math.round(m.energyPerHour * opt.hours) })
  state.location = toId
  rollEvent(mode)
  const minutes = Math.round(opt.hours * 60)
  const time = minutes >= 60 ? Math.floor(minutes / 60) + ' 小时 ' + (minutes % 60) + ' 分' : minutes + ' 分钟'
  return finish(m.icon + ' ' + opt.name + ' ' + time + (opt.cost ? '，花了 ' + fmtMoney(opt.cost) : '') + '，到达 ' + to.name)
}

export function buyVehicle(id) {
  const v = VEHICLES[id]
  if (!v) return fail('没有这种交通工具')
  if (state.location !== 'ginza' || !LOCATION_MAP.ginza || state.hour < LOCATION_MAP.ginza.open[0] || state.hour >= LOCATION_MAP.ginza.open[1]) {
    return fail('要在银座百货营业时间购买')
  }
  if (hasVehicle(id)) return fail('你已经有' + v.name + '了')
  if (state.money < v.price) return fail('钱不够，需要 ' + fmtMoney(v.price))
  addMoney(-v.price, '购买' + v.name)
  if (!state.vehicles) state.vehicles = {}
  state.vehicles[id] = true
  return finish(v.icon + ' 买下了' + v.name + (v.parking ? '，每周停车费 ' + fmtMoney(v.parking) : ''))
}
