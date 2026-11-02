// 可结识的 NPC：在固定地点的固定时段出现；likes 为喜欢的礼物
// 好感度阶段：认识 0 → 朋友 20 → 好友 50 → 可表白 70 → 恋人 → 求婚需 90 + 婚戒

export const NPCS = [
  {
    id: 'haruka', name: '春香', icon: '👩‍🎨', job: '自由插画师', location: 'library', hours: [10, 18],
    likes: ['sweets', 'figure'], intro: '在图书馆角落画速写的女孩，桌上摊着一本画册。',
    lines: ['最近在画一组东京街景，你觉得哪条街最有味道？', '下雨天的图书馆最适合画画了。', '我在想要不要办个人画展……']
  },
  {
    id: 'ren', name: '莲', icon: '🧑‍🍳', job: '拉面店少东家', location: 'ramen', hours: [11, 23],
    likes: ['sweets', 'perfume'], intro: '拉面店里一边煮面一边哼歌的年轻人。',
    lines: ['我家的汤底熬了十二个小时！', '想自己开一家分店，可惜钱还不够。', '今天的叉烧特别成功，给你多加一片。']
  },
  {
    id: 'aoi', name: '葵', icon: '👩‍💻', job: '创业公司工程师', location: 'shibuya_tech', hours: [10, 22],
    likes: ['figure', 'flower'], intro: '戴着降噪耳机、对着三块屏幕敲代码的人。',
    lines: ['我们的 App 下周上线，紧张死了。', '咖啡是写代码的燃料。', '周末想去电器街淘个机械键盘。']
  },
  {
    id: 'kenta', name: '健太', icon: '🏋️', job: '健身教练', location: 'gym', hours: [7, 21],
    likes: ['sweets', 'flower'], intro: '健身房里笑声最大的教练，肌肉线条清晰。',
    lines: ['今天练腿了吗？', '蛋白质要吃够！', '我其实偷偷喜欢吃甜食……别告诉别人。']
  },
  {
    id: 'mio', name: '美绪', icon: '🎙️', job: '地下偶像', location: 'livehouse', hours: [17, 24],
    likes: ['flower', 'perfume'], intro: '舞台上闪闪发光，台下却有点害羞的偶像。',
    lines: ['今天的演出你来看了吗？', '总有一天要站上武道馆的舞台！', '谢谢你一直支持我。']
  },
  {
    id: 'daichi', name: '大地', icon: '👨‍💼', job: '商社前辈', location: 'izakaya', hours: [18, 26],
    likes: ['perfume', 'sweets'], intro: '下班后总在居酒屋吧台独酌的西装男人。',
    lines: ['工作嘛，最重要的是人情。', '年轻人就该多闯闯。', '再来一杯，今天我请。']
  },
  {
    id: 'yui', name: '结衣', icon: '👩‍⚕️', job: '护士', location: 'hospital', hours: [8, 20],
    likes: ['flower', 'sweets'], intro: '走路飞快、说话温柔的护士。',
    lines: ['记得按时吃饭，别熬夜。', '今天值班好忙……', '能看到病人康复出院是最开心的事。']
  },
  {
    id: 'sho', name: '翔', icon: '🏄', job: '冲浪店店员', location: 'beach', hours: [9, 18],
    likes: ['figure', 'perfume'], intro: '晒得黝黑、抱着冲浪板的阳光青年。',
    lines: ['今天的浪不错，要不要一起下水？', '海边的日落是全日本最美的。', '我在攒钱买一块新板子。']
  }
]

export const NPC_MAP = NPCS.reduce((m, n) => {
  m[n.id] = n
  return m
}, {})

export const STAGES = [
  { id: 'met', name: '认识', min: 0 },
  { id: 'friend', name: '朋友', min: 20 },
  { id: 'close', name: '好友', min: 50 }
]

export const DATE_COST = 8000
export const CONFESS_MIN = 70
export const PROPOSE_MIN = 90
// 多少天不联系后好感开始下降
export const NEGLECT_DAYS = 5
export const INVITE_CHANCE = 0.35

export const INVITE_PLACES = [
  { loc: 'izakaya', from: 18, to: 22, text: '今晚要不要去居酒屋喝一杯？' },
  { loc: 'park', from: 10, to: 17, text: '天气真好，下午去樱花公园散步吗？' },
  { loc: 'karaoke', from: 14, to: 22, text: '想去唱卡拉 OK，一起吗？' },
  { loc: 'akiba', from: 12, to: 20, text: '陪我去电器街逛逛？' },
  { loc: 'temple', from: 9, to: 16, text: '想去古寺那边吃小吃，来不来？' }
]
