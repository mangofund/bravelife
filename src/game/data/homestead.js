export const HOMESTEAD_RULES = '生活经营 v1'
export const SUPPLIES = {
  seed_radish: { name: '萝卜种子', icon: '🌾', price: 50, kind: 'seed', target: 'radish', category: 'garden', tip: '一份种一格 · 正常生长12现实小时' },
  seed_tomato: { name: '番茄种子', icon: '🍅', price: 80, kind: 'seed', target: 'tomato', category: 'garden', tip: '一份种一格 · 正常生长24现实小时' },
  seed_strawberry: { name: '草莓种子', icon: '🍓', price: 150, kind: 'seed', target: 'strawberry', category: 'garden', tip: '一份种一格 · 正常生长48现实小时' },
  feed_dog: { name: '普通狗粮', icon: '🐕', price: 100, kind: 'feed', target: 'dog', category: 'pet', hours: 24, capHours: 72, tip: '每份追加24现实小时 · 最多提前备72小时' },
  feed_cat: { name: '普通猫粮', icon: '🐈', price: 100, kind: 'feed', target: 'cat', category: 'pet', hours: 24, capHours: 72, tip: '每份追加24现实小时 · 最多提前备72小时' }
}
export const RECIPES = {
  radish_soup: { name: '萝卜清汤', icon: '🍲', produce: { radish: 5 }, items: {}, hours: 0.5, effects: { hunger: 25, health: 1, mood: 1 }, cookGain: 0.5, kitchen: true },
  tomato_fish_soup: { name: '番茄鱼汤', icon: '🥣', produce: { tomato: 3 }, items: { fish: 1 }, hours: 0.75, effects: { hunger: 65, health: 4, mood: 10 }, cookGain: 2, kitchen: true },
  strawberry_plate: { name: '草莓果盘', icon: '🍓', produce: { strawberry: 4 }, items: {}, hours: 0.25, effects: { hunger: 14, health: 1, mood: 4 }, cookGain: 0, kitchen: false }
}
