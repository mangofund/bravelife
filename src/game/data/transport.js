// 出行方式：按地图距离计算耗时和费用。省钱的方式慢，花钱的方式快
// speed：公里/小时；wait：候车、取车等固定耗时（分钟）；base + perKm × 公里 = 费用
// farSpeed：去远郊（如湘南海滩）时走高速/快速线路的速度；maxKm：超过这个距离就不能用

// 地图坐标是百分比：横向 100% ≈ 14 公里，纵向 100% ≈ 18.7 公里（与地图 3:4 比例一致）
export const KM_PER_PCT_X = 0.14
export const KM_PER_PCT_Y = 0.1866
// 远郊地点额外的距离
export const FAR_EXTRA_KM = 45

export const MODES = [
  { id: 'walk', name: '步行', icon: '🚶', speed: 4.5, wait: 0, base: 0, perKm: 0, maxKm: 10, energyPerHour: 3, desc: '免费，但最慢，还会累' },
  { id: 'bike', name: '自行车', icon: '🚲', speed: 14, wait: 2, base: 0, perKm: 0, maxKm: 20, energyPerHour: 4, needs: 'bike', desc: '买了以后免费，比走路快很多' },
  { id: 'train', name: '电车', icon: '🚃', speed: 32, farSpeed: 55, wait: 12, base: 170, perKm: 18, desc: '便宜，要等车和换乘' },
  { id: 'taxi', name: '出租车', icon: '🚕', speed: 26, farSpeed: 70, wait: 4, base: 500, perKm: 380, desc: '门到门最快，很贵' },
  { id: 'car', name: '私家车', icon: '🚗', speed: 28, farSpeed: 75, wait: 6, base: 300, perKm: 22, needs: 'car', desc: '油费加停车费，比出租车便宜得多' }
]

export const MODE_MAP = MODES.reduce((m, x) => {
  m[x.id] = x
  return m
}, {})

// 可购买的交通工具；汽车每周还要交停车费（和房租同一天扣）
export const VEHICLES = {
  bike: { name: '自行车', icon: '🚲', price: 30000, desc: '10 公里以内的出行又快又免费' },
  car: { name: '小型汽车', icon: '🚗', price: 2200000, parking: 12000, desc: '每次出行只花油费和停车费，每周停车位租金' }
}

// 出租车、私家车遇到路边事件的概率低一些
export const EVENT_RATE = { walk: 1, bike: 1, train: 1, taxi: 0.35, car: 0.35 }
