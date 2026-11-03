import { state, addMoney, addStats } from './core.js'
import { CROPS, PETS, HOUR } from '../data/garden.js'
import { SUPPLIES } from '../data/homestead.js'
import { advanceGarden, plant, harvest, ripe, consumeProduce } from './garden-model.js'
import { transact, requireAction } from './transaction.js'
export { ripe, dogGuards } from './garden-model.js'
export function syncGarden() { return advanceGarden(state.garden, Date.now()) }
function home() { requireAction(state.location === 'home', '先回家照料菜园和宠物吧') }
export function sow(index, id, requestId = '') {
  return transact(() => {
    home(); requireAction(Object.hasOwn(CROPS, id), '请选择有效的种子')
    const now = syncGarden()
    requireAction(state.garden.seeds[id] > 0, '种子不足，去商店园艺区补货吧')
    requireAction(plant(state.garden, index, id, now), '这块地暂时不能播种')
    state.garden.seeds[id]--
    return '播下了' + CROPS[id].name + '，消耗种子1份，已浇好水'
  }, requestId)
}
export function waterGarden(requestId = '') {
  return transact(() => {
    home(); const now = syncGarden(); let n = 0
    for (const p of state.garden.plots) if (p && !ripe(p) && p.waterUntil < now + 24 * HOUR) { p.waterUntil = now + 24 * HOUR; n++ }
    return n ? '浇好水了，接下来一天正常生长' : '暂时没有需要浇水的作物'
  }, requestId)
}
export function reap(requestId = '') {
  return transact(() => {
    home(); syncGarden(); let n = 0
    state.garden.plots.forEach((_, i) => { n += harvest(state.garden, i) })
    return n ? '收获了 ' + n + ' 份，放进菜园收成篮' : '还没有成熟的作物'
  }, requestId)
}
export function useProduce(id, sell = false, requestId = '') {
  return transact(() => {
    home(); requireAction(Object.hasOwn(CROPS, id) && state.garden.produce[id] > 0, '收成篮里没有这份作物')
    const n = sell ? state.garden.produce[id] : 1
    requireAction(consumeProduce(state.garden, id, n), '收成数量不足')
    if (sell) addMoney(n * CROPS[id].price, '菜园 · 出售' + CROPS[id].name)
    else addStats({ hunger: CROPS[id].hunger })
    return sell ? '卖出了 ' + n + ' 份' + CROPS[id].name : '吃了一份' + CROPS[id].name
  }, requestId)
}
export function adopt(kind, requestId = '') {
  return transact(() => {
    home(); requireAction(Object.hasOwn(PETS, kind) && !state.garden.pets[kind], '已经有这位伙伴了')
    requireAction(state.money >= PETS[kind].adoption, '领养安置费不够')
    const now = syncGarden()
    state.garden.pets[kind] = { fedUntil: now + 24 * HOUR, energy: 100, lastCuddle: 0 }
    addMoney(-PETS[kind].adoption, '宠物 · 领养安置')
    return '欢迎' + PETS[kind].name + '回家！已备好一天口粮和饮水'
  }, requestId)
}
export function feed(kind, requestId = '') {
  return transact(() => {
    home(); const now = syncGarden(), def = SUPPLIES['feed_' + kind], pet = state.garden.pets[kind]
    requireAction(def && pet, '请先领养这位伙伴')
    requireAction(state.garden.feed[kind] > 0, '口粮不足，去商店宠物区补货吧')
    requireAction(Math.max(0, pet.fedUntil - now) + def.hours * HOUR <= def.capHours * HOUR, '现有口粮还很充足，稍后再添')
    pet.fedUntil = Math.max(now, pet.fedUntil) + def.hours * HOUR
    state.garden.feed[kind]--
    return kind === 'dog' ? '追加一天口粮，小狗回菜园看守' : '追加一天口粮，小猫在家陪伴'
  }, requestId)
}
export function cuddleCat(requestId = '') {
  return transact(() => {
    home(); const now = syncGarden(), cat = state.garden.pets.cat
    requireAction(cat, '先领养一只小猫吧')
    requireAction(cat.fedUntil > now, '小猫肚子饿了，先添点口粮吧')
    if (!cat.lastCuddle || now - cat.lastCuddle >= 24 * HOUR) {
      cat.lastCuddle = now; addStats({ mood: 4 }); return '小猫蹭了蹭你，心情 +4'
    }
    return '陪小猫玩了一会儿，它舒服地打着呼噜'
  }, requestId)
}
