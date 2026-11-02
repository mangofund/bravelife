import {
  state, resetState, initialState, addMoney, addStats, addSkills, addRep, pushMessage, pushNews,
  describe, fmtMoney, isOpen, dailyUsed, markDaily, round1, save, count
} from './core.js'
import { passTime, finish, fail, bestBed, kitchenLevel, decorScore } from './time.js'
import { LOCATION_MAP, OMIKUJI } from '../data/locations.js'
import { CAREERS, PROMOTE_SHIFTS } from '../data/jobs.js'
import { ITEMS, FURNITURE, HOMES, DELIVERY, CHORES } from '../data/world.js'
import { BACKGROUNDS, SKILL_NAMES } from '../data/profile.js'
import { EVENTS } from '../data/events.js'
import { FAMILY_HOME, MINOR_START } from '../data/calendar.js'
import { birthYearFor } from './calendar.js'
import { placeBlock, jobBlock, minorShiftBlock } from './life.js'
import { charmActive, first } from './courage.js'
import { os, logAct } from './fun.js'

// profile.startAge：6-17 岁和父母同住、上学；18 岁及以上（或旧版不带年龄）直接一个人在东京生活
export function newGame(profile) {
  const bg = BACKGROUNDS.filter((b) => b.id === profile.background)[0] || BACKGROUNDS[1]
  const p = Object.assign({ startAge: 22, birth: { m: 4, d: 2 }, dream: '', title: '' }, profile)
  p.birthYear = birthYearFor(p.startAge, p.birth)
  const minor = p.startAge < 18
  const s = initialState()
  s.started = true
  s.profile = p
  s.skills = Object.assign({}, bg.skills)
  s.rep = bg.rep
  s.bag = { onigiri: 2 }
  if (minor) {
    // 年纪越小，出身带来的能力越少
    const k = Math.min(1, (p.startAge - 4) / 14)
    Object.keys(s.skills).forEach((key) => {
      s.skills[key] = Math.round(s.skills[key] * k)
    })
    s.rep = Math.round(bg.rep * k * 0.5)
    const st = MINOR_START[bg.id] || MINOR_START.normal
    s.money = st.money
    s.home = FAMILY_HOME[bg.id] || FAMILY_HOME.normal
    s.life.withParents = true
    s.tutorial.done = true
    s.furniture.inv = {}
    s.furniture.placed = st.furniture.map((fid, i) => ({ uid: i + 1, fid, x: i % 4, y: Math.floor(i / 4) }))
    s.nextUid = st.furniture.length + 1
  } else {
    s.money = bg.money
    s.home = bg.home
    s.furniture.inv = { futon: 1, plant: 1 }
  }
  resetState(s)
  if (minor) {
    const parent = bg.id === 'self' ? '妈妈' : '爸爸妈妈'
    pushMessage(parent, '今天开始放春假啦！4 月 7 日开学，工作日早上 8 点要去樱丘学园上学哦。')
    pushMessage('人生', '你和' + parent + '住在' + HOMES[s.home].name + '。在手机「人生」里可以看到这个阶段的章节目标。')
    pushNews('樱花季到了，樱花公园的花见正热闹。')
  } else {
    pushMessage('妈妈', '到东京了吗？记得按时吃饭，别太累。给你寄了两个饭团，在背包里。')
    pushMessage('房东', '欢迎入住' + HOMES[s.home].name + '！房租每 7 天扣一次。地铺和盆栽已放在你的家具仓库里，去「家」里摆好吧。')
    pushNews('欢迎来到东京！今天天气晴，适合出门找份工作。')
  }
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

export function wait(hours) {
  passTime(hours)
  return finish('时间过去了 ' + hours + ' 小时')
}

// 通用行动：先检查金钱，再推进时间并结算效果
function run(def, label) {
  const cost = def.cost || 0
  if (state.money < cost) return fail('钱不够，需要 ' + fmtMoney(cost))
  passTime(def.hours || 0)
  logAct(def.skills && (def.skills.int || def.paid) ? def.hours : 0)
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
  return placeBlock(locId)
}

export function doAction(locId, actionId) {
  const err = canActHere(locId)
  if (err) return fail(err)
  const act = LOCATION_MAP[locId].actions.filter((a) => a.id === actionId)[0]
  if (!act) return fail('没有这个行动')
  const key = locId + ':' + actionId
  if (act.daily && dailyUsed(key)) return fail('今天已经做过了，明天再来')
  count('act:' + key)
  if (act.paid) count('paidClasses')
  if (locId === 'konbini') {
    count('konbini')
    if (state.counters.konbini % 3 === 0) os('konbini')
  }
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
  if (state.money < 200) return fail('钱不够，需要 ' + fmtMoney(200))
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
  if (locId === 'konbini') count('konbini')
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
  const block = jobBlock(careerId)
  if (block) return fail(block)
  count('applies')
  if (!meets(c.levels[0].req)) return fail('还不够格：' + reqText(c.levels[0].req))
  const old = state.job ? CAREERS[state.job.career].name : ''
  state.job = { career: careerId, level: 0, shifts: 0, lastDay: 0 }
  passTime(1)
  first('job', 10)
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
  return minorShiftBlock()
}

export function work() {
  const err = canStartShift()
  if (err) return fail(err)
  const job = state.job
  const c = CAREERS[job.career]
  const lv = c.levels[job.level]
  const bg = BACKGROUNDS.filter((b) => b.id === state.profile.background)[0]
  const pay = Math.round(lv.pay * (1 + (bg ? bg.payBonus : 0)) * (charmActive('charm_work') ? 1.1 : 1))
  passTime(c.hours)
  logAct(c.hours)
  state.counters.workStreak = job.lastDay === state.day - 1 ? (state.counters.workStreak || 0) + 1 : 1
  if (job.weekShifts !== undefined) job.weekShifts += 1
  addStats({ energy: -c.hours, mood: -c.hours * 0.5 })
  addSkills(c.gain)
  addRep(c.rep)
  addMoney(pay, c.name + ' · ' + lv.title + ' 工资')
  job.lastDay = state.day
  job.shifts += 1
  count('shifts')
  os('work', 0.5)
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
    // 房间太乱时装饰加成减半
    const bonus = Math.round(Math.min(decorScore() * 2, 20) * (state.clean >= 50 ? 1 : 0.5))
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
  count('cooks')
  logAct(0)
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

// 外卖：只能送到家
export function orderDelivery(id) {
  if (state.location !== 'home') return fail('外卖只能送到家里')
  const d = DELIVERY.filter((x) => x.id === id)[0]
  if (!d) return fail('没有这个餐')
  if (state.money < d.price) return fail('钱不够，需要 ' + fmtMoney(d.price))
  passTime(d.hours)
  addMoney(-d.price, '外卖 · ' + d.name)
  addStats(d.effects)
  count('meals')
  return finish(d.icon + ' ' + d.name + '送到了：' + describe(d.effects))
}

// 家务：自己打扫（费时免费）或请家政（花钱省时）
export function doChores(kind) {
  if (state.location !== 'home') return fail('要在家里打扫')
  const c = CHORES[kind]
  if (!c) return fail('没有这种方式')
  if (state.money < c.cost) return fail('钱不够，需要 ' + fmtMoney(c.cost))
  passTime(c.hours)
  if (c.cost) addMoney(-c.cost, c.name)
  addStats(c.effects)
  state.clean = Math.min(100, Math.round(state.clean + c.clean))
  return finish(c.icon + ' ' + c.name + '，房间整洁度 ' + state.clean)
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
