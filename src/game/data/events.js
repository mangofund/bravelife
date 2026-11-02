// 随机事件（出行时触发）、选举候选人、每日新闻

export const EVENT_CHANCE = 0.15

// cond：触发条件（能力/金钱下限）；choices 的 effects 字段与行动一致，另支持 money、hours
export const EVENTS = [
  {
    id: 'wallet', icon: '👛', title: '捡到钱包',
    text: '车站长椅上有个鼓鼓的钱包，里面大概有两万日元。',
    choices: [
      { label: '交给警察', effects: { mood: 5, hours: 0.5 }, rep: 3, msg: '失主打来电话道谢。' },
      { label: '据为己有', effects: { money: 20000, mood: -5 }, rep: -5, msg: '心里有点不踏实。' }
    ]
  },
  {
    id: 'delay', icon: '🚃', title: '电车延误',
    text: '线路发生故障，车厢里挤满了人。',
    choices: [{ label: '只能等了', effects: { hours: 1, mood: -5, energy: -5 } }]
  },
  {
    id: 'scout', icon: '📸', title: '街头星探',
    text: '一位经纪人递来名片：“有兴趣来试镜吗？”',
    cond: { cha: 25 },
    choices: [
      { label: '去试镜', effects: { hours: 2, energy: -10, mood: 10 }, skills: { cha: 3 }, rep: 4, msg: '试镜官说你很有镜头感。' },
      { label: '婉拒', effects: {} }
    ]
  },
  {
    id: 'rain', icon: '🌧️', title: '突然下雨',
    text: '出门时还是晴天，现在雨越下越大。',
    choices: [
      { label: '买把伞', effects: { money: -500 } },
      { label: '冒雨前进', effects: { health: -5, mood: -5 } }
    ]
  },
  {
    id: 'friend', icon: '🍻', title: '偶遇老同学',
    text: '“好久不见！要不要去喝一杯？”',
    cond: { money: 4000 },
    choices: [
      { label: '走，喝一杯', effects: { money: -4000, hours: 2, mood: 15, hunger: 20 }, skills: { cha: 1 } },
      { label: '下次吧', effects: { mood: -2 } }
    ]
  },
  {
    id: 'lottery', icon: '🎫', title: '商店街抽奖',
    text: '用购物小票换了一次抽奖机会。',
    choices: [{ label: '转转盘！', lottery: true }]
  },
  {
    id: 'tourist', icon: '🗺️', title: '迷路的游客',
    text: '一位外国游客拿着地图，一脸困惑地看着你。',
    choices: [
      { label: '带路', effects: { hours: 0.5, mood: 6 }, skills: { cha: 1 }, rep: 2 },
      { label: '装作没看见', effects: { mood: -3 } }
    ]
  },
  {
    id: 'cat', icon: '🐈', title: '路边的猫',
    text: '一只橘猫蹭了蹭你的腿。',
    choices: [{ label: '摸摸它', effects: { mood: 10, hours: 0.25 } }]
  },
  {
    id: 'flyer', icon: '📄', title: '发传单的兼职',
    text: '路边有人招募临时发传单，一小时 ¥1,500 现结。',
    choices: [
      { label: '干一小时', effects: { money: 1500, hours: 1, energy: -8 } },
      { label: '不了', effects: {} }
    ]
  },
  {
    id: 'phone_scam', icon: '☎️', title: '可疑电话',
    text: '“您的银行账户异常，请立刻转账到安全账户……”',
    choices: [
      { label: '直接挂断', effects: { mood: 2 }, skills: { int: 1 } },
      { label: '按对方说的做', effects: { money: -30000, mood: -15 }, msg: '被骗了 ¥30,000……' }
    ]
  }
]

export const ELECTION_CYCLE = 28
export const ELECTION_DEPOSIT = 1000000
export const ELECTION_MIN_REP = 40
export const GOVERNOR_SALARY = 80000

export const CANDIDATES = [
  { id: 'sato', name: '佐藤 健一', icon: '🧓', party: '稳健派', base: 45, slogan: '守护东京的日常' },
  { id: 'yamada', name: '山田 美咲', icon: '👩‍💼', party: '改革派', base: 38, slogan: '让年轻人住得起东京' },
  { id: 'suzuki', name: '铃木 太郎', icon: '🧑‍🔧', party: '无党派', base: 25, slogan: '把预算花在街坊身上' }
]

export const CAMPAIGNS = [
  { id: 'speech', name: '街头演说', icon: '📣', hours: 3, cost: 0, desc: '魅力越高效果越好' },
  { id: 'flyer', name: '发传单', icon: '📄', hours: 2, cost: 50000, desc: '稳定增加支持度' },
  { id: 'tv', name: '电视广告', icon: '📺', hours: 1, cost: 2000000, desc: '支持度大幅上涨' }
]

export const NEWS_POOL = [
  '气象厅：本周后半段天气晴好，适合出门。',
  '拉面横丁新开了一家味噌拉面店，开业首日排队两小时。',
  '湾岸地区地价持续上涨，投资客纷纷入场。',
  '都立图书馆延长周末开放时间。',
  '六本木夜店本周末举办电音节。',
  '电器街新款游戏机发售，部分店铺已售罄。',
  '健身房会员数创新高，“上班前撸铁”成为潮流。',
  '樱花公园进入最佳观赏期，游客络绎不绝。',
  '新宿 Live House 的地下偶像团体登上热搜。',
  '场外鱼市清晨拍卖出一条天价金枪鱼。',
  '警察署提醒：近期电话诈骗增多，请勿向陌生账户转账。',
  '湘南海滩迎来冲浪好浪，周末电车车厢爆满。'
]
