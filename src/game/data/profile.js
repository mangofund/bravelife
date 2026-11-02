// 角色创建：外观、出身、人生愿望
import { fmtMoney } from '../currency.js'

export const GENDERS = [
  { id: 'm', name: '男生', emoji: '👨' },
  { id: 'f', name: '女生', emoji: '👩' },
  { id: 'x', name: '不设定', emoji: '🧑' }
]

export const SKINS = [
  { id: 'a', name: '白皙', tone: '🏻', color: '#f7dcc8' },
  { id: 'b', name: '自然', tone: '🏼', color: '#eac09a' },
  { id: 'c', name: '小麦', tone: '🏽', color: '#c99466' },
  { id: 'd', name: '古铜', tone: '🏾', color: '#9c6a43' },
  { id: 'e', name: '深色', tone: '🏿', color: '#6b4428' }
]

export const HAIRS = [
  { id: 'black', name: '黑色短发', color: '#2b2b2b' },
  { id: 'brown', name: '茶色长发', color: '#8a5a3b' },
  { id: 'blonde', name: '金色卷发', color: '#e8c15a' },
  { id: 'pink', name: '樱花波波头', color: '#f39ab8' },
  { id: 'silver', name: '银色寸头', color: '#b9c2cc' },
  { id: 'blue', name: '蓝色狼尾', color: '#4a7fd1' }
]

export const OUTFITS = [
  { id: 'suit', name: '西装', emoji: '👔' },
  { id: 'dress', name: '连衣裙', emoji: '👗' },
  { id: 'tee', name: 'T 恤', emoji: '👕' },
  { id: 'jacket', name: '夹克', emoji: '🧥' },
  { id: 'kimono', name: '和服', emoji: '👘' },
  { id: 'sport', name: '运动服', emoji: '🎽' }
]

export const BACKGROUNDS = [
  {
    id: 'rich',
    name: '名门之后',
    icon: '💎',
    desc: '家里在港区有几栋楼。起步资金充足，住进 1LDK 高层公寓，自带一点人脉和魅力。',
    money: 3000000,
    home: '1ldk',
    skills: { fit: 5, int: 10, cha: 20, cre: 5, cook: 0 },
    rep: 15,
    payBonus: 0
  },
  {
    id: 'normal',
    name: '普通家庭',
    icon: '🏡',
    desc: '从地方城市来东京打拼，父母给了一笔安家费。各项能力均衡。',
    money: 800000,
    home: '1k',
    skills: { fit: 10, int: 10, cha: 10, cre: 10, cook: 5 },
    rep: 5,
    payBonus: 0
  },
  {
    id: 'self',
    name: '白手起家',
    icon: '🔥',
    desc: '只带着一个行李箱来到东京，住进老旧木造公寓。身体结实，打工收入 +15%。',
    money: 150000,
    home: 'wood',
    skills: { fit: 20, int: 5, cha: 5, cre: 10, cook: 10 },
    rep: 0,
    payBonus: 0.15
  }
]

export const WISHES = [
  { id: 'ceo', name: '登上职业巅峰', icon: '👑', desc: '在任意职业中升到最高职位' },
  { id: 'rich', name: '亿万富翁', icon: '💰', desc: '净资产达到 ' + fmtMoney(100000000) },
  { id: 'governor', name: '当选都知事', icon: '🏛️', desc: '赢得一次东京都知事选举' },
  { id: 'seaview', name: '湾岸海景房', icon: '🌊', desc: '买下湾岸海景别墅' },
  { id: 'famous', name: '家喻户晓', icon: '🌟', desc: '声望达到 100' }
]

export const SKILL_NAMES = {
  fit: '体能',
  int: '智识',
  cha: '魅力',
  cre: '创意',
  cook: '厨艺'
}

export const STAT_NAMES = {
  hunger: '饱腹',
  energy: '精力',
  mood: '心情',
  health: '健康'
}
