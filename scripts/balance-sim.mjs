// 数值平衡模拟：node scripts/balance-sim.mjs
// 用简单的自动玩家按不同路线玩，统计各人生愿望在第几天达成
const store = {}
globalThis.uni = {
  setStorageSync: (k, v) => { store[k] = v },
  getStorageSync: (k) => store[k] || '',
  removeStorageSync: () => {},
  showToast: () => {},
  showModal: () => {}
}
const g = await import('../src/game/index.js')
const { CAREERS, PROMOTE_SHIFTS } = await import('../src/game/data/jobs.js')
const { LOCATION_MAP } = await import('../src/game/data/locations.js')
const { PLOTS, BUILD_COST } = await import('../src/game/data/world.js')
const { state } = g
const MAX_DAYS = 400

function go(loc) {
  if (state.location !== loc) g.travel(loc)
  if (state.pendingEvent) g.resolveEvent(0)
}
const open = (loc) => g.isOpen(LOCATION_MAP[loc])
const usedToday = (k) => state.daily[k] === state.day

function eat() {
  if (state.bag.bento) return g.useItem('bento')
  go('konbini')
  g.buyItem('konbini', 'bento'); g.buyItem('konbini', 'bento')
  g.useItem('bento')
}

function trainFor(req) {
  const need = Object.keys(req || {}).filter((k) => k !== 'rep' && state.skills[k] < req[k])
  const k = need[0]
  if (!k) return false
  if (k === 'int' && open('library')) { go('library'); return g.doAction('library', 'study') }
  if (k === 'cre' && open('library')) { go('library'); return g.doAction('library', 'novel') }
  if (k === 'cha' && open('karaoke')) { go('karaoke'); return g.doAction('karaoke', 'sing') }
  if (k === 'fit' && open('gym')) { go('gym'); return g.doAction('gym', 'lift') }
  if (k === 'cook' && open('tsukiji')) { go('tsukiji'); return g.doAction('tsukiji', 'kaisendon') }
  return false
}

function repActions() {
  if (open('temple') && !usedToday('temple:donate') && state.money > 50000) { go('temple'); return g.doAction('temple', 'donate') }
  if (open('hospital') && !usedToday('hospital:blood') && state.stats.health > 50) { go('hospital'); return g.doAction('hospital', 'blood') }
  if (open('police') && !usedToday('police:patrol') && state.stats.energy > 40) { go('police'); return g.doAction('police', 'patrol') }
  return false
}

function invest() {
  if (state.location !== 'estate' && !open('estate')) return false
  const reserve = 300000
  const next = PLOTS.filter((p) => !state.plots[p.id])[0]
  const unbuilt = Object.keys(state.plots).filter((id) => !state.plots[id].built)[0]
  if (unbuilt && state.money > BUILD_COST + reserve) { go('estate'); return g.buildOnPlot(unbuilt) }
  if (!unbuilt && next && state.money > next.price + reserve) { go('estate'); return g.buyPlot(next.id) }
  return false
}

function election() {
  const e = state.election
  if (!open('cityhall')) return false
  if (g.isElectionDay()) {
    if (!e.voted) { go('cityhall'); return g.vote(e.registered ? 'me' : 'sato') }
    return false
  }
  if (!e.registered && state.rep >= 40 && state.money >= 1200000 && g.daysToElection() >= 5) { go('cityhall'); return g.registerCandidate() }
  if (e.registered) {
    if (!usedToday('campaign:speech')) { go('cityhall'); return g.campaign('speech') }
    if (!usedToday('campaign:flyer') && state.money > 200000) { go('cityhall'); return g.campaign('flyer') }
    if (!usedToday('campaign:tv') && state.money > 4000000) { go('cityhall'); return g.campaign('tv') }
  }
  return false
}

function step(route) {
  const s = state.stats
  if (s.hunger < 35) return eat()
  if (s.energy < 25 || state.hour >= 22 || state.hour < 5) { go('home'); return g.sleep(true) }
  if (s.mood < 25 && open('onsen')) { go('onsen'); return g.doAction('onsen', 'bath') }
  if (s.mood < 25) { go('park'); return g.doAction('park', 'walk') }
  if (s.health < 35 && open('hospital')) { go('hospital'); return g.doAction('hospital', 'treat') }

  const job = state.job
  const c = CAREERS[route.career]
  if (!job || job.career !== route.career) {
    if (open(c.location) && Object.keys(c.levels[0].req).every((k) => (k === 'rep' ? state.rep : state.skills[k]) >= c.levels[0].req[k])) {
      go(c.location)
      if (g.applyJob(route.career)) return true
    }
    if (trainFor(c.levels[0].req)) return true
    if (!job && open('konbini')) { go('konbini'); g.applyJob('konbini') }
  }
  if (state.job && !g.canStartShift()) return g.work()
  const jc = state.job && CAREERS[state.job.career]
  if (jc && state.job.lastDay !== state.day && state.hour >= jc.window[0] - 1 && state.hour < jc.window[1]) {
    go(jc.location)
    if (!g.canStartShift()) return g.work()
  }
  if (route.election && election()) return true
  if (route.rep && repActions()) return true
  if (route.invest && invest()) return true
  const nextLv = state.job && state.job.career === route.career && c.levels[state.job.level + 1]
  if (nextLv && trainFor(nextLv.req)) return true
  if (!nextLv && state.job && state.job.career === route.career && route.skillsTo && trainFor(route.skillsTo)) return true
  return g.wait(1)
}

function simulate(background, route) {
  g.newGame({ name: 'Bot', gender: 'x', skin: 'a', hair: 'black', outfit: 'tee', background, wish: route.wish })
  g.skipTutorial()
  g.placeFurniture('futon', 0, 0)
  const marks = {}
  let guard = 0
  while (state.day <= MAX_DAYS && guard < 200000) {
    guard++
    step(route)
    const c = CAREERS[route.career]
    if (state.job && state.job.career === route.career && state.job.level === c.levels.length - 1 && !marks.top) marks.top = state.day
    if (state.rep >= 40 && !marks.rep40) marks.rep40 = state.day
    if (state.rep >= 100 && !marks.rep100) marks.rep100 = state.day
    if (state.election.governor && !marks.gov) marks.gov = state.day
    if (g.netWorth() >= 10000000 && !marks.nw10m) marks.nw10m = state.day
    if (g.netWorth() >= 100000000 && !marks.nw100m) marks.nw100m = state.day
    if (marks[route.goal]) break
    if (process.env.TRACE && state.day % 20 === 0 && marks.traced !== state.day) {
      marks.traced = state.day
      const built = Object.keys(state.plots).filter((id) => state.plots[id].built).length
      console.log('  day', state.day, 'money', Math.round(state.money), 'nw', Math.round(g.netWorth()), 'plots', Object.keys(state.plots).length, 'built', built, 'job', state.job && CAREERS[state.job.career].levels[state.job.level].title)
    }
  }
  marks.hospital = state.txns.filter((t) => t.text === '住院费' || t.text === '急诊费').length
  marks.money = state.money
  return marks
}

const ROUTES = [
  { name: '商社→社长', wish: 'ceo', career: 'office', goal: 'top' },
  { name: '程序员→CTO', wish: 'ceo', career: 'tech', goal: 'top' },
  { name: '艺人→巨星', wish: 'ceo', career: 'idol', goal: 'top', rep: true },
  { name: '都知事', wish: 'governor', career: 'office', goal: 'gov', rep: true, election: true },
  { name: '声望100', wish: 'famous', career: 'office', goal: 'rep100', rep: true },
  { name: '亿万富翁', wish: 'rich', career: 'tech', goal: 'nw100m', invest: true, skillsTo: { int: 100, cre: 100 } }
]
const BGS = (process.argv[2] || 'rich,normal,self').split(',')
const RUNS = Number(process.argv[3] || 3)

const ONLY = process.argv[4] || ''
for (const route of ROUTES.filter((r) => !ONLY || r.goal === ONLY)) {
  for (const bg of BGS) {
    const res = []
    for (let i = 0; i < RUNS; i++) res.push(simulate(bg, route))
    const days = res.map((r) => r[route.goal] || '>' + MAX_DAYS)
    const hosp = res.map((r) => r.hospital).join('/')
    console.log(route.name.padEnd(10), bg.padEnd(7), '达成天数', days.join(' / '), ' 入院', hosp, ' rep40@', res.map((r) => r.rep40 || '-').join('/'), ' 净资产1千万@', res.map((r) => r.nw10m || '-').join('/'))
  }
}
