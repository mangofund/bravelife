// 历法：第 1 天是 2026 年 4 月 1 日（日本的新学年和新年度从 4 月开始）
export const START = { y: 2026, m: 4, d: 1 }

// 跳过一天：每个游戏月最多 10 次，每天最多 1 次
export const SKIP_PER_MONTH = 10

// 学校放假（含首尾），周末也不上课
export const SCHOOL_BREAKS = [
  { from: [3, 25], to: [4, 6], name: '春假' },
  { from: [5, 3], to: [5, 6], name: '黄金周' },
  { from: [7, 20], to: [8, 31], name: '暑假' },
  { from: [12, 25], to: [1, 7], name: '寒假' }
]
export const SCHOOL_HOURS = [8, 15]

// 节日：当天不能跳过；loc 为空表示在哪里都会遇到
export const FESTIVALS = [
  { id: 'hanami', name: '花见', icon: '🌸', from: [4, 1], to: [4, 7], news: '樱花满开！樱花公园的花见季开始了。' },
  { id: 'tanabata', name: '七夕', icon: '🎋', from: [7, 7], to: [7, 7], news: '今天是七夕，商店街挂满了许愿的短册。' },
  { id: 'hanabi', name: '隅田川花火大会', icon: '🎆', from: [7, 26], to: [7, 26], news: '今晚 19 点，隅田川花火大会！古寺仲见世附近是最佳观赏点。' },
  { id: 'xmas', name: '圣诞节', icon: '🎄', from: [12, 24], to: [12, 25], news: '平安夜，街上到处是灯饰。' },
  { id: 'newyear', name: '正月', icon: '🎍', from: [1, 1], to: [1, 3], news: '新年快乐！稻荷神社的初诣队伍排到了鸟居外。' }
]

// 每月下雨的概率（6 月梅雨、9 月秋雨）
export const RAIN_CHANCE = [0.15, 0.15, 0.2, 0.2, 0.25, 0.45, 0.3, 0.2, 0.35, 0.25, 0.15, 0.1]
export const WEATHERS = {
  sun: { name: '晴', icon: '☀️' },
  cloud: { name: '多云', icon: '⛅' },
  rain: { name: '雨', icon: '🌧️' }
}

// 未成年每周零花钱（日元），按出身
export const POCKET = { rich: 3000, normal: 1000, self: 500 }

// 18 岁前和父母同住的家（不收房租，不在不动产中介出租）
export const FAMILY_HOME = { rich: 'family_rich', normal: 'family_normal', self: 'family_self' }

// 未成年开局：零花钱存款和家里已经摆好的家具
export const MINOR_START = {
  rich: { money: 20000, furniture: ['bed', 'desk', 'tv', 'piano', 'plant'] },
  normal: { money: 5000, furniture: ['futon', 'desk', 'tv', 'plant'] },
  self: { money: 1000, furniture: ['futon', 'stove', 'plant'] }
}

// 人生阶段（按年级或年龄）
export const ADULT_STAGES = [
  { from: 18, name: '一个人的东京' },
  { from: 22, name: '青年' },
  { from: 35, name: '中年' },
  { from: 50, name: '壮年' },
  { from: 65, name: '晚年' }
]

export const MIN_START_AGE = 6
export const MAX_START_AGE = 18
// 日本 20 岁才能喝酒
export const DRINK_AGE = 20
