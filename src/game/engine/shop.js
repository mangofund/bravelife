import { state, addMoney } from './core.js'
import { ITEMS, FURNITURE } from '../data/world.js'
import { SUPPLIES } from '../data/homestead.js'
import { transact, requireAction } from './transaction.js'
export function buyShopProduct(kind, id, requestId = '') {
  return transact(() => {
    const source = kind === 'item' ? ITEMS : kind === 'furniture' ? FURNITURE : kind === 'supply' ? SUPPLIES : {}
    const product = Object.hasOwn(source, id) ? source[id] : null
    requireAction(product && !product.courage && !(kind === 'furniture' && id === 'cat') && Number.isFinite(product.price) && product.price > 0, '商品暂不可购买')
    requireAction(Number.isFinite(state.money) && state.money >= product.price, '资金不足')
    const inventory = kind === 'item' ? state.bag : kind === 'furniture' ? state.furniture.inv : product.kind === 'seed' ? state.garden.seeds : state.garden.feed
    const key = kind === 'supply' ? product.target : id
    requireAction(Number.isSafeInteger((inventory[key] || 0) + 1), '库存数量已满')
    addMoney(-product.price, '商店 · ' + product.name)
    inventory[key] = (inventory[key] || 0) + 1
    return '已购入' + product.name + (kind === 'item' ? '，放入背包' : '，送入家园仓库')
  }, requestId)
}
