import { state, round1, addMoney, addStats, addRep, pushMessage, pushNews, fmtMoney, dailyUsed, markDaily } from './core.js'
import { passTime, finish, fail } from './time.js'
import { rel, addAffection, partnerId, isPresent, spotOf } from './social-day.js'
import { NPC_MAP, DATE_COST, CONFESS_MIN, PROPOSE_MIN } from '../data/npcs.js'
import { ITEMS } from '../data/world.js'
import { age } from './calendar.js'
import { addCourage, first, charmActive, useCharm } from './courage.js'
import { logTalk } from './fun.js'

function here(id) {
  if (!isPresent(id)) return NPC_MAP[id].name + '现在不在这里'
  return ''
}

function touch(id) {
  state.social[id].last = state.day
}

export function talk(id) {
  const err = here(id)
  if (err) return fail(err)
  const npc = NPC_MAP[id]
  if (!rel(id)) {
    state.social[id] = { aff: 5, last: state.day, status: 'none' }
    passTime(0.25)
    logTalk()
    markDaily('talk:' + id)
    pushMessage(npc.name, '很高兴认识你！我是' + npc.name + '，' + spotOf(npc).job + '。有空常来找我聊天吧。')
    return finish('认识了 ' + npc.icon + npc.name)
  }
  if (dailyUsed('talk:' + id)) return fail('今天已经和' + npc.name + '聊过了')
  markDaily('talk:' + id)
  const gain = round1(3 + state.skills.cha * 0.05)
  passTime(0.5)
  logTalk()
  addAffection(id, gain)
  addStats({ mood: 4 })
  touch(id)
  const lines = spotOf(npc).lines
  const line = lines[Math.floor(Math.random() * lines.length)]
  return finish(npc.name + '：“' + line + '” 好感+' + gain)
}

export function giftList() {
  return Object.keys(state.bag)
    .filter((k) => ITEMS[k] && ITEMS[k].kind === 'gift' && state.bag[k] > 0)
    .map((k) => ({ id: k, name: ITEMS[k].name, icon: ITEMS[k].icon, count: state.bag[k] }))
}

export function giveGift(id, itemId) {
  const err = here(id)
  if (err) return fail(err)
  const npc = NPC_MAP[id]
  if (!rel(id)) return fail('先和' + npc.name + '打个招呼')
  if (dailyUsed('gift:' + id)) return fail('今天已经送过礼物了')
  const item = ITEMS[itemId]
  if (!item || item.kind !== 'gift' || !state.bag[itemId]) return fail('背包里没有这件礼物')
  state.bag[itemId] -= 1
  if (!state.bag[itemId]) delete state.bag[itemId]
  markDaily('gift:' + id)
  state.counters.gifts = (state.counters.gifts || 0) + 1
  passTime(0.25)
  const liked = npc.likes.indexOf(itemId) >= 0
  const gain = liked ? 12 : 5
  addAffection(id, gain)
  touch(id)
  return finish(liked ? npc.name + '眼睛一亮：“这正是我想要的！” 好感+' + gain : npc.name + '收下了' + item.name + '。好感+' + gain)
}

export function goDate(id) {
  const err = here(id)
  if (err) return fail(err)
  const npc = NPC_MAP[id]
  const r = rel(id)
  if (age() < 15) return fail('还太小了，先当好朋友吧')
  if (!r || r.aff < 20) return fail('和' + npc.name + '还不够熟（好感 20 以上才能约会）')
  if (dailyUsed('date:' + id)) return fail('今天已经约会过了')
  if (state.money < DATE_COST) return fail('约会需要 ' + fmtMoney(DATE_COST))
  markDaily('date:' + id)
  passTime(3)
  addMoney(-DATE_COST, '和' + npc.name + '约会')
  addStats({ mood: 15, hunger: 30, energy: -5 })
  addAffection(id, r.status === 'none' ? 8 : 6)
  touch(id)
  return finish('和' + npc.name + '吃饭、散步，度过了愉快的时光')
}

export function confess(id) {
  const err = here(id)
  if (err) return fail(err)
  const npc = NPC_MAP[id]
  const r = rel(id)
  if (age() < 15) return fail('还太小了，先当好朋友吧')
  if (!r || r.aff < CONFESS_MIN) return fail('好感需要达到 ' + CONFESS_MIN)
  if (r.status !== 'none') return fail('你们已经在一起了')
  const pid = partnerId()
  if (pid) return fail('你已经有' + (state.social[pid].status === 'married' ? '配偶' : '恋人') + '了')
  if (dailyUsed('confess:' + id)) return fail('今天就先到这里吧，明天再说')
  markDaily('confess:' + id)
  passTime(0.5)
  touch(id)
  first('confess', 10)
  const love = charmActive('charm_love') && useCharm('charm_love')
  const chance = Math.min(0.95, Math.max(0.1, 0.3 + (r.aff - CONFESS_MIN) / 50 + state.skills.cha * 0.004 + (love ? 0.15 : 0)))
  let ok = Math.random() < chance
  // 第二次机会：失败时时间倒回去再试一次
  if (!ok && state.courage.charms.retry && useCharm('retry')) {
    pushMessage('勇气商店', '时间好像倒回去了一点。……再说一次吧。')
    ok = Math.random() < chance
  }
  const again = !!r.rejected
  if (ok) {
    r.status = 'dating'
    addAffection(id, 5)
    addStats({ mood: 25 })
    if (again) addCourage(15)
    pushMessage(npc.name, '那……以后请多关照啦。❤️')
    return finish('💕 ' + npc.name + '答应了！你们正式交往了' + (again ? '。被拒绝过还再试一次，勇气 +15' : ''))
  }
  r.rejected = (r.rejected || 0) + 1
  addAffection(id, -8)
  addStats({ mood: -10 })
  // 失败也是勇气；今晚勇气商店会亮灯
  addCourage(again ? 40 : 25, 'fail')
  state.story.turningDay = state.day
  return finish(npc.name + '有点为难：“我们再多了解一下彼此吧。” 好感-8，勇气 +' + (again ? 40 : 25))
}

export function propose(id) {
  const err = here(id)
  if (err) return fail(err)
  const npc = NPC_MAP[id]
  const r = rel(id)
  if (age() < 18) return fail('未满 18 岁不能结婚')
  if (!r || r.status !== 'dating') return fail('要先成为恋人')
  if (r.aff < PROPOSE_MIN) return fail('好感需要达到 ' + PROPOSE_MIN)
  if (!state.bag.ring) return fail('需要一枚婚戒（银座百货有售）')
  state.bag.ring -= 1
  if (!state.bag.ring) delete state.bag.ring
  passTime(1)
  r.status = 'married'
  touch(id)
  addStats({ mood: 40 })
  addRep(5)
  pushMessage(npc.name, '我愿意！以后的每一天都请多指教。💍')
  pushNews('【喜讯】' + state.profile.name + ' 与 ' + npc.name + ' 喜结连理。')
  return finish('💍 ' + npc.name + '答应了你的求婚！')
}

export function keepInvite() {
  const inv = state.invite
  if (!inv || inv.done || inv.day !== state.day) return fail('今天没有邀约')
  const err = here(inv.npc)
  if (err) return fail('要在约定的时间去约定的地点')
  inv.done = true
  passTime(1.5)
  addStats({ mood: 12 })
  addAffection(inv.npc, 10)
  touch(inv.npc)
  return finish('你准时赴约，' + NPC_MAP[inv.npc].name + '很开心。好感+10')
}
