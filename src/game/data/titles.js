// 称号：可以佩戴在名字旁边。日常类用梗，传承类用正经名字
// check 每次行动后判定；story 为 true 的称号只由剧情事件授予
export const TITLES = [
  { id: 'worker', name: '天选打工人', icon: '💼', desc: '连续 30 天上班', check: (s) => (s.counters.workStreak || 0) >= 30 },
  { id: 'grinder', name: '卷王', icon: '📚', desc: '一天里学习、上课和上班加起来 ≥ 14 小时', check: (s) => s.dayLog.grind >= 14 },
  { id: 'flat', name: '躺平大师', icon: '🛌', desc: '连续 3 天什么也没做', check: (s) => (s.counters.lazyStreak || 0) >= 3 },
  { id: 'konbini', name: '便利店之子', icon: '🏪', desc: '在便利店吃买 100 次', check: (s) => (s.counters.konbini || 0) >= 100 },
  { id: 'shy', name: '社恐', icon: '🫣', desc: '连续 30 天没和任何人说话', check: (s) => (s.counters.silentStreak || 0) >= 30 },
  { id: 'social', name: '社牛', icon: '🐮', desc: '一天里和 5 个人聊天', check: (s) => s.dayLog.talks >= 5 },
  { id: 'cook', name: '干饭人', icon: '🍚', desc: '自己做饭 100 次', check: (s) => (s.counters.cooks || 0) >= 100 },
  { id: 'owl', name: '夜猫子', icon: '🦉', desc: '凌晨 3 点还醒着 10 次', check: (s) => (s.counters.lateNights || 0) >= 10 },
  { id: 'good_kid', name: '好孩子', icon: '🎒', desc: '上学 30 天', check: (s) => (s.counters.school || 0) >= 30 },
  { id: 'truant', name: '逃课大王', icon: '🤒', desc: '装病逃课 3 次', check: (s) => (s.counters.truant || 0) >= 3 },
  // 剧情称号
  { id: 'self_roast', name: '自黑王者', icon: '🤡', desc: '用一张更丑的画救了场', story: true },
  { id: 'ramen_king', name: '拉面教主', icon: '🍜', desc: '让全班爱上了拉面味', story: true },
  { id: 'rebel', name: '补习班叛徒', icon: '🏃', desc: '把补习班老师拉去了公园', story: true },
  { id: 'tearjerker', name: '催泪弹', icon: '😭', desc: '在毕业典礼上让全场哭成一片', story: true },
  { id: 'lone_brave', name: '孤勇者', icon: '⚔️', desc: '第一次走进勇气商店', story: true },
  { id: 'firm', name: '初心', icon: '🌱', desc: '长大后仍然坚持童年的小梦想', story: true }
]

export const TITLE_MAP = TITLES.reduce((m, t) => {
  m[t.id] = t
  return m
}, {})
