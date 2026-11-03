// 家园保留主场景，工具页由上层以半透明浮层承载。
export const HOME_SCENES = [
  { id: 'room', group: 'room', name: '家园', icon: '🏠', tip: '房间与菜园在一起，照料日常也照料自己。' },
  { id: 'garden', group: 'garden', name: '我的菜园', icon: '🌱', tip: '现实时间生长 · 缺水会变慢，成熟不会腐烂。' },
  { id: 'inventory', group: 'inventory', name: '家园仓库', icon: '📦', tip: '家具、种子与口粮，按自己的生活安排取用。' },
  { id: 'food', group: 'life', name: '厨房与餐桌', short: '吃饭', icon: '🍱', tip: '做一顿饭，或给今天点份喜欢的外卖。' },
  { id: 'chores', group: 'life', name: '小屋家务', short: '家务', icon: '🧹', tip: '收拾一点，舒服一点。' },
  { id: 'rest', group: 'life', name: '休息时光', short: '休息', icon: '🌙', tip: '休息一下，再做喜欢的事。' },
  { id: 'pets', group: 'life', name: '家里的伙伴', short: '宠物', icon: '🐾', tip: '记得添粮，也记得陪伴。' }
]
export const HOME_NAV = [
  { id: 'room', scene: 'room', name: '家园', icon: '🏠' },
  { id: 'inventory', scene: 'inventory', name: '仓库', icon: '📦' },
  { id: 'life', scene: 'food', name: '生活', icon: '☕' }
]
