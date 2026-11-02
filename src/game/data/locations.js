// 城市地图地点。x/y 为地图上的百分比坐标；open 为营业时间 [开, 关]，关门时间可 >24 表示跨夜
// 行动字段：hours 耗时，cost 花费，effects 状态变化，skills 能力增长，rep 声望，daily 每天限一次

export const LOCATIONS = [
  { id: 'home', name: '我的家', icon: '🏠', x: 18, y: 10, open: [0, 24], desc: '回家睡觉、做饭、摆放家具。', actions: [] },
  {
    id: 'konbini', name: '24h 便利店', icon: '🏪', x: 42, y: 8, open: [0, 24], career: 'konbini',
    desc: '饭团、便当、能量饮料，24 小时营业。',
    shop: ['onigiri', 'bento', 'cupnoodle', 'energy'],
    actions: [
      { id: 'onigiri', name: '吃个饭团', icon: '🍙', hours: 0.25, cost: 150, effects: { hunger: 15 } },
      { id: 'bento', name: '微波便当', icon: '🍱', hours: 0.5, cost: 600, effects: { hunger: 40, mood: 2 } }
    ]
  },
  {
    id: 'ramen', name: '拉面横丁', icon: '🍜', x: 68, y: 9, open: [11, 26],
    desc: '一整条街的拉面店，深夜也排着队。',
    actions: [
      { id: 'tonkotsu', name: '豚骨拉面', icon: '🍜', hours: 1, cost: 1000, effects: { hunger: 50, mood: 8 } },
      { id: 'deluxe', name: '加面加蛋全家福', icon: '🥚', hours: 1, cost: 1600, effects: { hunger: 70, mood: 12, health: -2 } }
    ]
  },
  {
    id: 'tsukiji', name: '场外鱼市', icon: '🐟', x: 86, y: 18, open: [5, 14], career: 'chef',
    desc: '清晨最热闹。可以吃海鲜丼，也可以买食材回家做饭。',
    shop: ['veggie', 'fish', 'wagyu'],
    actions: [
      { id: 'kaisendon', name: '海鲜丼', icon: '🍣', hours: 1, cost: 2500, effects: { hunger: 60, mood: 15, health: 2 } },
      { id: 'cookclass', name: '料理教室', icon: '👨‍🍳', hours: 2, cost: 8000, paid: true, effects: { hunger: 20 }, skills: { cook: 5 } }
    ]
  },
  {
    id: 'marunouchi', name: '丸之内写字楼', icon: '🏢', x: 50, y: 21, open: [7, 22], career: 'office',
    desc: '大企业总部集中地，西装革履的人来来往往。',
    actions: [
      { id: 'seminar', name: '商务讲座', icon: '📊', hours: 2, cost: 5000, effects: { mood: -3 }, skills: { int: 2, cha: 1 } }
    ]
  },
  {
    id: 'shibuya_tech', name: '涩谷创业园', icon: '💻', x: 22, y: 28, open: [8, 23], career: 'tech',
    desc: '创业公司和程序员的聚集地，咖啡永远免费。',
    actions: [
      { id: 'hackathon', name: '参加黑客松', icon: '⌨️', hours: 4, cost: 0, daily: true, effects: { energy: -15, mood: 5 }, skills: { cre: 3, int: 2 } }
    ]
  },
  {
    id: 'gym', name: '健身房', icon: '🏋️', x: 76, y: 31, open: [6, 23],
    desc: '撸铁、瑜伽，练出好身体。',
    actions: [
      { id: 'lift', name: '力量训练', icon: '💪', hours: 2, cost: 1500, effects: { energy: -20, health: 3, mood: 3 }, skills: { fit: 3 } },
      { id: 'yoga', name: '瑜伽课', icon: '🧘', hours: 1.5, cost: 2000, effects: { health: 5, mood: 8 }, skills: { fit: 1 } },
      { id: 'trainer', name: '私人教练课', icon: '🏅', hours: 1, cost: 12000, paid: true, effects: { energy: -12, health: 4 }, skills: { fit: 4 } }
    ]
  },
  {
    id: 'library', name: '都立图书馆', icon: '📚', x: 46, y: 35, open: [9, 20],
    desc: '安静、免费，适合埋头学习。',
    actions: [
      { id: 'study', name: '自习', icon: '✏️', hours: 3, cost: 0, effects: { mood: -4 }, skills: { int: 3 } },
      { id: 'novel', name: '读小说', icon: '📖', hours: 2, cost: 0, effects: { mood: 5 }, skills: { cre: 2 } },
      { id: 'tutor', name: '请家教一对一', icon: '👩‍🏫', hours: 2, cost: 15000, paid: true, effects: { mood: -2 }, skills: { int: 5 } }
    ]
  },
  {
    id: 'karaoke', name: '卡拉 OK', icon: '🎤', x: 14, y: 41, open: [10, 29],
    desc: '包厢里吼两个小时，烦恼全忘。',
    actions: [
      { id: 'sing', name: '唱两小时', icon: '🎶', hours: 2, cost: 2000, effects: { mood: 20 }, skills: { cha: 2, cre: 1 } },
      { id: 'vocal', name: '声乐私教', icon: '🎙️', hours: 1.5, cost: 9000, paid: true, effects: { mood: 5 }, skills: { cha: 3, cre: 2 } }
    ]
  },
  {
    id: 'izakaya', name: '居酒屋', icon: '🏮', x: 36, y: 49, open: [17, 27],
    desc: '下班后的据点，一杯啤酒一串烤鸡。',
    actions: [
      { id: 'drink', name: '小酌一杯', icon: '🍺', hours: 2, cost: 3500, effects: { hunger: 30, mood: 15, health: -2 }, skills: { cha: 1 } },
      { id: 'treat', name: '请大家喝酒', icon: '🥂', hours: 3, cost: 12000, effects: { hunger: 30, mood: 12, health: -3 }, skills: { cha: 3 }, rep: 3 }
    ]
  },
  {
    id: 'club', name: '六本木夜店', icon: '🪩', x: 62, y: 45, open: [21, 29],
    desc: '霓虹和重低音，通宵狂欢。',
    actions: [
      { id: 'dance', name: '蹦迪', icon: '💃', hours: 3, cost: 5000, effects: { mood: 30, energy: -25, health: -3 }, skills: { cha: 2 } }
    ]
  },
  {
    id: 'onsen', name: '街角钱汤', icon: '♨️', x: 84, y: 44, open: [15, 25],
    desc: '老式公共澡堂，泡完浑身轻松。',
    actions: [
      { id: 'bath', name: '泡澡', icon: '🛁', hours: 1, cost: 520, effects: { health: 8, mood: 10, energy: 10 } }
    ]
  },
  {
    id: 'shrine', name: '稻荷神社', icon: '⛩️', x: 14, y: 58, open: [6, 18], special: 'omikuji',
    desc: '红色鸟居一路延伸到山上。可以参拜，也可以抽签。',
    actions: [
      { id: 'pray', name: '参拜', icon: '🙏', hours: 0.5, cost: 100, effects: { mood: 5 } }
    ]
  },
  {
    id: 'temple', name: '古寺仲见世', icon: '🏯', x: 32, y: 66, open: [6, 17],
    desc: '香火旺盛的古寺，门前小吃街很热闹。',
    shop: ['sweets'],
    actions: [
      { id: 'donate', name: '祈福捐款', icon: '🪙', hours: 0.5, cost: 10000, daily: true, effects: { mood: 5 }, rep: 2 },
      { id: 'snack', name: '逛小吃街', icon: '🍡', hours: 1, cost: 1500, effects: { hunger: 15, mood: 10 } }
    ]
  },
  {
    id: 'park', name: '樱花公园', icon: '🌸', x: 50, y: 58, open: [5, 23],
    desc: '散步、慢跑、发呆，全部免费。',
    actions: [
      { id: 'walk', name: '散步', icon: '🚶', hours: 1, cost: 0, effects: { mood: 8, health: 2 } },
      { id: 'jog', name: '慢跑', icon: '🏃', hours: 1, cost: 0, effects: { energy: -12, health: 3 }, skills: { fit: 2 } }
    ]
  },
  {
    id: 'akiba', name: '电器街', icon: '🎮', x: 60, y: 68, open: [10, 22],
    desc: '电器、动漫和街机厅。',
    shop: ['figure'],
    actions: [
      { id: 'arcade', name: '玩街机', icon: '🕹️', hours: 1, cost: 1000, effects: { mood: 12 }, skills: { cre: 1 } }
    ]
  },
  {
    id: 'hospital', name: '综合医院', icon: '🏥', x: 86, y: 57, open: [0, 24], career: 'doctor',
    desc: '身体不适就来这里。',
    actions: [
      { id: 'treat', name: '检查治疗', icon: '💊', hours: 2, cost: 8000, effects: { health: 35 } },
      { id: 'blood', name: '无偿献血', icon: '🩸', hours: 1, cost: 0, daily: true, effects: { health: -5, mood: 5 }, rep: 2 }
    ]
  },
  {
    id: 'police', name: '警察署', icon: '🚓', x: 14, y: 76, open: [0, 24], career: 'police',
    desc: '维护治安，也招收新人。',
    actions: [
      { id: 'patrol', name: '志愿巡逻', icon: '🔦', hours: 2, cost: 0, daily: true, effects: { energy: -10 }, skills: { fit: 1 }, rep: 2 }
    ]
  },
  {
    id: 'ginza', name: '银座百货', icon: '🛍️', x: 40, y: 78, open: [10, 20],
    desc: '高级百货和名牌店。礼物和婚戒都在这里买。',
    shop: ['flower', 'perfume', 'ring'],
    actions: [
      { id: 'clothes', name: '买新衣服', icon: '👚', hours: 1.5, cost: 30000, effects: { mood: 15 }, skills: { cha: 3 } },
      { id: 'bag', name: '买名牌包', icon: '👜', hours: 1, cost: 300000, effects: { mood: 25 }, skills: { cha: 6 }, rep: 2 }
    ]
  },
  { id: 'furniture', name: '家具城', icon: '🛋️', x: 64, y: 76, open: [10, 21], special: 'furniture', desc: '床、厨房、电器、装饰品，买回家自己摆。', actions: [] },
  {
    id: 'livehouse', name: '新宿 Live House', icon: '🎸', x: 84, y: 70, open: [16, 27], career: 'idol',
    desc: '地下乐队和偶像出道的地方。',
    actions: [
      { id: 'show', name: '看演出', icon: '🎟️', hours: 2, cost: 4000, effects: { mood: 20 }, skills: { cre: 2 } },
      { id: 'acting', name: '表演工作坊', icon: '🎭', hours: 2, cost: 10000, paid: true, effects: { energy: -8 }, skills: { cha: 3, cre: 3 } }
    ]
  },
  { id: 'cityhall', name: '都厅·投票所', icon: '🗳️', x: 20, y: 87, open: [8, 20], special: 'election', desc: '报名参选东京都知事、拉票、投票。', actions: [] },
  { id: 'estate', name: '不动产中介', icon: '🏘️', x: 48, y: 88, open: [9, 19], special: 'estate', desc: '搬家、买湾岸地块和海景别墅。', actions: [] },
  {
    id: 'beach', name: '湘南海滩', icon: '🏖️', x: 78, y: 85, open: [8, 19], far: true,
    desc: '坐电车一个半小时，冲浪和晒太阳。',
    actions: [
      { id: 'surf', name: '冲浪', icon: '🏄', hours: 3, cost: 4000, effects: { mood: 20, energy: -25 }, skills: { fit: 3 } },
      { id: 'sunbathe', name: '晒太阳', icon: '😎', hours: 2, cost: 0, effects: { mood: 12 } }
    ]
  },
  { id: 'airport', name: '羽田机场', icon: '✈️', x: 84, y: 96, soon: true, open: [0, 24], desc: '即将开放', actions: [] },
  { id: 'fuji', name: '富士山', icon: '🗻', x: 16, y: 96, soon: true, open: [0, 24], desc: '即将开放', actions: [] }
]

export const LOCATION_MAP = LOCATIONS.reduce((m, l) => {
  m[l.id] = l
  return m
}, {})

export const OMIKUJI = [
  { name: '大吉', mood: 20, money: 10000, text: '万事顺遂，财运亨通！' },
  { name: '吉', mood: 12, money: 0, text: '好运正在路上。' },
  { name: '中吉', mood: 8, money: 0, text: '平稳中带着小惊喜。' },
  { name: '小吉', mood: 5, money: 0, text: '小确幸就在身边。' },
  { name: '末吉', mood: 2, money: 0, text: '先苦后甜，坚持下去。' },
  { name: '凶', mood: -8, money: 0, text: '把签绑在树上，厄运就留在神社吧。' }
]
