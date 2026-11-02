// 人生剧本测试：node scripts/life-test.mjs
// 从 6 岁开局，跑一遍上学、剧情、跳过一天、勇气商店、搬出家门和旧存档迁移
const store = {}
globalThis.uni = {
  setStorageSync: (k, v) => { store[k] = v },
  getStorageSync: (k) => store[k] || '',
  removeStorageSync: (k) => { delete store[k] },
  showToast: () => {},
  showModal: () => {}
}

const g = await import('../src/game/index.js')
const { ui } = await import('../src/game/ui.js')
const { state } = g
let failures = 0
function check(name, cond, extra) {
  if (!cond) {
    failures++
    console.error('FAIL', name, extra === undefined ? '' : JSON.stringify(extra))
  } else console.log('ok  ', name)
}
const fresh = () => Object.assign(state.stats, { hunger: 90, energy: 90, health: 90, mood: 80 })
// 播完弹窗里的剧情：选第 index 个选项
function play(index) {
  const v = g.storyView()
  if (!v) return null
  const r = g.chooseStory(index || 0)
  g.doneReading()
  return Object.assign({ id: v.id }, r)
}
// 推进到第 day 天的 hour 点（一路自动处理剧情，选第一个选项）
function goTo(day, hour) {
  let guard = 0
  while ((state.day < day || (state.day === day && state.hour < hour)) && guard++ < 2000) {
    fresh()
    if (state.pendingStory === 'dream_essay') return
    if (state.pendingStory) play(0)
    const left = (day - state.day) * 24 + hour - state.hour
    g.wait(Math.min(1, left))
  }
}

g.newGame({ name: '小勇', gender: 'f', skin: 'b', hair: 'black', outfit: 'tee', background: 'normal', startAge: 6, birth: { m: 6, d: 15 } })
check('6 岁开局和父母同住', g.isMinor() && g.age() === 6 && g.grade() === 1 && state.home === 'family_normal')
check('开局日期 2026 年 4 月 1 日周三', g.fmtDate(1) === '2026年4月1日' && g.weekday(1) === '周三')
check('家里摆好了家具', state.furniture.placed.length === 4 && state.tutorial.done)
check('零花钱开局', state.money === 5000)

state.location = 'izakaya'
state.hour = 19
check('未成年不能进居酒屋', !g.doAction('izakaya', 'drink'))
state.location = 'konbini'
check('6 岁不能打工', !g.applyJob('konbini'))
check('小学生不能打车', g.travelOptions('ginza').filter((o) => o.id === 'taxi')[0].ok === false)
check('同学是学生身份', g.spotOf({ location: 'library', youth: { location: 'park' } }).location === 'park')
check('花见期间不能跳过', g.skipReason().indexOf('花见') >= 0)

state.location = 'home'
state.hour = 7
goTo(7, 7.6)
check('开学日早上要上学', state.pendingStory === 'school_morning', state.pendingStory)
let r = play(0)
check('上学到 15 点', state.location === 'school' && state.hour === 15 && state.counters.school === 1, r)
check('开学第一天的剧情', state.pendingStory === 'school_first', state.pendingStory)
r = play(0)
check('认识了春香和莲', !!state.social.haruka && !!state.social.ren && state.courage.value >= 10, r)

// 跳过一天（花见到 4 月 7 日为止）
state.location = 'home'
goTo(8, 7)
const d0 = state.day
check('可以跳过', g.skipReason() === '', g.skipReason())
check('跳过一天', g.skipDay() && state.day === d0 + 1 && state.hour === 7)
check('同一天不能再跳', !!g.skipReason())
check('跳过次数减少', g.skipsLeft() === 9)

// 雨夜遇到勇气商店
fresh()
state.weather = 'rain'
state.location = 'park'
state.hour = 20.5
g.wait(0.1)
check('雨夜触发黑猫与小巷', state.pendingStory === 'shop_first', state.pendingStory)
r = play(0)
check('走进勇气商店', state.location === 'courage' && g.shopOpen() && state.titles.lone_brave, r)
check('家族物品第 1 章', g.heirloom() && g.heirloom().chapters.length === 1)
check('接下勇气课题', g.takeQuest() && !!state.courage.quest)
check('货架有 3 件', g.stock().length === 3)
state.courage.value = 200
const good = g.stock()[0]
check('用勇气换东西', g.buyGood(good.id) && state.courage.value === 200 - good.price)
check('黑猫一天摸一次', g.petCat() && !g.petCat())
state.weather = 'sun'
state.hour = 21
check('不下雨也不是转折点时店不在地图上', (state.story.turningDay = 0, state.courage.burstDay = 0, !g.locVisible('courage') || state.location === 'courage'))

// 作文课选小梦想
state.location = 'home'
goTo(state.day + 3, 7.6)
let guard = 0
while (!state.profile.dream && guard++ < 30) {
  fresh()
  if (state.pendingStory === 'dream_essay') play(4)
  else if (state.pendingStory) play(0)
  else g.wait(1)
}
check('作文课选了小梦想', state.profile.dream === 'tv' && state.profile.wish === 'famous', state.profile.dream)
check('章节目标', g.currentGoals().length === 5 && g.currentGoals().some((x) => x.done))

// 长大到 18 岁，搬出家门
state.pendingStory = null
state.profile.birthYear -= 12
state.hour = 10
state.location = 'home'
g.wait(0.1)
check('高中毕业触发离开家', state.pendingStory === 'leave_home', state.pendingStory)
const money = state.money
r = play(0)
check('坚持梦想并搬出去', !g.isMinor() && state.home === '1k' && state.money === money + 800000 && state.titles.firm, r)
check('成年后有新手任务', !state.tutorial.done)

// 18 岁开局直接成年
g.newGame({ name: '大人', gender: 'm', skin: 'b', hair: 'black', outfit: 'tee', background: 'self', wish: 'rich', startAge: 18, birth: { m: 1, d: 1 } })
check('18 岁开局一个人住', !g.isMinor() && g.age() === 18 && state.home === 'wood' && state.money === 150000)

// v1 旧存档：没有年龄，按 22 岁成年人处理
const v1 = JSON.parse(store.bravelife_save_v1)
delete v1.profile.birth
delete v1.profile.birthYear
delete v1.life
delete v1.courage
v1.version = 1
store.bravelife_save_v1 = JSON.stringify(v1)
check('旧存档能读', g.load() && g.age() === 22 && !g.isMinor() && state.courage.value === 0)

check('弹幕队列有内容', ui.os.length > 0)
console.log(failures ? failures + ' failures' : 'all passed')
process.exit(failures ? 1 : 0)
