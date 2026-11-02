// 剧情事件 · 学校、出身支线、同学的个人故事
// when(c)：触发条件；c 为剧情上下文（见 engine/story.js 的 ctx）
// repeat：daily 每天一次 / yearly 每年一次 / 不写为一生一次；routine 不计入每天的剧情上限
// 选项：tag 为 brave 勇敢 / crazy 发疯 / lazy 摆烂 / stunt 整活；roll(c) 为成功率，成功走 win，失败走 lose
// 结果字段：effects 状态、skills 能力、money、rep、aff 好感、meet 认识、courage、flags、title、msg、run 引擎处理、then 后续对话

export const SCHOOL_STORIES = [
  {
    id: 'school_morning', icon: '🎒', title: '上学去', repeat: 'daily', routine: true,
    when: (c) => c.minor && c.schoolDay && c.grade >= 1 && c.grade <= 12 && c.hour >= 7.5 && c.hour < 12,
    scenes: [{ who: '妈妈', text: (c) => (c.hour >= 9 ? '「' + c.name + '！都几点了，你已经迟到了！」' : '「' + c.name + '，该出门了，别忘了带便当！」') }],
    choices: [
      { label: '背上书包出门', run: 'goSchool' },
      { label: '🫠 装病：「妈……我肚子好痛……」', tag: 'lazy', cond: (c) => c.truantThisMonth < 1, run: 'truant' }
    ]
  },
  {
    id: 'school_first', icon: '🏫', title: '新学期的第一天',
    when: (c) => c.minor && c.loc === 'school' && c.hour >= 15 && c.grade >= 1,
    scenes: [
      { who: '旁白', text: '樱丘学园的教室里，窗外的樱花还没落完。' },
      { who: '旁白', text: '靠窗的位置坐着一个低头画画的女生，前排的男生身上有一股好闻的拉面味。' },
      { who: '老师', text: '「从今天起大家就是同班同学了，要好好相处哦。」' }
    ],
    choices: [
      { label: '主动坐到画画的女生旁边', tag: 'brave', meet: ['haruka', 'ren'], aff: { haruka: 8 }, then: [{ who: '春香', text: '「……你、你好。我叫春香。」她把本子合上了，耳朵红红的。' }] },
      { label: '🎭 和前排男生抢最后一个炒面面包', tag: 'stunt', meet: ['haruka', 'ren'], roll: (c) => 0.3 + c.skills.fit / 100,
        win: { aff: { ren: 10 }, then: [{ who: '莲', text: '「可恶，你跑得真快！……我叫莲，下次我一定赢回来！」' }] },
        lose: { aff: { ren: 6 }, effects: { mood: -3 }, then: [{ who: '莲', text: '「嘿嘿，我赢了。分你一半吧，我叫莲。」' }] } },
      { label: '安静地坐着，等别人先开口', meet: ['haruka', 'ren'], then: [{ who: '旁白', text: '放学时，前排的男生回头说：「我叫莲，你呢？」靠窗的女生小声说她叫春香。' }] }
    ]
  },
  {
    id: 'dream_essay', icon: '✏️', title: '作文课：我的梦想',
    when: (c) => c.minor && c.grade <= 6 && c.loc === 'school' && c.hour >= 15 && !c.dream && c.daysSince('school_first') >= 3,
    scenes: [
      { who: '老师', text: '「今天的作文题目是《我的梦想》。写什么都可以，写你真正想做的事。」' },
      { who: '旁白', text: '春香在纸上画了一支画笔，莲写了满满一页拉面。你握着铅笔想了很久。' }
    ],
    choices: [
      { label: '👔 我要当社长', run: 'dream:boss' },
      { label: '💰 我要当大富翁', run: 'dream:tycoon' },
      { label: '🤝 我要让大家都过得好', run: 'dream:helper' },
      { label: '🌊 我要住在海边', run: 'dream:sea' },
      { label: '📺 我要上电视', run: 'dream:tv' },
      { label: '❓ 我还不知道……', run: 'dream:unknown', then: [{ who: '老师', text: '「不知道也没关系。能诚实地写『不知道』，也是一种勇气。」' }] }
    ]
  },
  {
    id: 'grad_elem', icon: '🌸', title: '小学毕业式', turning: true,
    on: (c) => c.minor && c.grade === 6 && c.month === 3 && c.date >= 18 && c.date <= 24,
    when: (c) => c.minor && c.grade === 6 && c.month === 3 && c.date >= 18 && c.loc === 'school' && c.hour >= 15,
    scenes: [
      { who: '旁白', text: '体育馆里摆满了折叠椅。校长念到你的名字时，你的腿有点软。' },
      { who: '旁白', text: (c) => '这六年，你完成了 ' + c.goalsDone + ' 个小小的冒险。' + (c.bf ? c.bf.name + '在台下朝你挥手。' : '') },
      { who: '旁白', text: '下个月就是初中生了。教学楼还是那栋，大家却好像都长高了一点。' }
    ],
    choices: [
      { label: '和每一个朋友好好道别', affAll: 5, effects: { mood: 15 } },
      { label: '🤪 在台上大喊「我会想你们的！！」', tag: 'crazy', roll: () => 0.6,
        win: { title: 'tearjerker', affAll: 8, effects: { mood: 20 }, then: [{ who: '旁白', text: '全场安静了一秒，然后哭成一片。连校长都在擦眼镜。' }] },
        lose: { effects: { mood: 5 }, then: [{ who: '旁白', text: '麦克风刚好没电了。只有前排的莲听见了，他笑得直不起腰。' }] } }
    ]
  },
  // ---------- 出身支线 · 第 1 个节点 ----------
  {
    id: 'rich_cram', icon: '📚', title: '补习班还是公园',
    when: (c) => c.minor && c.bg === 'rich' && c.grade >= 2 && c.grade <= 6 && c.schoolDay && c.loc === 'school' && c.hour >= 15 && c.hour < 17,
    scenes: [
      { who: '管家', text: (c) => '「' + (c.gender === 'm' ? '少爷' : c.gender === 'f' ? '小姐' : c.name + '大人') + '，车已经在校门口了。今天的补习班是数学和英语。」' },
      { who: '莲', text: '「喂，我们要去公园踢球，你来不来？」' }
    ],
    choices: [
      { label: '乖乖上车去补习班', skills: { int: 3 }, effects: { mood: -5 }, msg: { from: '爸爸', text: '听管家说你今天很认真。不错。' } },
      { label: '跟管家说「今天我想自己走回家」，然后溜去公园', tag: 'brave', skills: { fit: 2 }, effects: { mood: 12 }, aff: { ren: 6 }, flags: { rich_park: true },
        msg: { from: '爸爸', text: '补习班说你今天没去。……晚上我们谈谈。' } },
      { label: '🎭 把补习班老师也拉去公园踢球', tag: 'stunt', roll: (c) => 0.25 + c.skills.cha / 100,
        win: { title: 'rebel', effects: { mood: 18 }, skills: { cha: 2 }, then: [{ who: '旁白', text: '老师犹豫了三秒，脱掉皮鞋当了守门员。他说他小时候也想当足球运动员。' }] },
        lose: { effects: { mood: -8 }, then: [{ who: '旁白', text: '老师推了推眼镜：「作业加倍。」' }] } }
    ]
  },
  {
    id: 'normal_birthday', icon: '🎂', title: '妈妈忘了我的生日',
    when: (c) => c.minor && c.bg === 'normal' && c.age >= 7 && c.age <= 11 && c.birthday && c.hour >= 17 && c.loc === 'home',
    scenes: [
      { who: '旁白', text: '餐桌上只有普通的咖喱。没有蛋糕，没有蜡烛。' },
      { who: '妈妈', text: '「……啊，快吃吧，吃完早点睡。」她的眼睛有点红。' }
    ],
    choices: [
      { label: '生气地跑回房间', effects: { mood: -10 }, then: [{ who: '旁白', text: '半夜你听见厨房有声音。第二天早上，桌上多了一个歪歪扭扭的手作蛋糕。' }] },
      { label: '小声问：「妈妈，你今天怎么了？」', tag: 'brave', effects: { mood: 5 }, flags: { normal_layoff: true },
        then: [{ who: '妈妈', text: '「……妈妈今天被公司辞退了。对不起，生日快乐。」她抱着你哭了很久。' }, { who: '旁白', text: '那天你第一次觉得，大人也会害怕。' }] },
      { label: '🎭 自己用饼干和果酱堆一个「蛋糕」', tag: 'stunt', skills: { cook: 2 }, effects: { mood: 10 },
        then: [{ who: '旁白', text: '妈妈看着那座歪掉的饼干塔，先是笑出了声，然后哭了。' }] }
    ]
  },
  {
    id: 'self_dinner', icon: '🍳', title: '一个人的晚饭',
    when: (c) => c.minor && c.bg === 'self' && c.grade >= 1 && c.grade <= 6 && c.schoolDay && c.loc === 'home' && c.hour >= 18 && c.hour < 21,
    scenes: [
      { who: '旁白', text: '妈妈今天又要上晚班。冰箱上贴着纸条：「对不起，自己吃点东西。」' },
      { who: '旁白', text: '冰箱里有两个鸡蛋、一把葱和半碗冷饭。' }
    ],
    choices: [
      { label: '泡一碗杯面', effects: { hunger: 25 } },
      { label: '踩着凳子，试着自己做蛋炒饭', tag: 'brave', skills: { cook: 10 }, effects: { hunger: 40, mood: 8 },
        then: [{ who: '旁白', text: '饭有点焦，但你留了一半放进保鲜盒，贴上纸条：「妈妈辛苦了」。' }] },
      { label: '🫠 摆烂：饿着肚子等妈妈回来', tag: 'lazy', effects: { hunger: 30, mood: 15 },
        then: [{ who: '旁白', text: '十点半，妈妈带着便利店打折的便当回来了。你们一人一半，吃得很香。' }] }
    ]
  }
]
