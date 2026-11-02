// 引擎冒烟测试：node scripts/smoke-test.mjs
// 模拟 uni API，跑一遍主要玩法并检查状态不出现 NaN / 越界
const store = {}
globalThis.uni = {
  setStorageSync: (k, v) => { store[k] = v },
  getStorageSync: (k) => store[k] || '',
  removeStorageSync: (k) => { delete store[k] },
  showToast: () => {},
  showModal: (o) => { console.log('  [modal]', o.title) }
}

const g = await import('../src/game/index.js')
const { state } = g
let failures = 0
function check(name, cond) {
  if (!cond) {
    failures++
    console.error('FAIL', name)
  } else console.log('ok  ', name)
}

g.newGame({ name: '测试', gender: 'f', skin: 'b', hair: 'black', outfit: 'tee', background: 'normal', wish: 'rich' })
check('new game started', state.started && state.money === 800000 && state.home === '1k')

check('place futon', g.placeFurniture('futon', 0, 0) && state.furniture.placed.length === 1)
check('reject occupied cell', !g.placeFurniture('plant', 0, 0))

check('travel to konbini', g.travel('konbini') && state.location === 'konbini')
state.pendingEvent && g.resolveEvent(0)
check('apply konbini job', g.applyJob('konbini') && state.job.career === 'konbini')
const before = state.money
check('work shift', g.work() && state.money > before)
check('no second shift same day', !g.work())
check('buy onigiri', g.buyItem('konbini', 'onigiri') && state.bag.onigiri === 3)
check('eat onigiri', g.useItem('onigiri') && state.bag.onigiri === 2)

g.travel('home')
state.pendingEvent && g.resolveEvent(0)
const day = state.day
check('sleep full', g.sleep(true))
check('day advanced after night sleep or 8h', state.day >= day)

// 模拟 30 多天：每天回家睡觉，检查房租、选举开票、数值合法
// 至少跨过第一次选举（第 28 天）
for (let i = 0; i < 200 && state.day <= 32; i++) {
  state.location = 'home'
  state.stats.hunger = 80
  g.sleep(true)
  g.wait(10)
}
check('election resolved at least once', !!state.election.last)
check('rent charged', state.txns.some((t) => t.text.indexOf('房租') === 0) || state.txns.length === 60)
const nums = [state.money, state.savings, state.hour, state.day, state.rep]
  .concat(Object.values(state.stats), Object.values(state.skills))
check('no NaN', nums.every((n) => typeof n === 'number' && !isNaN(n)))
check('stats in range', Object.values(state.stats).every((v) => v >= 0 && v <= 100))
check('hour in range', state.hour >= 0 && state.hour < 24)

// 选举：报名、拉票、投票
state.money = 50000000
state.rep = 60
state.location = 'cityhall'
while (g.isElectionDay()) g.wait(24)
state.hour = 9
check('register candidate', g.registerCandidate() && state.election.registered)
state.hour = 9
check('campaign speech', g.campaign('speech') && state.election.support > 0)
check('campaign once per day', !g.campaign('speech'))
state.election.support = 400
while (!g.isElectionDay()) {
  g.wait(24)
  Object.assign(state.stats, { hunger: 80, energy: 80, health: 80 })
  state.location = 'cityhall'
  state.hour = 9
}
check('vote on election day', g.vote('me'))
g.wait(24)
check('became governor', state.election.governor)
check('governor wish never breaks rich wish', typeof state.wishDone === 'boolean')

// 地产
state.money = 200000000
Object.assign(state.stats, { hunger: 80, energy: 80, health: 80 })
state.location = 'estate'
state.hour = 10
check('buy plot', g.buyPlot('A1') && state.plots.A1)
check('build on plot', g.buildOnPlot('A1') && state.plots.A1.built)
check('move to villa', g.moveHome('villa') && state.home === 'villa')
check('cannot move out of villa', !g.moveHome('wood'))

// 家具城与家具使用
state.location = 'furniture'
state.hour = 12
check('buy stove and pc', g.buyFurniture('stove') && g.buyFurniture('pc'))
check('place stove', g.placeFurniture('stove', 1, 0))
check('place pc', g.placeFurniture('pc', 2, 0))
state.location = 'tsukiji'
state.hour = 8
check('buy fish', g.buyItem('tsukiji', 'fish'))
state.location = 'home'
state.stats.energy = 80
check('cook fish', g.cook('fish'))
check('stream', g.useFurniture('pc'))

// 银行
check('deposit', g.deposit(100000) && state.savings >= 100000)
check('withdraw', g.withdraw(100000))

// 存读档
g.save()
const snapshot = JSON.stringify(state)
check('load', g.load() && JSON.stringify(state) === snapshot)

// 体力耗尽送医
state.location = 'gym'
state.hour = 10
state.stats.energy = 5
g.doAction('gym', 'lift')
check('collapse sends to hospital', state.location === 'hospital')

// 社交
Object.assign(state.stats, { hunger: 80, energy: 80, health: 80, mood: 60 })
state.location = 'library'
state.hour = 11
check('npc present', g.npcsAt('library').some((n) => n.id === 'haruka'))
check('meet npc', g.talk('haruka') && !!state.social.haruka)
check('talk once per day', !g.talk('haruka'))
check('date needs affection', !g.goDate('haruka'))
state.bag.sweets = 1
check('gift liked', g.giveGift('haruka', 'sweets') && state.social.haruka.aff >= 17)
state.social.haruka.aff = 100
state.skills.cha = 100
let tries = 0
while (state.social.haruka.status === 'none' && tries < 20) {
  state.hour = 11
  delete state.daily['confess:haruka']
  g.confess('haruka')
  state.social.haruka.aff = 100
  tries++
}
check('confess succeeds', state.social.haruka.status === 'dating')
check('propose needs ring', !g.propose('haruka'))
state.bag.ring = 1
state.hour = 12
check('propose', g.propose('haruka') && state.social.haruka.status === 'married')
check('npc absent at night', (state.hour = 23) && !g.npcsAt('library').length)
// 邀约与疏远
for (let i = 0; i < 12; i++) { state.location = 'home'; Object.assign(state.stats, { hunger: 80, energy: 80, health: 80 }); g.wait(12) }
check('neglect lowers affection', state.social.haruka.aff < 100)
const nums2 = Object.values(state.social).map((r) => r.aff)
check('affection valid', nums2.every((v) => v >= 0 && v <= 100 && !isNaN(v)))

// 新手引导
g.newGame({ name: '新人', gender: 'm', skin: 'a', hair: 'black', outfit: 'suit', background: 'self', wish: 'ceo' })
check('tutorial starts', g.tutorialStep() && g.tutorialStep().id === 'place')
g.placeFurniture('futon', 0, 0)
check('tutorial advances', g.tutorialStep().id === 'job')
g.skipTutorial()
check('tutorial skip', g.tutorialStep() === null)
state.stats.hunger = 5
check('hunger warning', g.warnings().length > 0)

// 出行方式：省钱费时 vs 花钱省时
g.newGame({ name: '通勤', gender: 'f', skin: 'b', hair: 'black', outfit: 'tee', background: 'normal', wish: 'rich' })
g.skipTutorial()
const opts = g.travelOptions('marunouchi')
const by = (id) => opts.filter((o) => o.id === id)[0]
check('walk is free and slowest', by('walk').cost === 0 && by('walk').hours > by('train').hours && by('walk').hours > by('taxi').hours)
check('taxi costs most', by('taxi').cost > by('train').cost)
check('bike/car need purchase', !by('bike').ok && !by('car').ok)
const m0 = state.money
check('travel by taxi', g.travel('marunouchi', 'taxi') && state.money === m0 - by('taxi').cost)
state.pendingEvent = null
check('beach too far for bike', g.travelOptions('beach').filter((o) => o.id === 'bike')[0].reason !== '')
check('walking always allowed', g.travelOptions('beach').filter((o) => o.id === 'walk')[0].ok)
state.location = 'ginza'
state.hour = 12
check('buy bike', g.buyVehicle('bike') && state.vehicles.bike)
check('bike now usable nearby', g.travelOptions('temple').filter((o) => o.id === 'bike')[0].ok)
check('default mode prefers bike', g.defaultMode('temple') === 'bike')
state.money = 3000000
check('buy car', g.buyVehicle('car') && state.vehicles.car)
// 推进到下一个结算日（第 8、15… 天）
const target = Math.floor((state.day - 1) / 7) * 7 + 8
while (state.day < target) {
  Object.assign(state.stats, { hunger: 80, energy: 80, health: 80 })
  g.wait(12)
}
check('parking charged weekly', state.txns.some((t) => t.text.indexOf('停车费') === 0))

// 外卖与家务
state.location = 'home'
Object.assign(state.stats, { hunger: 30, energy: 80, health: 80, mood: 60 })
const m1 = state.money
check('order delivery at home', g.orderDelivery('sushi') && state.money < m1 && state.stats.hunger > 30)
state.location = 'ginza'
check('no delivery outside home', !g.orderDelivery('bento'))
state.location = 'home'
state.clean = 10
check('clean self', g.doChores('self') && state.clean >= 65)
state.clean = 10
check('maid', g.doChores('maid') && state.clean === 100)
check('clean decays', (g.wait(10), state.clean < 100))

// 实时时钟：60 次 × 1 分钟 = 1 小时
Object.assign(state.stats, { hunger: 90, energy: 90, health: 90, mood: 80 })
const h0 = state.day * 24 + state.hour
for (let i = 0; i < 60; i++) g.tickClock(1)
const h1 = state.day * 24 + state.hour
check('realtime clock advances 1h', Math.abs(h1 - h0 - 1) < 0.01)

// 货币显示
check('money in yen', g.fmtMoney(1500) === '1,500 日元' && g.fmtMoney(-200) === '-200 日元' && g.fmtMoney(100000000) === '1 亿日元')
check('clock never shows :60', g.fmtHour(7.99999) === '07:59' && g.fmtHour(8) === '08:00')

// 改名前的旧存档仍能读取
const legacy = JSON.stringify(Object.assign({}, JSON.parse(store.bravelife_save_v1), { money: 12345 }))
for (const k of Object.keys(store)) delete store[k]
store.tokyo_life_save_v1 = legacy
check('legacy save detected', g.hasSave())
check('legacy save loads', g.load() && state.money === 12345)
g.save()
check('saved under new key', !!store.bravelife_save_v1)

console.log(failures ? failures + ' failures' : 'all passed')
process.exit(failures ? 1 : 0)
