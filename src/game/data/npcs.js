// 可结识的 NPC：在固定地点的固定时段出现；likes 为喜欢的礼物
// 他们和主角同龄，是一起长大的同学；youth 是主角和父母同住期间（18 岁前）的地点、时段和台词
// 好感度阶段：认识 0 → 朋友 20 → 好友 50 → 可表白 70 → 恋人 → 求婚需 90 + 婚戒

export const NPCS = [
  {
    id: 'haruka', name: '春香', icon: '👩‍🎨', job: '自由插画师', location: 'library', hours: [10, 18],
    likes: ['sweets', 'figure'], intro: '在图书馆角落画速写的女孩，桌上摊着一本画册。',
    lines: ['最近在画一组东京街景，你觉得哪条街最有味道？', '下雨天的图书馆最适合画画了。', '我在想要不要办个人画展……'],
    youth: { location: 'library', hours: [15, 19], job: '同班同学', intro: '总在角落画画的同班女生，被看到时会把本子合上。', lines: ['……你、你看到了吗？', '我想画下雨天的图书馆。', '你觉得我画得……还行吗？'] }
  },
  {
    id: 'ren', name: '莲', icon: '🧑‍🍳', job: '拉面店少东家', location: 'ramen', hours: [11, 23],
    likes: ['sweets', 'perfume'], intro: '拉面店里一边煮面一边哼歌的年轻人。',
    lines: ['我家的汤底熬了十二个小时！', '想自己开一家分店，可惜钱还不够。', '今天的叉烧特别成功，给你多加一片。'],
    youth: { location: 'ramen', hours: [15, 21], job: '同班同学 · 拉面店的儿子', intro: '放学后在自家拉面店帮忙端碗的同班男生。', lines: ['今天的汤我也帮忙熬了！', '我爸说我身上的味道是勋章。哼。', '以后我要做出比我爸还好吃的拉面。'] }
  },
  {
    id: 'aoi', name: '葵', icon: '👩‍💻', job: '创业公司工程师', location: 'shibuya_tech', hours: [10, 22],
    likes: ['figure', 'flower'], intro: '戴着降噪耳机、对着三块屏幕敲代码的人。',
    lines: ['我们的 App 下周上线，紧张死了。', '咖啡是写代码的燃料。', '周末想去电器街淘个机械键盘。'],
    youth: { location: 'akiba', hours: [15, 19], job: '隔壁班同学', intro: '蹲在电器街零件店前面看电路板的女生，很少说话。', lines: ['这个电阻……有意思。', '人类说话太麻烦了，电脑不会误会我。', '我在做一个会自己走路的机器人。'] }
  },
  {
    id: 'kenta', name: '健太', icon: '🏋️', job: '健身教练', location: 'gym', hours: [7, 21],
    likes: ['sweets', 'flower'], intro: '健身房里笑声最大的教练，肌肉线条清晰。',
    lines: ['今天练腿了吗？', '蛋白质要吃够！', '我其实偷偷喜欢吃甜食……别告诉别人。'],
    youth: { location: 'park', hours: [15, 19], job: '同班同学 · 体育委员', intro: '在公园跑道上一圈圈冲刺的男生，笑声很大。', lines: ['比赛跑步吗？输的人请喝果汁！', '我以后要去奥运会！', '今天也跑了十公里！'] }
  },
  {
    id: 'mio', name: '美绪', icon: '🎙️', job: '地下偶像', location: 'livehouse', hours: [17, 24],
    likes: ['flower', 'perfume'], intro: '舞台上闪闪发光，台下却有点害羞的偶像。',
    lines: ['今天的演出你来看了吗？', '总有一天要站上武道馆的舞台！', '谢谢你一直支持我。'],
    youth: { location: 'karaoke', hours: [15, 20], job: '同班同学', intro: '在卡拉 OK 门口练舞的女生，书包上挂满了偶像徽章。', lines: ['你看我这个动作像不像偶像？', '我以后一定要站上舞台！', '……其实我很怕别人觉得我奇怪。'] }
  },
  {
    id: 'daichi', name: '大地', icon: '👨‍💼', job: '商社前辈', location: 'izakaya', hours: [18, 26],
    likes: ['perfume', 'sweets'], intro: '下班后总在居酒屋吧台独酌的西装男人。',
    lines: ['工作嘛，最重要的是人情。', '年轻人就该多闯闯。', '再来一杯，今天我请。'],
    youth: { location: 'temple', hours: [15, 18], job: '学长（大 2 届）', intro: '在仲见世帮家里看店的学长，总给学弟学妹塞点心。', lines: ['小鬼，作业写完了吗？', '有人欺负你就跟我说。', '这个人形烧送你，别告诉我妈。'] }
  },
  {
    id: 'yui', name: '结衣', icon: '👩‍⚕️', job: '护士', location: 'hospital', hours: [8, 20],
    likes: ['flower', 'sweets'], intro: '走路飞快、说话温柔的护士。',
    lines: ['记得按时吃饭，别熬夜。', '今天值班好忙……', '能看到病人康复出院是最开心的事。'],
    youth: { location: 'hospital', hours: [15, 19], job: '同班同学', intro: '放学后总在医院走廊写作业的女生，她妈妈住院很久了。', lines: ['护士姐姐们都对我很好。', '等我长大了，也要当护士。', '今天妈妈的气色好多了！'] }
  },
  {
    id: 'sho', name: '翔', icon: '🏄', job: '冲浪店店员', location: 'beach', hours: [9, 18],
    likes: ['figure', 'perfume'], intro: '晒得黝黑、抱着冲浪板的阳光青年。',
    lines: ['今天的浪不错，要不要一起下水？', '海边的日落是全日本最美的。', '我在攒钱买一块新板子。'],
    youth: { location: 'beach', hours: [10, 18], job: '湘南的少年', intro: '抱着一块旧冲浪板的晒黑少年，说话带着海边口音。', lines: ['东京的孩子都这么白吗？', '浪来了！你会游泳吗？', '我爸要我以后去开渔船……我才不要。'] }
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
