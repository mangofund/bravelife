// 背包物品、家具、住房与湾岸地块

export const ITEMS = {
  onigiri: { name: '饭团', icon: '🍙', price: 150, kind: 'food', effects: { hunger: 15 } },
  bento: { name: '便当', icon: '🍱', price: 600, kind: 'food', effects: { hunger: 40, mood: 2 } },
  cupnoodle: { name: '杯面', icon: '🍜', price: 250, kind: 'food', effects: { hunger: 25, health: -1 } },
  energy: { name: '能量饮料', icon: '🥤', price: 250, kind: 'food', effects: { energy: 15, health: -2 } },
  veggie: { name: '蔬菜包', icon: '🥬', price: 800, kind: 'ingredient', cook: { hunger: 45, health: 5, mood: 3 }, cookGain: 2 },
  fish: { name: '鲜鱼', icon: '🐟', price: 1500, kind: 'ingredient', cook: { hunger: 55, health: 3, mood: 8 }, cookGain: 3 },
  wagyu: { name: '和牛', icon: '🥩', price: 8000, kind: 'ingredient', cook: { hunger: 70, mood: 25 }, cookGain: 4 },
  sweets: { name: '和果子礼盒', icon: '🍡', price: 1500, kind: 'gift' },
  flower: { name: '花束', icon: '💐', price: 3000, kind: 'gift' },
  figure: { name: '限定手办', icon: '🧸', price: 8000, kind: 'gift' },
  perfume: { name: '香水', icon: '🌸', price: 15000, kind: 'gift' },
  ring: { name: '婚戒', icon: '💍', price: 500000, kind: 'ring' }
}

// use：放置后在家里解锁的行动；bed：睡眠质量；kitchen：可做饭；decor：每日起床心情加成
export const FURNITURE = {
  futon: { name: '地铺', icon: '🛏️', price: 8000, bed: 1.0 },
  bed: { name: '单人床', icon: '🛏️', price: 45000, bed: 1.25 },
  kingbed: { name: '豪华大床', icon: '👑', price: 280000, bed: 1.5, decor: 3 },
  stove: { name: '卡式炉', icon: '🔥', price: 6000, kitchen: 1 },
  kitchen: { name: '系统厨房', icon: '🍳', price: 150000, kitchen: 2, decor: 2 },
  fridge: { name: '冰箱', icon: '🧊', price: 40000, decor: 1 },
  desk: { name: '书桌', icon: '🪑', price: 20000, use: { id: 'desk', name: '在书桌学习', icon: '✏️', hours: 2, effects: { mood: -2 }, skills: { int: 2 } } },
  pc: { name: '电脑', icon: '🖥️', price: 150000, use: { id: 'stream', name: '开直播', icon: '📹', hours: 2, effects: { energy: -10 }, skills: { cre: 2, cha: 1 }, stream: true } },
  tv: { name: '电视', icon: '📺', price: 60000, use: { id: 'tv', name: '看电视', icon: '📺', hours: 1, effects: { mood: 10 } } },
  console: { name: '游戏机', icon: '🎮', price: 40000, use: { id: 'game', name: '打游戏', icon: '🎮', hours: 2, effects: { mood: 15, energy: -5 }, skills: { cre: 1 } } },
  sofa: { name: '沙发', icon: '🛋️', price: 50000, decor: 2, use: { id: 'rest', name: '躺沙发', icon: '😌', hours: 1, effects: { energy: 8, mood: 4 } } },
  treadmill: { name: '跑步机', icon: '🏃', price: 90000, use: { id: 'run', name: '跑步机', icon: '🏃', hours: 1, effects: { energy: -10, health: 3 }, skills: { fit: 2 } } },
  piano: { name: '钢琴', icon: '🎹', price: 500000, decor: 3, use: { id: 'piano', name: '弹钢琴', icon: '🎹', hours: 1, effects: { mood: 10 }, skills: { cre: 3 } } },
  plant: { name: '观叶植物', icon: '🪴', price: 3000, decor: 1 },
  lamp: { name: '落地灯', icon: '💡', price: 8000, decor: 1 },
  rug: { name: '地毯', icon: '🟫', price: 12000, decor: 1 },
  aquarium: { name: '水族箱', icon: '🐠', price: 70000, decor: 4 },
  art: { name: '浮世绘挂画', icon: '🖼️', price: 120000, decor: 5 },
  cat: { name: '猫爬架和猫', icon: '🐈', price: 60000, decor: 4, use: { id: 'cat', name: '撸猫', icon: '🐈', hours: 0.5, effects: { mood: 12 } } }
}

// 住房：rent 为每周房租，price 为买断价格；cols×rows 为家里可摆放家具的格子
export const HOMES = {
  wood: { name: '木造公寓 6 叠', icon: '🏚️', rent: 15000, cols: 4, rows: 4 },
  '1k': { name: '1K 公寓', icon: '🏠', rent: 35000, cols: 5, rows: 4 },
  '1ldk': { name: '1LDK 高层公寓', icon: '🏢', rent: 70000, cols: 5, rows: 5 },
  tower: { name: '港区塔楼', icon: '🌆', rent: 150000, cols: 6, rows: 6 },
  villa: { name: '湾岸海景别墅', icon: '🌊', price: 80000000, cols: 7, rows: 6 }
}

export const RENT_DAYS = 7

// 湾岸地块：买地后可以盖公寓楼收租
export const BUILD_COST = 3000000
export const BUILD_INCOME = 110000

export const PLOTS = [
  { id: 'A1', price: 1500000 },
  { id: 'A2', price: 2000000 },
  { id: 'A3', price: 2500000 },
  { id: 'B1', price: 4000000 },
  { id: 'B2', price: 5000000 },
  { id: 'B3', price: 6000000 },
  { id: 'C1', price: 8000000 },
  { id: 'C2', price: 10000000 }
]
