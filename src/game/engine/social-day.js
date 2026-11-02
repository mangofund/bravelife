import { state, round1, clamp, addStats, pushMessage } from './core.js'
import { NPCS, NPC_MAP, STAGES, NEGLECT_DAYS, INVITE_CHANCE, INVITE_PLACES } from '../data/npcs.js'
import { LOCATION_MAP } from '../data/locations.js'
import { isMinor } from './calendar.js'

// NPC 此刻所在的人生阶段：主角 18 岁前，大家都还是学生
export function spotOf(n) {
  return isMinor() && n.youth ? n.youth : n
}

export function rel(id) {
  return state.social[id] || null
}

export function addAffection(id, v) {
  const r = state.social[id]
  if (r) r.aff = round1(clamp(r.aff + v, 0, 100))
}

export function stageName(r) {
  if (!r) return '陌生人'
  if (r.status === 'married') return '配偶'
  if (r.status === 'dating') return '恋人'
  let name = STAGES[0].name
  STAGES.forEach((s) => {
    if (r.aff >= s.min) name = s.name
  })
  return name
}

export function partnerId() {
  return Object.keys(state.social).filter((id) => state.social[id].status !== 'none')[0] || ''
}

// 跨天时处理：失约、疏远、伴侣加成、新的邀约
export function socialNewDay() {
  const inv = state.invite
  if (inv && inv.day < state.day) {
    if (!inv.done) {
      addAffection(inv.npc, -3)
      pushMessage(NPC_MAP[inv.npc].name, '昨天等了你好久……下次别放我鸽子了。')
    }
    state.invite = null
  }

  Object.keys(state.social).forEach((id) => {
    const r = state.social[id]
    if (state.day - r.last > NEGLECT_DAYS) addAffection(id, r.status === 'none' ? -1 : -2)
  })

  const pid = partnerId()
  if (pid) {
    const married = state.social[pid].status === 'married'
    addStats({ mood: married ? 5 : 3 })
  }

  if (state.invite || Math.random() > INVITE_CHANCE) return
  const friends = NPCS.filter((n) => state.social[n.id] && state.social[n.id].aff >= 20)
  if (!friends.length) return
  const npc = friends[Math.floor(Math.random() * friends.length)]
  const place = INVITE_PLACES[Math.floor(Math.random() * INVITE_PLACES.length)]
  state.invite = { npc: npc.id, loc: place.loc, from: place.from, to: place.to, day: state.day, done: false }
  pushMessage(npc.name, place.text + '（今天 ' + place.from + ':00 - ' + place.to + ':00，' + LOCATION_MAP[place.loc].name + '）')
}

// 某地点此刻在场的 NPC（含今天邀约到这里的人）
export function npcsAt(locId) {
  const h = state.hour
  const inHours = (n) => (h >= n.hours[0] && h < n.hours[1]) || (n.hours[1] > 24 && h < n.hours[1] - 24)
  const list = NPCS.filter((n) => {
    const sp = spotOf(n)
    return sp.location === locId && inHours(sp)
  })
  const inv = state.invite
  if (inv && !inv.done && inv.day === state.day && inv.loc === locId && h >= inv.from && h < inv.to) {
    if (!list.some((n) => n.id === inv.npc)) list.push(NPC_MAP[inv.npc])
  }
  return list
}

export function isPresent(id) {
  return state.location && npcsAt(state.location).some((n) => n.id === id)
}
