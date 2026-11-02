import {
  state, resetState, initialState, addMoney, addStats, addSkills, addRep, pushMessage, pushNews,
  describe, fmtMoney, isOpen, dailyUsed, markDaily, round1, save, count
} from './core.js'
import { passTime, finish, fail, bestBed, kitchenLevel, decorScore } from './time.js'
import { LOCATION_MAP, TRAVEL, OMIKUJI } from '../data/locations.js'
import { CAREERS, PROMOTE_SHIFTS } from '../data/jobs.js'
import { ITEMS, FURNITURE, HOMES } from '../data/world.js'
import { BACKGROUNDS, SKILL_NAMES } from '../data/profile.js'
import { EVENTS, EVENT_CHANCE } from '../data/events.js'

export function newGame(profile) {
  const bg = BACKGROUNDS.filter((b) => b.id === profile.background)[0] || BACKGROUNDS[1]
  const s = initialState()
  s.started = true
  s.profile = profile
  s.money = bg.money
  s.home = bg.home
  s.skills = Object.assign({}, bg.skills)
  s.rep = bg.rep
  s.furniture.inv = { futon: 1, plant: 1 }
  s.bag = { onigiri: 2 }
  resetState(s)
  pushMessage('妈妈', '到东京了吗？记得按时吃饭，别太累。给你寄了两个饭团，在背包里。')
  pushMessage('房东', '欢迎入住' + HOMES[s.home].name + '！房租每 7 天扣一次。地铺和盆栽已放在你的家具仓库里，去「家」里摆好吧。')
  pushNews('欢迎来到东京！今天天气晴，适合出门找份工作。')
  save()
}

function meets(req) {
  if (!req) return true
  return Object.keys(req).every((k) => {
    if (k === 'rep') return state.rep >= req[k]
    return state.skills[k] >= req[k]
  })
}

export function reqText(req) {
  if (!req) return '无要求'
  const keys = Object.keys(req)
  if (!keys.length) return '无要求'
  return keys.map((k) => (k === 'rep' ? '声望' : SKILL_NAMES[k]) + ' ≥ ' + req[k]).join('，')
}

export function travelCost(toId) {
  const from = LOCATION_MAP[state.location]
  const to = LOCATION_MAP[toId]
  return from.far || to.far ? TRAVEL.far : TRAVEL.near
}

function rollEvent() {
  if (Math.random() > EVENT_CHANCE) return
  const pool = EVENTS.filter((ev) => {
    if (!ev.cond) return true
    return Object.keys(ev.cond).every((k) => (k === 'money' ? state.money >= ev.cond[k] : state.skills[k] >= ev.cond[k]))
  })
  if (pool.length) state.pendingEvent = pool[Math.floor(Math.random() * pool.length)].id
}

export function travel(toId) {
  const to = LOCATION_MAP[toId]
  if (!to || to.soon) return fail('这里还没开放')
  if (state.location === toId) return fail('你已经在这里了')
  const t = travelCost(toId)
  if (state.money >= t.cost) {
    passTime(t.hours)
    addMoney(-t.cost, '交通 · 前往' + to.name)
  } else {
    passTime(t.hours * 3)
  }
  state.location = toId
  rollEvent()
  return finish(state.money >= 0 ? '已到达 ' + to.name : '没钱坐电车，走路到了 ' + to.name)
}

export function wait(hours) {
  passTime(hours)
  return finish('时间过去了 ' + hours + ' 小时')
}

// 通用行动：先检查金钱，再推进时间并结算效果
function run(def, label) {
  const cost = def.cost || 0
  if (state.money < cost) return fail('钱不够，需要 ' + fmtMoney(cost))
  passTime(def.hours || 0)
  if (cost) addMoney(-cost, label || def.name)
  addStats(def.effects)
  if (def.effects && def.effects.hunger > 0) count('meals')
  addSkills(def.skills)
  addRep(def.rep)
  return finish(def.name + '：' + describe(def.effects, def.skills, def.rep))
}

function canActHere(locId) {
  const loc = LOCATION_MAP[locId]
  if (state.location !== locId) return '你不在' + loc.name
  if (!isOpen(loc)) return loc.name + '现在不营业'
  return ''
}

export function doAction(locId, actionId) {
  const err = canActHere(locId)
  if (err) return fail(err)
  const act = LOCATION_MAP[locId].actions.filter((a) => a.id === actionId)[0]
  if (!act) return fail('没有这个行动')
  const key = locId + ':' + actionId
  if (act.daily && dailyUsed(key)) return fail('今天已经做过了，明天再来')
  const ok = run(act)
  if (ok && act.daily) {
    markDaily(key)
    save()
  }
  return ok
}

export function omikuji() {
  const err = canActHere('shrine')
  if (err) return fail(err)
  if (dailyUsed('shrine:omikuji')) return fail('今天已经抽过签了')
  if (state.money < 200) return fail('钱不够，需要 ¥200')
  markDaily('shrine:omikuji')
  passTime(0.25)
  addMoney(-200, '抽签')
  const r = OMIKUJI[Math.floor(Math.random() * OMIKUJI.length)]
  addStats({ mood: r.mood })
  if (r.money) addMoney(r.money, '大吉红包')
  pushMessage('稻荷神社', '你抽到了【' + r.name + '】：' + r.text)
  return finish('🎴 ' + r.name + '：' + r.text)
}

export function buyItem(locId, itemId) {
  const err = canActHere(locId)
  if (err) return fail(err)
  const item = ITEMS[itemId]
  if (state.money < item.price) return fail('钱不够')
  addMoney(-item.price, '购买 ' + item.name)
  state.bag[itemId] = (state.bag[itemId] || 0) + 1
  return finish('买了 ' + item.icon + item.name + '，放进背包')
}

export function useItem(itemId) {
  const item = ITEMS[itemId]
  if (!item || !state.bag[itemId]) return fail('背包里没有')
  if (item.kind === 'gift' || item.kind === 'ring') return fail('礼物要当面送给朋友')
  if (item.kind !== 'food') return fail('食材要在家里用厨房做')
  state.bag[itemId] -= 1
  if (!state.bag[itemId]) delete state.bag[itemId]
  passTime(0.25)
  addStats(item.effects)
  if (item.effects.hunger > 0) count('meals')
  return finish('吃了 ' + item.name + '：' + describe(item.effects))
}

// ---------- 工作 ----------

export function applyJob(careerId) {
  const c = CAREERS[careerId]
  const err = canActHere(c.location)
  if (err) return fail(err)
  if (state.job && state.job.career === careerId) return fail('你已经在这里工作了')
  if (!meets(c.levels[0].req)) return fail('还不够格：' + reqText(c.levels[0].req))
  const old = state.job ? CAREERS[state.job.career].name : ''
  state.job = { career: careerId, level: 0, shifts: 0, lastDay: 0 }
  passTime(1)
  pushMessage(c.name, '恭喜入职！你的职位是「' + c.levels[0].title + '」。上班时间 ' + c.window[0] + ':00 - ' + c.window[1] + ':00 之间开始。')
  return finish((old ? '辞去' + old + '，' : '') + '入职成功：' + c.levels[0].title)
}

export function quitJob() {
  if (!state.job) return fail('你还没有工作')
  const name = CAREERS[state.job.career].name
  state.job = null
  return finish('已辞去' + name + '的工作')
}

export function canStartShift() {
  const job = state.job
  if (!job) return '你还没有工作'
  const c = CAREERS[job.career]
  if (state.location !== c.location) return '要去' + LOCATION_MAP[c.location].name + '上班'
  if (job.lastDay === state.day) return '今天已经上过班了'
  if (state.hour < c.window[0] || state.hour >= c.window[1]) return '上班时间是 ' + c.window[0] + ':00 - ' + c.window[1] + ':00 开始'
  if (state.stats.energy < 15) return '太累了，先休息一下'
  return ''
}

export function work() {
  const err = canStartShift()
  if (err) return fail(err)
  const job = state.job
  const c = CAREERS[job.career]
  const lv = c.levels[job.level]
  const bg = BACKGROUNDS.filter((b) => b.id === state.profile.background)[0]
  const pay = Math.round(lv.pay * (1 + (bg ? bg.payBonus : 0)))
  passTime(c.hours)
  addStats({ energy: -c.hours, mood: -c.hours * 0.5 })
  addSkills(c.gain)
  addRep(c.rep)
  addMoney(pay, c.name + ' · ' + lv.title + ' 工资')
  job.lastDay = state.day
  job.shifts += 1
  count('shifts')
  let msg = '下班了，工资 +' + fmtMoney(pay)
  const next = c.levels[job.level + 1]
  if (next && job.shifts >= PROMOTE_SHIFTS && meets(next.req)) {
    job.level += 1
    job.shifts = 0
    addRep(2)
    pushMessage(c.name, '恭喜升职为「' + next.title + '」！日薪提升到 ' + fmtMoney(next.pay) + '。')
    if (job.level === c.levels.length - 1) pushNews('【人物】' + state.profile.name + ' 成为' + c.name + '界的' + next.title + '。')
    msg = '🎉 升职为 ' + next.title + '！'
  }
  return finish(msg)
}

// ---------- 家 ----------

export function sleep(full) {
  if (state.location !== 'home') return fail('要回家才能睡觉')
  let hours = 2
  if (full) {
    const h = state.hour
    hours = h >= 19 || h < 5 ? round1((7 - h + 24) % 24) : 8
    if (hours < 1) hours = 8
  }
  const q = bestBed()
  passTime(hours, true, q)
  if (full) count('sleeps')
  let msg = (full ? '睡醒了' : '小睡了一会') + '，精力 ' + Math.round(state.stats.energy)
  if (full) {
    const bonus = Math.min(decorScore() * 2, 20)
    if (bonus) {
      addStats({ mood: bonus })
      msg += '，家里很舒服，心情+' + bonus
    }
    if (q < 1) msg += '（没有床，睡得不太好）'
  }
  return finish(msg)
}

export function cook(itemId) {
  if (state.location !== 'home') return fail('要在家里做饭')
  const lv = kitchenLevel()
  if (!lv) return fail('家里还没有厨房设备，去家具城买一个卡式炉吧')
  const item = ITEMS[itemId]
  if (!item || !state.bag[itemId]) return fail('背包里没有这个食材')
  state.bag[itemId] -= 1
  if (!state.bag[itemId]) delete state.bag[itemId]
  passTime(1)
  const eff = Object.assign({}, item.cook)
  eff.hunger = Math.round(eff.hunger + state.skills.cook * 0.2)
  addStats(eff)
  count('meals')
  addSkills({ cook: item.cookGain }, lv)
  return finish('做了一顿' + item.name + '料理：' + describe(eff, { cook: item.cookGain * lv }))
}

export function useFurniture(fid) {
  if (state.location !== 'home') return fail('要在家里才能用')
  const f = FURNITURE[fid]
  if (!f || !f.use) return fail('这件家具不能使用')
  if (!state.furniture.placed.some((p) => p.fid === fid)) return fail('先把它摆进房间')
  if (f.use.stream) {
    passTime(f.use.hours)
    addStats(f.use.effects)
    addSkills(f.use.skills)
    const earn = Math.round(500 + state.skills.cha * 200 + state.skills.cre * 100)
    addMoney(earn, '直播打赏')
    return finish('直播结束，收到打赏 ' + fmtMoney(earn))
  }
  return run(f.use)
}

export function eventById(id) {
  return EVENTS.filter((e) => e.id === id)[0]
}

export function resolveEvent(index) {
  const ev = eventById(state.pendingEvent)
  state.pendingEvent = null
  if (!ev) return finish('')
  const ch = ev.choices[index] || ev.choices[0]
  if (ch.lottery) {
    const r = Math.random()
    const prize = r < 0.01 ? 1000000 : r < 0.1 ? 50000 : r < 0.4 ? 10000 : 1000
    addMoney(prize, '商店街抽奖')
    if (prize >= 50000) pushNews('商店街抽奖开出大奖，一位幸运市民抱走 ' + fmtMoney(prize) + '。')
    return finish('🎉 抽中了 ' + fmtMoney(prize) + '！')
  }
  const eff = ch.effects || {}
  if (eff.hours) passTime(eff.hours)
  if (eff.money) addMoney(eff.money, ev.title)
  addStats(eff)
  addSkills(ch.skills)
  addRep(ch.rep)
  if (ch.msg) pushMessage(ev.title, ch.msg)
  const d = describe(eff, ch.skills, ch.rep)
  return finish(ch.msg || (d ? ch.label + '：' + d : ch.label))
}
