import { state, count, addStats, addSkills, clamp, round1 } from './core.js'
import { passTime, kitchenLevel, settleActivity } from './time.js'
import { isMinor } from './calendar.js'
import { logAct } from './fun.js'
import { CROPS } from '../data/garden.js'
import { ITEMS } from '../data/world.js'
import { RECIPES, HOMESTEAD_RULES } from '../data/homestead.js'
import { consumeProduce } from './garden-model.js'
import { transact, requireAction } from './transaction.js'

export function recipeInfo(id) {
  const r = Object.hasOwn(RECIPES, id) ? RECIPES[id] : null
  if (!r) return null
  const materials = [
    ...Object.entries(r.produce).map(([key, n]) => ({ id: 'seed_' + key, category: 'garden', name: CROPS[key].name, count: state.garden.produce[key] || 0, need: n, produce: true })),
    ...Object.entries(r.items).map(([key, n]) => ({ id: key, category: 'ingredient', name: ITEMS[key].name, count: state.bag[key] || 0, need: n, produce: false }))
  ]
  const missing = materials.filter(m => m.count < m.need)
  const reason = state.location !== 'home' ? '先回家再制作' : r.kitchen && !kitchenLevel() ? '需要摆放炉具或厨房' : missing.length ? '缺少' + missing.map(m => m.name + '×' + (m.need - m.count)).join('、') : ''
  const effects = { ...r.effects }
  if (r.kitchen) effects.hunger = Math.round(effects.hunger + state.skills.cook * .2)
  const actual = {}
  // 预览同样先结算行动基础消耗，实际值仍可能受跨日事件影响。
  const decay = { hunger: isMinor() ? 1.2 : 3, energy: 2.5, mood: .6 }
  for (const [key, gain] of Object.entries(effects)) {
    const beforeEating = clamp(state.stats[key] - (decay[key] || 0) * r.hours, 0, 100)
    actual[key] = round1(Math.min(gain, 100 - beforeEating))
  }
  const skill = r.cookGain ? round1(Math.min(100 - state.skills.cook, r.cookGain * kitchenLevel() * Math.max(.25, 1 - state.skills.cook / 125))) : 0
  return { id, ...r, materials, missing, reason, effects, actual, skill }
}
function experience(id, title, text, recipe = '') {
  if (state.homestead.experiences.some(e => e.id === id)) return false
  state.homestead.experiences.unshift({ id, title, text, recipe, day: state.day, at: Date.now() })
  return true
}
export function cookGardenRecipe(id, requestId = '') {
  return transact(() => {
    const info = recipeInfo(id)
    requireAction(info, '没有这道菜谱')
    requireAction(!info.reason, info.reason)
    const own = Object.entries(info.produce).every(([crop, n]) => (state.garden.ownProduce[crop] || 0) >= n)
    for (const [crop, n] of Object.entries(info.produce)) requireAction(consumeProduce(state.garden, crop, n, true), '收成不足')
    for (const [item, n] of Object.entries(info.items)) state.bag[item] -= n
    passTime(info.hours)
    addStats(info.effects)
    if (info.kitchen) { addSkills({ cook: info.cookGain }, kitchenLevel()); count('cooks') }
    count('meals'); logAct(0)
    const first = own && experience('homegrown:' + id, '第一次用自己的收成做' + info.name, '收成来自自己的菜园。这一餐的选择，成为了自己的成长经历。', id)
    const { body, extra } = settleActivity()
    return body || ('做了' + info.name + '并吃完了' + (first ? '，新经历已记入人生' : '') + (extra ? ' · ' + extra : ''))
  }, requestId)
}
export function setHomeGoal(goal) {
  return transact(() => {
    requireAction(['', 'soup', 'feed', 'stove'].includes(goal), '请选择有效的生活目标')
    state.homestead.goal = goal
    return goal ? '已设置生活目标，可随时更换' : '已隐藏生活目标'
  })
}
export function homeGoalInfo() {
  const goal = state.homestead.goal
  if (goal === 'soup') {
    const done = state.homestead.experiences.some(e => e.id === 'homegrown:radish_soup')
    return { title: '做一碗自产萝卜汤', text: done ? '已经留下第一碗自产萝卜汤的经历' : '备好萝卜种子，收获后留5份，在家摆好炉具。', done }
  }
  if (goal === 'feed') {
    const pets = Object.values(state.garden.pets).filter(Boolean), now = Math.max(Date.now(), state.garden.lastAt)
    const done = !!pets.length && pets.every(p => p.fedUntil >= now + 48 * 3600000)
    return { title: '备好离开两天的口粮', text: done ? '已领养伙伴的饱腹时间都至少还有两天' : '在家为已领养伙伴添粮；买入不会自动喂养。', done }
  }
  if (goal === 'stove') {
    const done = kitchenLevel() > 0
    return { title: '拥有自己的小厨房', text: done ? '炉具已摆好，可以开始下厨' : '卡式炉6000日元，买入仓库后还需摆放。', done }
  }
  return null
}
export const STRATEGIES = [
  { id: 'daily-garden', title: '每天回来一次的小菜园', goal: '留一些收成自己吃，其余按需要出售。', conditions: '四格菜园；每天照料一次；熟食需炉具。', steps: '选适合自己的作物→备种→播种→回访浇水→成熟收获→留够配方材料，再决定出售。', budget: '萝卜50、番茄80、草莓150日元／份种子；炉具为一次性投入。', tradeoff: '少回访会延迟收获；卖出收成与自己做饭不能同时获得同份收益。', result: '', source: '生活经营示例手记', version: HOMESTEAD_RULES },
  { id: 'pet-care', title: '出门前给伙伴备粮', goal: '按自己的回家安排照料猫狗。', conditions: '已领养伙伴；在家喂养；不强制每天上线。', steps: '查看剩余饱腹→备对应口粮→按需喂养→查看追加后的时长。', budget: '每份100日元追加24现实小时；每只最多提前备72小时。', tradeoff: '仓库有粮不会自动喂；狗的粮费不保证靠守园回本。', result: '', source: '生活经营示例手记', version: HOMESTEAD_RULES }
]
export function copyStrategy(id) {
  return transact(() => {
    const source = STRATEGIES.find(s => s.id === id) || state.homestead.drafts.find(s => s.id === id)
    requireAction(source, '没有找到这份手记')
    requireAction(state.homestead.drafts.length < 30, '草稿已满，请先删除不需要的手记')
    const draft = { ...source, id: 'draft-' + state.homestead.nextDraft++, at: Date.now(), source: source.source || '自己的草稿' }
    state.homestead.drafts.unshift(draft)
    return '已复制为自己的草稿，不会自动花钱或执行'
  })
}
export function saveStrategy(id, fields) {
  return transact(() => {
    const draft = state.homestead.drafts.find(d => d.id === id)
    requireAction(draft, '没有找到草稿')
    requireAction(typeof fields.title === 'string' && fields.title.trim(), '请填写手记标题')
    for (const key of ['title', 'goal', 'conditions', 'steps', 'budget', 'tradeoff', 'result']) {
      if (typeof fields[key] === 'string') draft[key] = fields[key].trim().slice(0, key === 'steps' ? 600 : key === 'title' ? 60 : key === 'result' ? 400 : 200)
    }
    return '草稿已保存到自己的人生存档'
  })
}
export function removeStrategy(id) {
  return transact(() => {
    requireAction(state.homestead.drafts.some(d => d.id === id), '没有找到草稿')
    state.homestead.drafts = state.homestead.drafts.filter(d => d.id !== id)
    return '已删除草稿'
  })
}
export function strategyShareText(id) {
  const draft = state.homestead.drafts.find(d => d.id === id)
  if (!draft) return ''
  const fields = {}
  for (const key of ['title', 'goal', 'conditions', 'steps', 'budget', 'tradeoff', 'result', 'version']) fields[key] = draft[key]
  return JSON.stringify({ format: 'bravelife-strategy-v1', author: state.profile?.name || '旅人', ...fields })
}
export function importStrategy(raw) {
  return transact(() => {
    requireAction(typeof raw === 'string' && raw.length <= 6000, '手记文本过长或格式无效')
    let data
    try { data = JSON.parse(raw) } catch (_) { requireAction(false, '请粘贴完整的策略分享文本') }
    requireAction(data && data.format === 'bravelife-strategy-v1' && typeof data.title === 'string' && data.title.trim(), '不是有效的策略分享文本')
    requireAction(state.homestead.drafts.length < 30, '草稿已满，请先删除不需要的手记')
    const draft = { id: 'draft-' + state.homestead.nextDraft++, at: Date.now(), source: '外部手记：' + String(data.author || '旅人').slice(0, 40) }
    for (const key of ['title', 'goal', 'conditions', 'steps', 'budget', 'tradeoff', 'result', 'version']) draft[key] = typeof data[key] === 'string' ? data[key].slice(0, key === 'steps' ? 600 : key === 'title' ? 60 : key === 'result' ? 400 : 200) : ''
    state.homestead.drafts.unshift(draft)
    return '已导入为私人草稿，实际收益与条件需自行核实'
  })
}
export function openRenConversation() {
  return transact(() => {
    requireAction(state.social.ren, '先去拉面横丁认识莲，再聊聊彼此的菜谱吧')
    requireAction(!state.homestead.ren, '这段菜谱交流已记录，可以直接查看')
    const busy = state.hour >= 18
    state.homestead.ren = { status: 'open', goal: busy ? '先做好今晚的家常汤底' : '为家里的菜单试一个清爽的新方向', reason: busy ? '晚餐时段忙碌，莲需要先照顾现有客人。' : '莲今天给自己留了一点试菜时间。', outcome: '', source: '主动与认识的莲聊菜谱', at: Date.now() }
    return '莲说起了自己的安排，是否交流由你决定'
  })
}
export function respondRen(choice) {
  return transact(() => {
    const ren = state.homestead.ren
    requireAction(ren && ren.status === 'open', '这段交流已经记录，不会重复结算')
    requireAction(['experience', 'taste', 'later', 'decline'].includes(choice), '请选择一种回应')
    const own = state.homestead.experiences.find(e => e.id.startsWith('homegrown:'))
    requireAction(choice !== 'experience' || own, '先完成一次自产料理，或直接谈谈自己的口味')
    ren.status = choice === 'decline' ? 'declined' : choice === 'later' ? 'later' : 'shared'
    ren.outcome = choice === 'decline' ? '你决定先照顾自己的生活。莲继续自己的试菜计划，没有向你索取材料。' : choice === 'later' ? '你说改天再聊。莲尊重你的安排，先按自己的计划继续。' : ren.goal === '先做好今晚的家常汤底' ? '莲记下了你的建议，决定等今晚收工后再试。你分享了想法，也保留了自己的时间和收成。' : '莲决定先试一小锅，再观察家里人的反应。你的建议成为他的参考，是否加入菜单仍由他决定。'
    ren.source = choice === 'experience' ? own.id : choice === 'taste' ? '玩家主动分享口味' : '玩家主动保留自己的安排'
    experience('ren:menu-conversation', '和莲聊起彼此的菜谱', ren.outcome)
    return '交流结果已记入人生，不消耗材料或额外发放奖励'
  })
}
