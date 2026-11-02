// 剧情事件 · 勇气商店、节日、生日、离开家

export const LIFE_STORIES = [
  {
    id: 'shop_first', icon: '🐈‍⬛', title: '黑猫与小巷',
    when: (c) => !c.flag('shop_found') && c.rain && c.hour >= 20 && c.loc !== 'home' && c.loc !== 'courage',
    scenes: [
      { who: '旁白', text: '雨下得很大。一只黑猫从你脚边窜过，钻进了一条你从没见过的小巷。' },
      { who: '旁白', text: '巷子尽头，一盏旧灯笼亮着。招牌上写着：「勇气商店」。' }
    ],
    choices: [
      { label: '跟上去', tag: 'brave', run: 'enterShop', title: 'lone_brave',
        then: [
          { who: '店主', text: (c) => (c.minor ? '「啊，来了。比你妈妈当年早了两年。」' : '「啊，终于来了。你妈妈当年可比你早多了。」') },
          { who: c0 => c0.name, text: '「……你认识我妈妈？」' },
          { who: '店主', text: '「我认识很多人。坐吧，雨停之前，这里是你的。」' },
          { who: '店主', text: '「第一次来的人，不收勇气。」他递来一颗糖，又从柜台下拿出一样旧东西：「这是你家的。先看第一页吧。」' }
        ] },
      { label: '太黑了，还是回家吧', retry: true, then: [{ who: '旁白', text: '你回头看了一眼。灯笼好像熄了。' }] }
    ]
  },
  {
    id: 'birthday', icon: '🎂', title: '生日快乐', repeat: 'yearly',
    on: (c) => c.birthday,
    when: (c) => c.birthday && c.hour >= 17 && c.loc === 'home' && !c.doneToday('normal_birthday'),
    scenes: [
      { who: '旁白', text: (c) => (c.minor ? '桌上摆着蛋糕，插着 ' + c.age + ' 根蜡烛。爸爸妈妈在唱跑调的生日歌。' : '手机响了好几次。' + c.age + ' 岁了，你给自己买了一块小蛋糕。') },
      { who: '旁白', text: (c) => (c.giftBike ? '妈妈从门后推出一辆崭新的自行车：「骑车要小心哦！」' : '许个愿吧。') }
    ],
    choices: [
      { label: '闭上眼睛，许一个大大的愿望', tag: 'brave', courage: 5, effects: { mood: 10 }, run: 'birthdayGift' },
      { label: '🤪 一口气吹灭蜡烛，再把奶油抹到自己脸上', tag: 'crazy', effects: { mood: 18 }, run: 'birthdayGift' },
      { label: '安静地吃蛋糕', effects: { mood: 10, hunger: 20 }, run: 'birthdayGift' }
    ]
  },
  {
    id: 'hanami', icon: '🌸', title: '花见', repeat: 'yearly',
    when: (c) => c.festival === 'hanami' && c.loc === 'park' && c.hour >= 9 && c.hour < 18,
    scenes: [
      { who: '旁白', text: '樱花开到最满。风一吹，花瓣像雪一样落下来。' },
      { who: '旁白', text: (c) => (c.bf ? c.bf.name + '正坐在树下朝你招手。' : '树下铺满了野餐布，到处都是笑声。') }
    ],
    choices: [
      { label: '铺块布坐下，什么也不想', effects: { mood: 15 }, affBf: 5 },
      { label: '🎭 在樱花树下即兴表演一段', tag: 'stunt', roll: (c) => 0.3 + c.skills.cha / 80,
        win: { effects: { mood: 15 }, skills: { cha: 2 }, rep: 2, then: [{ who: '旁白', text: '路过的人停下来鼓掌，还有个老奶奶给了你一个饭团。' }] },
        lose: { effects: { mood: 5 }, then: [{ who: '旁白', text: '刚开口，一阵风把花瓣全吹进了你嘴里。' }] } },
      { label: '拍一张照片发给家里', effects: { mood: 8 }, msg: { from: '妈妈', text: '好漂亮！明年一起去看吧。' } }
    ]
  },
  {
    id: 'tanabata', icon: '🎋', title: '七夕的短册', repeat: 'yearly',
    when: (c) => c.festival === 'tanabata' && c.hour >= 17 && c.loc !== 'home',
    scenes: [{ who: '旁白', text: '商店街的竹子上挂满了五颜六色的短册。有人递给你一张空白的。' }],
    choices: [
      { label: '写「希望家人身体健康」', effects: { mood: 6 } },
      { label: '写下自己真正的愿望', tag: 'brave', effects: { mood: 8 }, then: [{ who: '旁白', text: (c) => '你写下了「' + (c.dreamName || '我想找到自己想做的事') + '」，挂在了最高的那根枝上。' }] },
      { label: '🫠 写「希望明天放假」', tag: 'lazy', effects: { mood: 10 } }
    ]
  },
  {
    id: 'hanabi', icon: '🎆', title: '隅田川花火大会', repeat: 'yearly',
    when: (c) => c.festival === 'hanabi' && c.loc === 'temple' && c.hour >= 18.5 && c.hour < 22,
    scenes: [
      { who: '旁白', text: '第一发花火升上夜空，整条河岸都安静了一秒，然后一起「哇——」地叫出声。' },
      { who: '旁白', text: (c) => (c.bf ? c.bf.name + '挤过人群站到你身边：「找到你了！」' : '你一个人站在人群里，抬头看着天空。') }
    ],
    choices: [
      { label: '安静地看完整场', effects: { mood: 20 }, affBf: 10 },
      { label: '🎭 跟着老爷爷一起大喊「たまや～！」', tag: 'stunt', roll: () => 0.7,
        win: { effects: { mood: 22 }, rep: 1, then: [{ who: '旁白', text: '周围的人全都跟着喊了起来。那一瞬间，你觉得整个东京都是你的朋友。' }] },
        lose: { effects: { mood: 8 }, then: [{ who: '旁白', text: '你喊完，那一发刚好是哑炮。全场安静。' }] } }
    ]
  },
  {
    id: 'xmas', icon: '🎄', title: '平安夜', repeat: 'yearly',
    when: (c) => c.festival === 'xmas' && c.hour >= 17,
    scenes: [{ who: '旁白', text: (c) => (c.minor ? '家里飘着炸鸡的香味。在日本，圣诞节就是要吃炸鸡。' : '街上的灯饰亮得晃眼。便利店门口排着买炸鸡的长队。') }],
    choices: [
      { label: '给重要的人发一句「圣诞快乐」', effects: { mood: 8 }, affBf: 5 },
      { label: '🫠 一个人吃掉一整个蛋糕', tag: 'lazy', effects: { mood: 15, hunger: 40, health: -3 } },
      { label: '🎭 扮成圣诞老人，挨家挨户给邻居送饼干', tag: 'stunt', roll: (c) => 0.4 + c.skills.cha / 100,
        win: { rep: 3, effects: { mood: 12 }, then: [{ who: '旁白', text: '隔壁的小孩抱着你的腿不放：「圣诞老人是真的！」' }] },
        lose: { effects: { mood: -5 }, then: [{ who: '旁白', text: '楼下的大叔报了警。警察叔叔听完解释，笑着收下了一块饼干。' }] } }
    ]
  },
  {
    id: 'newyear', icon: '🎍', title: '初诣', repeat: 'yearly',
    when: (c) => c.festival === 'newyear' && c.loc === 'shrine' && c.hour >= 6 && c.hour < 18,
    scenes: [{ who: '旁白', text: '鸟居前排着长长的队。轮到你时，你把五日元硬币投进了香火箱。' }],
    choices: [
      { label: '许愿：「今年我要更勇敢一点」', tag: 'brave', effects: { mood: 8 } },
      { label: '许愿：「今年也平平安安」', effects: { mood: 10, health: 3 } },
      { label: '🤪 投一万日元，大声许愿「我要发财！！」', tag: 'crazy', cond: (c) => c.money >= 10000, money: -10000, effects: { mood: 12 },
        then: [{ who: '旁白', text: '后面排队的人都笑了。神主大人也笑了。' }] }
    ]
  },
  {
    id: 'leave_home', icon: '🧳', title: '离开家', turning: true,
    on: (c) => c.minor && c.grade >= 13,
    when: (c) => c.minor && c.grade >= 13,
    scenes: [
      { who: '旁白', text: '高中毕业了。行李箱比你想象的轻，只装下了几件衣服和一些旧东西。' },
      { who: '旁白', text: (c) => ({ rich: '管家把车开到了门口。父亲站在玄关，最后只说了一句：「东京很大，别输给它。」', normal: '父母送你到车站。爸爸一直在检查你的车票，妈妈往你包里塞了第五个饭团。', self: '妈妈请了半天假。她在站台上一直挥手，直到电车开出很远。' })[c.bg] },
      { who: '旁白', text: (c) => (c.dreamName ? '你想起了小时候写的作文：《' + c.dreamName + '》。' : '你还不知道自己想成为什么样的人。') + '从今天起，人生要自己选了。' }
    ],
    choices: [
      { label: '坚持小时候的梦想', tag: 'brave', cond: (c) => !!c.dreamWish, run: 'keepDream', title: 'firm' },
      { label: '👑 改选：登上职业巅峰', run: 'wish:ceo', cond: (c) => c.dreamWish !== 'ceo' },
      { label: '💰 改选：亿万富翁', run: 'wish:rich', cond: (c) => c.dreamWish !== 'rich' },
      { label: '🏛️ 改选：当选都知事', run: 'wish:governor', cond: (c) => c.dreamWish !== 'governor' },
      { label: '🌊 改选：湾岸海景房', run: 'wish:seaview', cond: (c) => c.dreamWish !== 'seaview' },
      { label: '🌟 改选：家喻户晓', run: 'wish:famous', cond: (c) => c.dreamWish !== 'famous' }
    ]
  }
]
