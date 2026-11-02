import { state, addMoney, pushMessage } from './core.js'

const BED_IDS = ['futon', 'bed', 'kingbed']

export const TUTORIAL = [
  { id: 'place', text: '去「家」把仓库里的地铺摆进房间', check: () => state.furniture.placed.some((p) => BED_IDS.indexOf(p.fid) >= 0) },
  { id: 'job', text: '在地图上找个有招聘的地点应聘，便利店随时可以上班', check: () => !!state.job },
  { id: 'work', text: '在上班时间去工作地点上一次班', check: () => state.counters.shifts >= 1 },
  { id: 'eat', text: '吃点东西：便利店、拉面，或手机「背包」里的饭团', check: () => state.counters.meals >= 1 },
  { id: 'friend', text: '认识一位朋友：图书馆、健身房等地点会有人，点「聊天」', check: () => Object.keys(state.social).length >= 1 },
  { id: 'sleep', text: '回家睡一觉恢复精力', check: () => state.counters.sleeps >= 1 }
]

const STEP_REWARD = 5000
const FINAL_REWARD = 20000

export function tutorialStep() {
  const t = state.tutorial
  if (!t || t.done || t.step >= TUTORIAL.length) return null
  return TUTORIAL[t.step]
}

// 按顺序检查新手任务，返回本次完成的提示文字
export function checkTutorial() {
  const t = state.tutorial
  if (!t || t.done) return ''
  let msg = ''
  while (t.step < TUTORIAL.length && TUTORIAL[t.step].check()) {
    t.step += 1
    addMoney(STEP_REWARD, '新手任务奖励')
    msg = '✅ 新手任务完成，奖励 ¥5,000'
  }
  if (t.step >= TUTORIAL.length) {
    t.done = true
    addMoney(FINAL_REWARD, '新手毕业奖励')
    pushMessage('勇敢人生', '新手任务全部完成，奖励 ¥20,000！接下来朝你的人生愿望努力吧。')
    msg = '🎓 新手任务全部完成，奖励 ¥20,000'
  }
  return msg
}

export function skipTutorial() {
  state.tutorial.done = true
}

export function warnings() {
  const s = state.stats
  const list = []
  if (s.energy < 15) list.push('⚡ 精力快耗尽了，回家睡觉，否则会晕倒')
  if (s.hunger < 20) list.push('🍙 太饿了，健康在下降，快去吃东西')
  if (s.health < 30) list.push('❤️ 健康偏低，去医院治疗或去钱汤休息')
  if (s.mood < 15) list.push('😊 心情很差，去唱歌、泡澡或散步')
  if (state.money < 0) list.push('💸 账户透支了，先去打工赚钱')
  return list
}
