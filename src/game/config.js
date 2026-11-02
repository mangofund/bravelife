// 服务器下发的游戏数值配置：启动时拉取 /api/config，按 id 覆盖已有条目的字段
// 只允许修改已存在条目的数值/文字，不会新增或删除条目，避免配置写错把游戏弄坏
import { api } from './api.js'
import { CAREERS } from './data/jobs.js'
import { ITEMS, FURNITURE, HOMES, PLOTS, DELIVERY, CHORES } from './data/world.js'
import { LOCATION_MAP } from './data/locations.js'
import { MODE_MAP, VEHICLES } from './data/transport.js'
import { NPC_MAP } from './data/npcs.js'

const CACHE_KEY = 'bravelife_config_v1'

// 配置里的键 → 游戏里对应的数据表（对象按键名、数组按 id 匹配）
const TABLES = {
  careers: CAREERS,
  items: ITEMS,
  furniture: FURNITURE,
  homes: HOMES,
  plots: PLOTS,
  delivery: DELIVERY,
  chores: CHORES,
  locations: LOCATION_MAP,
  transport: MODE_MAP,
  vehicles: VEHICLES,
  npcs: NPC_MAP
}

function isObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}

// 把 patch 合并进 target：只改 target 里已有的键，类型必须一致
function merge(target, patch) {
  if (Array.isArray(target)) {
    if (!isObj(patch)) return
    Object.keys(patch).forEach((id) => {
      const item = target.filter((x) => x && (x.id === id || String(x.id) === id))[0]
      if (item) merge(item, patch[id])
    })
    return
  }
  if (!isObj(target) || !isObj(patch)) return
  Object.keys(patch).forEach((k) => {
    if (!(k in target)) return
    const cur = target[k]
    const val = patch[k]
    if (isObj(cur) || Array.isArray(cur)) merge(cur, val)
    else if (typeof cur === typeof val) target[k] = val
  })
}

export function applyConfig(game) {
  if (!isObj(game)) return
  Object.keys(TABLES).forEach((k) => {
    if (game[k]) merge(TABLES[k], game[k])
  })
}

export const configInfo = { version: 0 }

// 先用上次缓存的配置，再去服务器拿最新的（拿不到就保持内置数值）
export async function loadServerConfig() {
  try {
    const cached = uni.getStorageSync(CACHE_KEY)
    if (cached) {
      const c = JSON.parse(cached)
      applyConfig(c.game)
      configInfo.version = c.version || 0
    }
  } catch (e) {
    console.error('config cache invalid', e)
  }
  try {
    const r = await api('GET', '/api/config')
    if (r && r.version && r.version !== configInfo.version) {
      applyConfig(r.game)
      configInfo.version = r.version
      uni.setStorageSync(CACHE_KEY, JSON.stringify(r))
    }
  } catch (e) {
    // 离线时用内置数值
  }
}
