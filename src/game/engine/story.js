// 剧情事件：按条件触发、多段对话、带标签的选项、章节目标
import { state, addMoney, addStats, addSkills, addRep, pushMessage, pushNews, save } from './core.js'
import { passTime } from './time.js'
import {
  dateOf, age, grade, isMinor, isSchoolDay, isRaining, festivalToday, isBirthday, monthKey, stageId
} from './calendar.js'
import { rel, addAffection } from './social-day.js'
import { fitFurniture } from './property.js'
import { addCourage, firstVisit } from './courage.js'
import { awardTitle, os, logAct } from './fun.js'
import { ui } from '../ui.js'
import { STORIES, STORY_MAP, STORY_PER_DAY, TAGS, STAGE_GOALS, GOAL_COURAGE } from '../data/story.js'
import { NPCS, NPC_MAP } from '../data/npcs.js'
import { BACKGROUNDS, DREAM_MAP, WISHES } from '../data/profile.js'

function bestFriend() {
  let best = null
  NPCS.forEach((n) => {
    const r = rel(n.id)
    if (r && r.aff >= 20 && (!best || r.aff > rel(best.id).aff)) best = n
  })
  return best
}

// 剧情上下文：事件的 when / cond / roll / 文字函数都只读它
export function ctx() {
  const d = dateOf()
  const p = state.profile
  const done = state.story.done
  const dream = DREAM_MAP[p.dream]
  const fest = festivalToday()
  return {
    name: p.name, gender: p.gender, bg: p.background, age: age(), grade: grade(), minor: isMinor(),
    startGrade: p.startAge ? p.startAge - 5 : 99,
    month: d.m, date: d.d, hour: state.hour, loc: state.location, money: state.money, skills: state.skills,
    rain: isRaining(), schoolDay: isSchoolDay(), festival: fest ? fest.id : '', birthday: isBirthday(),
    dream: p.dream || '', dreamName: dream && dream.id !== 'unknown' ? dream.name : '', dreamWish: dream ? dream.wish : '',
    bf: bestFriend(), goalsDone: Object.keys(state.life.goals).length,
    truantThisMonth: (state.counters.truantMonth || {})[monthKey()] || 0,
    giftBike: isMinor() && age() <= 10 && !(state.vehicles && state.vehicles.bike),
    flag: (k) => state.story.flags[k],
    done: (id) => !!done[id],
    doneToday: (id) => done[id] === state.day,
    daysSince: (id) => (done[id] ? state.day - done[id] : -1),
    known: (id) => !!rel(id),
    aff: (id) => (rel(id) ? rel(id).aff : 0)
  }
}

// 这一段剧情在本周期（一生 / 今天 / 今年）里是否已经播过
function spent(ev) {
  const last = state.story.done[ev.id]
  if (!last) return false
  if (!ev.repeat) return true
  if (ev.repeat === 'daily') return last === state.day
  return dateOf(last).y === dateOf().y
}

function eligible(ev, c) {
  if (state.story.later && state.story.later[ev.id] === state.day) return false
  return !spent(ev) && ev.when(c)
}

function todayCount() {
  const t = state.story.today
  return t && t.day === state.day ? t.n : 0
}

// 每次行动后调用：有符合条件的剧情就挂起，等弹窗播放
export function checkStory() {
  if (!state.started || state.pendingStory || state.pendingEvent || ui.reading) return ''
  const c = ctx()
  const capped = todayCount() >= STORY_PER_DAY
  const ev = STORIES.filter((e) => (!capped || e.routine || e.turning) && eligible(e, c))[0]
  if (!ev) return ''
  state.pendingStory = ev.id
  return ''
}

// 当天是否有固定日期的剧情（这一天不能跳过）
export function storyDueToday() {
  const c = ctx()
  return STORIES.some((e) => e.on && !spent(e) && e.on(c))
}

function textOf(v, c) {
  return typeof v === 'function' ? v(c) : v
}

function scenesOf(list, c) {
  return (list || []).map((s) => ({ who: textOf(s.who, c), text: textOf(s.text, c) }))
}

function visibleChoices(ev, c) {
  return ev.choices.filter((ch) => !ch.cond || ch.cond(c))
}

// 弹窗要显示的内容
export function storyView() {
  const ev = STORY_MAP[state.pendingStory]
  if (!ev) return null
  const c = ctx()
  return {
    id: ev.id, icon: ev.icon, title: ev.title, scenes: scenesOf(ev.scenes, c),
    choices: visibleChoices(ev, c).map((ch) => {
      const outcomes = ch.roll ? [ch.win, ch.lose] : [ch]
      return {
        label: ch.label,
        tag: ch.tag ? TAGS[ch.tag].name : '',
        cost: Math.max(0, ...outcomes.map(out => -(out.money || 0))),
        authorChoice: !!ev.turning || /^(dream|wish):/.test(ch.run || '')
      }
    })
  }
}

// 选了一个选项：结算结果，返回后续对话和一句提示
export function chooseStory(index) {
  const ev = STORY_MAP[state.pendingStory]
  state.pendingStory = null
  if (!ev) return { scenes: [], msg: '' }
  const c = ctx()
  const ch = visibleChoices(ev, c)[index] || visibleChoices(ev, c)[0]
  let out = ch
  let rolled = ''
  if (ch.roll) {
    const win = Math.random() < ch.roll(c)
    out = win ? ch.win : ch.lose
    rolled = win ? '大成功！' : '大翻车……'
  }
  if (ch.retry) {
    if (!state.story.later) state.story.later = {}
    state.story.later[ev.id] = state.day
  } else {
    state.story.done[ev.id] = state.day
    if (!ev.routine) state.story.today = { day: state.day, n: todayCount() + 1 }
  }
  if (ev.turning) state.story.turningDay = state.day
  const msgs = []
  const tag = ch.tag ? TAGS[ch.tag] : null
  const courage = (out.courage || 0) + (tag ? tag.courage : 0)
  if (tag) os(tag.os)
  apply(Object.assign({}, ch.run && !out.run ? { run: ch.run } : {}, ch.title && !out.title ? { title: ch.title } : {}, out), msgs)
  if (courage) {
    addCourage(courage)
    msgs.push('勇气 +' + courage)
  }
  if (!ch.retry) logAct(0)
  const after = scenesOf(out.then || ch.then, ctx())
  return { scenes: after, msg: [rolled].concat(msgs).filter(Boolean).join('，') }
}

function apply(o, msgs) {
  if (o.hours) passTime(o.hours)
  if (o.money) addMoney(o.money, '剧情')
  addStats(o.effects)
  addSkills(o.skills)
  addRep(o.rep)
  if (o.meet) {
    o.meet.forEach((id) => {
      if (!state.social[id]) state.social[id] = { aff: 5, last: state.day, status: 'none' }
    })
    msgs.push('认识了 ' + o.meet.map((id) => NPC_MAP[id].name).join('、'))
  }
  if (o.aff) {
    Object.keys(o.aff).forEach((id) => {
      if (!state.social[id]) state.social[id] = { aff: 5, last: state.day, status: 'none' }
      addAffection(id, o.aff[id])
      state.social[id].last = state.day
      msgs.push(NPC_MAP[id].name + ' 好感' + (o.aff[id] > 0 ? '+' : '') + o.aff[id])
    })
  }
  if (o.affAll) Object.keys(state.social).forEach((id) => addAffection(id, o.affAll))
  if (o.affBf) {
    const bf = bestFriend()
    if (bf) addAffection(bf.id, o.affBf)
  }
  if (o.flags) Object.assign(state.story.flags, o.flags)
  if (o.msg) pushMessage(o.msg.from, o.msg.text)
  if (o.run) {
    const r = runHandler(o.run)
    if (r) msgs.push(r)
  }
  if (o.title) {
    const t = awardTitle(o.title)
    if (t) msgs.push(t)
  }
}

// ---------- 剧情里的特殊处理 ----------

function goSchool() {
  const end = 15
  const hours = Math.max(0.5, end - state.hour)
  passTime(hours)
  state.location = 'school'
  addSkills({ int: 2, cha: 1 })
  addStats({ hunger: 35, mood: -2 })
  Object.keys(state.social).forEach((id) => addAffection(id, 1))
  state.counters.school = (state.counters.school || 0) + 1
  logAct(hours)
  os('school', 0.6)
  return '放学了！智识 +2 魅力 +1'
}

function truant() {
  const m = state.counters.truantMonth || {}
  m[monthKey()] = (m[monthKey()] || 0) + 1
  state.counters.truantMonth = m
  state.counters.truant = (state.counters.truant || 0) + 1
  addStats({ mood: 6 })
  pushMessage('妈妈', '……今天就在家好好休息吧。冰箱里有布丁。（妈妈好像什么都知道）')
  return '今天不用上学了'
}

function setDream(id) {
  const d = DREAM_MAP[id]
  state.profile.dream = id
  if (d.wish) state.profile.wish = d.wish
  addSkills(d.skills)
  return d.icon + ' 小梦想：' + d.name
}

function moveOut(wishId) {
  const bg = BACKGROUNDS.filter((b) => b.id === state.profile.background)[0] || BACKGROUNDS[1]
  if (wishId) state.profile.wish = wishId
  state.life.withParents = false
  state.home = bg.home
  fitFurniture()
  addMoney(bg.money, '父母给的安家费')
  state.location = 'home'
  state.tutorial = { step: 0, done: false }
  pushMessage('妈妈', '到新家了吗？记得按时吃饭，别太累。有事随时打电话回家。')
  pushNews('新的人生阶段：一个人的东京。')
  const w = WISHES.filter((x) => x.id === state.profile.wish)[0]
  return '🧳 搬进了自己的家' + (w ? '，人生愿望：' + w.name : '')
}

function birthdayGift() {
  if (isMinor() && age() <= 10 && !(state.vehicles && state.vehicles.bike)) {
    if (!state.vehicles) state.vehicles = {}
    state.vehicles.bike = true
    return '🚲 得到了一辆自行车'
  }
  if (isMinor()) {
    addMoney(5000, '生日红包')
    return '收到生日红包 5,000 日元'
  }
  return ''
}

function enterShop() {
  state.story.flags.shop_found = true
  state.story.turningDay = state.day
  state.location = 'courage'
  firstVisit()
  os('shop')
  return '🏮 发现了勇气商店'
}

function runHandler(name) {
  const [key, arg] = name.split(':')
  if (key === 'goSchool') return goSchool()
  if (key === 'truant') return truant()
  if (key === 'dream') return setDream(arg)
  if (key === 'keepDream') return moveOut(DREAM_MAP[state.profile.dream].wish)
  if (key === 'wish') return moveOut(arg)
  if (key === 'birthdayGift') return birthdayGift()
  if (key === 'enterShop') return enterShop()
  return ''
}

// 弹窗关闭：恢复时钟，看看有没有下一段剧情
export function doneReading() {
  ui.reading = false
  checkStory()
  save()
}

// ---------- 章节目标 ----------

export function currentGoals() {
  const list = STAGE_GOALS[stageId()] || []
  return list.map((g) => ({ id: g.id, text: g.text, done: !!state.life.goals[g.id] }))
}

export function checkGoals() {
  const list = STAGE_GOALS[stageId()]
  if (!list) return ''
  let msg = ''
  list.forEach((g) => {
    if (state.life.goals[g.id] || !g.check(state)) return
    state.life.goals[g.id] = state.day
    addCourage(GOAL_COURAGE)
    pushMessage('人生', '章节目标完成：' + g.text.replace(/（.*）/, '') + '。勇气 +' + GOAL_COURAGE)
    msg = '⭐ 章节目标完成，勇气 +' + GOAL_COURAGE
  })
  return msg
}
