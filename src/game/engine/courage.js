// 勇气商店：勇气值、开门条件、商品、勇气课题、家族物品的故事
import { state, pushMessage, addStats } from './core.js'
import { finish, fail } from './time.js'
import { isRaining, isMinor, grade } from './calendar.js'
import { os } from './fun.js'
import { LOCATION_MAP } from '../data/locations.js'
import {
  GOODS, QUESTS, HEIRLOOMS, BG_HEIRLOOM, RETRY_MAX, QUEST_REWARD, PAGES_PER_CHAPTER, COURAGE_BURST, KEEPER_LINES
} from '../data/courage.js'

const KEEPER = '勇气商店'

export function addCourage(v, reason) {
  if (!v) return
  const c = state.courage
  c.value += v
  c.total += v
  // 累计勇气每过一个整百，今晚商店会亮灯
  const m = Math.floor(c.total / COURAGE_BURST)
  if (m > c.milestone) {
    c.milestone = m
    c.burstDay = state.day
    if (state.story.flags.shop_found) pushMessage(KEEPER, '今晚小巷里好像亮着灯。（累计勇气 ' + m * COURAGE_BURST + '）')
  }
  if (reason) os(v >= 20 ? 'fail' : 'brave', 0.6)
}

// 人生里的「第一次」只奖励一次
export function first(key, v) {
  const f = state.courage.firsts
  if (f[key]) return false
  f[key] = state.day
  addCourage(v || 10)
  return true
}

export function shopOpen() {
  if (!state.story.flags.shop_found) return false
  const h = state.hour
  if (h < 20) return false
  const c = state.courage
  return isRaining() || state.story.turningDay === state.day || c.burstDay === state.day
}

// 地图上是否显示：勇气商店只在开门时出现；学校只在 18 岁前出现
export function locVisible(id) {
  const loc = LOCATION_MAP[id]
  if (!loc) return false
  if (state.location === id) return true
  if (loc.minorOnly && !isMinor()) return false
  if (id === 'courage') return shopOpen()
  return true
}

export function keeperLine() {
  return KEEPER_LINES[(state.day + state.courage.questsDone) % KEEPER_LINES.length]
}

// 今天的货架：按日期固定挑 3 件，同一天来几次都一样
export function stock() {
  const c = state.courage
  if (!c.stock || c.stock.day !== state.day) {
    const ids = GOODS.map((g) => g.id)
    const pick = []
    let seed = state.day * 7 + 3
    while (pick.length < 3) {
      seed = (seed * 31 + 17) % 997
      const id = ids[seed % ids.length]
      if (pick.indexOf(id) < 0) pick.push(id)
    }
    c.stock = { day: state.day, ids: pick, sold: [] }
  }
  return c.stock.ids.map((id) => {
    const g = GOODS.filter((x) => x.id === id)[0]
    return Object.assign({ sold: c.stock.sold.indexOf(id) >= 0 }, g)
  })
}

function inShop() {
  if (state.location !== 'courage') return '你不在勇气商店'
  if (!shopOpen()) return '店里的灯已经熄了'
  return ''
}

export function buyGood(id) {
  const err = inShop()
  if (err) return fail(err)
  const g = stock().filter((x) => x.id === id)[0]
  if (!g) return fail('今天的货架上没有这个')
  if (g.sold) return fail('这件已经换走了')
  const c = state.courage
  if (c.value < g.price) return fail('勇气不够，需要 ' + g.price)
  if (g.kind === 'retry' && c.retryUsed >= RETRY_MAX) return fail('这一代的第二次机会已经用完了')
  c.value -= g.price
  c.stock.sold.push(id)
  if (g.kind === 'retry') c.charms.retry = (c.charms.retry || 0) + 1
  else if (g.kind === 'charm') {
    if (g.days) c.charms[id] = state.day + g.days
    else c.charms[id] = (c.charms[id] || 0) + 1
  } else {
    state.furniture.inv[id] = (state.furniture.inv[id] || 0) + 1
    pushMessage(KEEPER, g.name + '：' + g.story)
  }
  return finish(g.icon + ' 换到了「' + g.name + '」' + (g.kind === 'old' ? '，放进了家具仓库' : ''))
}

export function charmActive(id) {
  const v = state.courage.charms[id]
  return !!v && v >= state.day
}

// 用掉一个次数型护身符
export function useCharm(id) {
  const ch = state.courage.charms
  if (!ch[id]) return false
  ch[id] -= 1
  if (id === 'retry') state.courage.retryUsed += 1
  return true
}

function questStage() {
  if (!isMinor()) return 'adult'
  return grade() <= 6 ? 'kid' : 'teen'
}

export function questDef(id) {
  return QUESTS.filter((q) => q.id === id)[0]
}

export function takeQuest() {
  const err = inShop()
  if (err) return fail(err)
  const c = state.courage
  if (c.quest) return fail('先完成手上的课题')
  const st = questStage()
  const pool = QUESTS.filter((q) => q.stages.indexOf(st) >= 0)
  const q = pool[(state.day + c.questsDone * 3) % pool.length]
  c.quest = { id: q.id, base: q.metric(state), until: state.day + q.days }
  pushMessage(KEEPER, '勇气课题：' + q.text + '（' + q.days + ' 天内）')
  return finish('📜 接下了勇气课题')
}

// 每次行动后检查课题是否完成
export function checkQuest() {
  const c = state.courage
  if (!c.quest) return ''
  const q = questDef(c.quest.id)
  if (!q) {
    c.quest = null
    return ''
  }
  if (q.metric(state) <= c.quest.base) return ''
  c.quest = null
  c.questsDone += 1
  c.pages += 1
  addCourage(QUEST_REWARD)
  const unlocked = unlockChapters()
  pushMessage(KEEPER, '课题完成了。这枚书页你收好。' + (unlocked ? '家族物品的故事又翻开了一页。' : ''))
  return '📜 勇气课题完成！勇气 +' + QUEST_REWARD + '，书页 +1'
}

// 第 1 章第一次进店就送；之后每 PAGES_PER_CHAPTER 枚书页解锁一章
function unlockChapters() {
  const c = state.courage
  const h = HEIRLOOMS[state.family.heirloom]
  if (!h) return false
  const want = Math.min(h.chapters.length, 1 + Math.floor(c.pages / PAGES_PER_CHAPTER))
  if (want > c.chapters) {
    c.chapters = want
    return true
  }
  return false
}

export function heirloom() {
  const h = HEIRLOOMS[state.family.heirloom]
  if (!h) return null
  return { name: h.name, icon: h.icon, chapters: h.chapters.slice(0, state.courage.chapters), total: h.chapters.length }
}

export function courageNewDay() {
  const c = state.courage
  if (c.quest && state.day > c.quest.until) {
    c.quest = null
    pushMessage(KEEPER, '课题过期了。……下次吧。')
  }
}

export function firstVisit() {
  const bg = state.profile.background
  if (!state.family.heirloom) state.family.heirloom = BG_HEIRLOOM[bg] || 'bento'
  unlockChapters()
}

// 摸摸黑猫「夜」：每天一次
export function petCat() {
  const err = inShop()
  if (err) return fail(err)
  if (state.courage.catDay === state.day) return fail('夜已经睡回去了')
  state.courage.catDay = state.day
  addStats({ mood: 5 })
  os('shop')
  return finish('🐈‍⬛ 夜眯着眼蹭了蹭你的手。心情 +5')
}
