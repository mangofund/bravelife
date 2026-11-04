import { CROPS, HOUR } from '../data/garden.js'

export function initialGarden() {
  return { version: 2, lastAt: 0, nextBatch: 1, plots: [null, null, null, null], produce: {}, ownProduce: {}, seeds: {}, feed: {}, pets: { dog: null, cat: null } }
}
const finite = (v, fallback = 0) => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback
export function normalizeGarden(raw) {
  const g = initialGarden()
  if (!raw || typeof raw !== 'object') return g
  g.lastAt = finite(raw.lastAt)
  g.nextBatch = Math.max(1, Math.floor(finite(raw.nextBatch, 1)))
  for (const id of Object.keys(CROPS)) {
    g.produce[id] = Math.floor(finite(raw.produce && raw.produce[id]))
    g.ownProduce[id] = Math.min(g.produce[id], Math.floor(finite(raw.ownProduce && raw.ownProduce[id])))
    g.seeds[id] = Math.floor(finite(raw.seeds && raw.seeds[id]))
  }
  for (const kind of ['dog', 'cat']) g.feed[kind] = Math.floor(finite(raw.feed && raw.feed[kind]))
  g.plots = g.plots.map((_, i) => {
    const p = raw.plots && raw.plots[i]
    if (!p || !CROPS[p.crop]) return null
    return { batch: String(p.batch || 'legacy-' + i), crop: p.crop, progress: finite(p.progress), waterUntil: finite(p.waterUntil), stolen: Math.min(2, Math.floor(finite(p.stolen))), visitors: Array.isArray(p.visitors) ? p.visitors.filter(x => typeof x === 'string') : [] }
  })
  for (const kind of ['dog', 'cat']) {
    const p = raw.pets && raw.pets[kind]
    if (p && typeof p === 'object') g.pets[kind] = { fedUntil: finite(p.fedUntil), energy: Math.min(100, finite(p.energy, 100)), lastCuddle: finite(p.lastCuddle), lastMealAt: finite(p.lastMealAt), bond: Math.min(100, finite(p.bond)), lastHugDay: finite(p.lastHugDay, -1) }
  }
  return g
}

// 只让菜园和宠物随现实时间推进，不触碰人生时钟。回拨时间不回退进度。
export function advanceGarden(g, timestamp) {
  const now = Math.max(g.lastAt, finite(timestamp, g.lastAt))
  const before = g.lastAt || now
  for (const p of g.plots) {
    if (!p) continue
    const watered = Math.max(0, Math.min(now, p.waterUntil) - before)
    p.progress = Math.min(CROPS[p.crop].hours * HOUR, p.progress + watered + (now - before - watered) * 0.5)
  }
  for (const kind of ['dog', 'cat']) {
    const p = g.pets[kind]
    if (!p) continue
    const awake = Math.max(0, Math.min(now, p.fedUntil) - before)
    const sleeping = now - before - awake
    p.energy = Math.max(0, p.energy - awake / HOUR - sleeping / HOUR * 0.02)
  }
  g.lastAt = now
  return now
}
export function ripe(p) { return !!p && p.progress >= CROPS[p.crop].hours * HOUR }
export function dogGuards(g, now) { return !!g.pets.dog && g.pets.dog.fedUntil > now }
export function plant(g, index, crop, now) {
  if (!Number.isInteger(index) || index < 0 || index >= g.plots.length || g.plots[index] || !CROPS[crop]) return false
  g.plots[index] = { batch: String(g.nextBatch++), crop, progress: 0, waterUntil: now + 24 * HOUR, stolen: 0, visitors: [] }
  return true
}
export function harvest(g, index) {
  const p = g.plots[index]
  if (!ripe(p)) return 0
  const n = 10 - p.stolen
  g.produce[p.crop] = (g.produce[p.crop] || 0) + n
  g.ownProduce[p.crop] = (g.ownProduce[p.crop] || 0) + n
  g.plots[index] = null
  return n
}
export function consumeProduce(g, id, quantity, preferOwn = false) {
  if (!CROPS[id] || !Number.isInteger(quantity) || quantity <= 0 || !(g.produce[id] >= quantity)) return false
  const own = g.ownProduce[id] || 0
  g.produce[id] -= quantity
  g.ownProduce[id] = preferOwn ? Math.max(0, own - quantity) : Math.min(own, g.produce[id])
  return true
}
// 本地规则接口，未来服务端须在同一事务中校验主人在场、看守与份额。
// 此函数不是多人接口，不以客户端状态作为线上偷菜凭据。
export function steal(g, index, visitor, ownerPresent, now) {
  if (!visitor || typeof visitor !== 'string' || ownerPresent || dogGuards(g, now)) return false
  const p = g.plots[index]
  if (!ripe(p) || p.stolen >= 2 || p.visitors.includes(visitor)) return false
  p.stolen += 1
  p.visitors.push(visitor)
  return p.crop
}
