import { state, addMoney, pushMessage, pushNews, fmtMoney, isOpen } from './core.js'
import { finish, fail } from './time.js'
import { LOCATION_MAP } from '../data/locations.js'
import { FURNITURE, HOMES, PLOTS, BUILD_COST } from '../data/world.js'
import { contractBlock } from './life.js'

function atOpen(locId) {
  const loc = LOCATION_MAP[locId]
  if (state.location !== locId) return '要去' + loc.name + '办理'
  if (!isOpen(loc)) return loc.name + '现在不营业'
  return ''
}

// ---------- 家具 ----------

export function buyFurniture(fid) {
  const err = atOpen('furniture')
  if (err) return fail(err)
  const f = FURNITURE[fid]
  if (state.money < f.price) return fail('钱不够，需要 ' + fmtMoney(f.price))
  addMoney(-f.price, '家具 · ' + f.name)
  state.furniture.inv[fid] = (state.furniture.inv[fid] || 0) + 1
  return finish('买了 ' + f.name + '，已送到家具仓库，去「家」里摆放')
}

export function cellAt(x, y) {
  return state.furniture.placed.filter((p) => p.x === x && p.y === y)[0] || null
}

export function placeFurniture(fid, x, y) {
  const home = HOMES[state.home]
  if (!state.furniture.inv[fid]) return fail('仓库里没有这件家具')
  if (x < 0 || y < 0 || x >= home.cols || y >= home.rows) return fail('超出房间范围')
  if (cellAt(x, y)) return fail('这个格子已经有东西了')
  state.furniture.inv[fid] -= 1
  if (!state.furniture.inv[fid]) delete state.furniture.inv[fid]
  state.furniture.placed.push({ uid: state.nextUid, fid, x, y })
  state.nextUid += 1
  return finish('摆好了 ' + FURNITURE[fid].name)
}

export function removeFurniture(uid) {
  const idx = state.furniture.placed.findIndex((p) => p.uid === uid)
  if (idx < 0) return fail('找不到这件家具')
  const p = state.furniture.placed[idx]
  state.furniture.placed.splice(idx, 1)
  state.furniture.inv[p.fid] = (state.furniture.inv[p.fid] || 0) + 1
  return finish('已收回仓库：' + FURNITURE[p.fid].name)
}

// 搬家后放不下的家具退回仓库
export function fitFurniture() {
  const home = HOMES[state.home]
  const keep = []
  state.furniture.placed.forEach((p) => {
    if (p.x < home.cols && p.y < home.rows) keep.push(p)
    else state.furniture.inv[p.fid] = (state.furniture.inv[p.fid] || 0) + 1
  })
  state.furniture.placed = keep
}

// ---------- 住房与地块 ----------

export function moveHome(homeId) {
  const err = atOpen('estate')
  if (err) return fail(err)
  if (contractBlock()) return fail(contractBlock())
  if (state.home === homeId) return fail('你已经住在这里了')
  if (state.home === 'villa') return fail('海景别墅是你自己的房子，不需要再租房')
  const h = HOMES[homeId]
  if (!h || h.family) return fail('这里不出租')
  const cost = h.price || h.rent
  if (state.money < cost) return fail('钱不够，需要 ' + fmtMoney(cost))
  addMoney(-cost, h.price ? '购房 · ' + h.name : '押金 · ' + h.name)
  state.home = homeId
  fitFurniture()
  if (h.price) {
    pushNews('【楼市】一栋湾岸海景别墅以 ' + fmtMoney(h.price) + ' 成交，买家是 ' + state.profile.name + '。')
    pushMessage('不动产中介', '恭喜！海景别墅过户完成，从此不用再交房租。')
    return finish('🌊 买下了湾岸海景别墅！')
  }
  pushMessage('不动产中介', '搬家完成！新家是' + h.name + '，每周房租 ' + fmtMoney(h.rent) + '。')
  return finish('搬进了 ' + h.name)
}

export function buyPlot(id) {
  const err = atOpen('estate')
  if (err) return fail(err)
  if (contractBlock()) return fail(contractBlock())
  const p = PLOTS.filter((x) => x.id === id)[0]
  if (!p) return fail('没有这块地')
  if (state.plots[id]) return fail('这块地已经是你的了')
  if (state.money < p.price) return fail('钱不够，需要 ' + fmtMoney(p.price))
  addMoney(-p.price, '湾岸地块 ' + id)
  state.plots[id] = { built: false }
  return finish('买下了湾岸地块 ' + id)
}

export function buildOnPlot(id) {
  const err = atOpen('estate')
  if (err) return fail(err)
  const own = state.plots[id]
  if (!own) return fail('先买下这块地')
  if (own.built) return fail('已经盖好了')
  if (state.money < BUILD_COST) return fail('钱不够，需要 ' + fmtMoney(BUILD_COST))
  addMoney(-BUILD_COST, '建造公寓 · ' + id)
  own.built = true
  pushMessage('不动产中介', '地块 ' + id + ' 的公寓楼竣工了，租客已经入住，每天自动收租。')
  return finish('🏗️ 地块 ' + id + ' 的公寓楼竣工')
}

// ---------- 银行（手机银行，随时可用） ----------

export function deposit(amount) {
  const a = Math.floor(amount)
  if (a <= 0) return fail('金额不正确')
  if (state.money < a) return fail('余额不足')
  addMoney(-a, '存入储蓄')
  state.savings += a
  return finish('已存入 ' + fmtMoney(a))
}

export function withdraw(amount) {
  const a = Math.floor(amount)
  if (a <= 0) return fail('金额不正确')
  if (state.savings < a) return fail('储蓄不足')
  state.savings -= a
  addMoney(a, '取出储蓄')
  return finish('已取出 ' + fmtMoney(a))
}
