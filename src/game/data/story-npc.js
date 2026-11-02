// 剧情事件 · 同学的个人故事（第 1 阶段：春香、莲的第 1、2 幕）
// 每一幕都有「帮 / 不帮」：帮了的同学走向好结局，没帮的不会变坏，只会走向平淡结局

export const NPC_STORIES = [
  {
    id: 'haruka1', icon: '🎨', title: '春香 · 被嘲笑的画',
    when: (c) => c.minor && c.grade >= 1 && c.grade <= 6 && c.loc === 'school' && c.hour >= 15 && c.known('haruka') && c.daysSince('school_first') >= 10,
    scenes: [
      { who: '旁白', text: '午休时，几个男生抢走了春香的画本，在教室里传来传去。' },
      { who: '男生', text: '「哈哈哈，这画的是什么？外星人吗？」' },
      { who: '旁白', text: '春香低着头，一句话也没说。你看见她的手在发抖。' }
    ],
    choices: [
      { label: '站起来：「还给她。我觉得她画得很好。」', tag: 'brave', courage: 15, aff: { haruka: 15 }, flags: { haruka1: 'help' },
        then: [{ who: '春香', text: '放学后，她把画本塞给你：「……第一页，送给你。」那页画的是窗边的樱花，和坐在樱花下的你。' }] },
      { label: '假装没看见', flags: { haruka1: 'skip' }, effects: { mood: -5 },
        then: [{ who: '旁白', text: '那天以后，春香再也没在教室里画过画。' }] },
      { label: '🎭 当场画一张更丑的画，盖过所有人的注意力', tag: 'stunt', roll: (c) => 0.35 + c.skills.cre / 80,
        win: { title: 'self_roast', aff: { haruka: 12 }, flags: { haruka1: 'help' }, effects: { mood: 10 },
          then: [{ who: '旁白', text: '你画的「老师」让全班笑翻了。没人再记得春香的画本。她偷偷朝你比了个大拇指。' }] },
        lose: { aff: { haruka: 8 }, flags: { haruka1: 'help' }, courage: 10, effects: { mood: -10 },
          then: [{ who: '旁白', text: '结果你也被嘲笑了一整天。但春香放学后小声说：「……谢谢你。」' }] } }
    ]
  },
  {
    id: 'ren1', icon: '🍜', title: '莲 · 拉面味',
    when: (c) => c.minor && c.grade >= 1 && c.grade <= 6 && c.loc === 'school' && c.hour >= 15 && c.known('ren') && c.daysSince('school_first') >= 5,
    scenes: [
      { who: '女生', text: '「莲身上好大一股拉面味……离他远一点啦。」' },
      { who: '旁白', text: '莲把校服外套脱了，塞进书包最底下。这是他第一次没有大声说话。' }
    ],
    choices: [
      { label: '放学去他家店里吃一碗，第二天跟全班说「超好吃」', tag: 'brave', cond: (c) => c.money >= 600, money: -600, courage: 10, aff: { ren: 15 }, effects: { hunger: 45, mood: 10 }, flags: { ren1: 'help' },
        then: [{ who: '莲的爸爸', text: '「你就是莲常说的那个朋友？这碗算叔叔的！」……他还是收了你 600 日元，说是「规矩」。' }] },
      { label: '「是有点味道……」', aff: { ren: -5 }, flags: { ren1: 'skip' },
        then: [{ who: '旁白', text: '莲愣了一下，笑着说「是吧」。那之后他每天都喷很多妈妈的香水来上学。' }] },
      { label: '🤪 站上讲台大喊「我最喜欢拉面味了！！」', tag: 'crazy', roll: () => 0.5,
        win: { title: 'ramen_king', aff: { ren: 12 }, flags: { ren1: 'help' }, effects: { mood: 12 },
          then: [{ who: '旁白', text: '不知道为什么，第二天全班都开始去莲家吃拉面。他家店门口第一次排起了队。' }] },
        lose: { aff: { ren: 10 }, flags: { ren1: 'help' }, courage: 8, effects: { mood: -8 },
          then: [{ who: '旁白', text: '你多了个外号叫「叉烧」。莲笑得最大声，但他把自己的叉烧全夹给了你。' }] } }
    ]
  },
  {
    id: 'haruka2', icon: '🖌️', title: '春香 · 只有一个人的美术社',
    when: (c) => c.minor && c.grade >= 7 && c.grade <= 9 && (c.loc === 'school' || c.loc === 'library') && c.hour >= 15 && c.aff('haruka') >= 30 && (c.done('haruka1') || c.startGrade > 6),
    scenes: [
      { who: '春香', text: '「美术社……只剩我一个人了。老师说，下个月再没人入社就解散。」' },
      { who: '春香', text: '「其实解散也没关系。反正我画得也不好。」她在笑，可是笑得很难看。' }
    ],
    choices: [
      { label: '「我入社。」', tag: 'brave', courage: 15, aff: { haruka: 15 }, skills: { cre: 3 }, flags: { haruka2: 'help', art_club: true },
        then: [{ who: '春香', text: '「……你明明不会画画。」她低下头，肩膀抖了好一会儿。「那、那我教你。」' }] },
      { label: '帮她在走廊贴招新海报', aff: { haruka: 8 }, skills: { cha: 1 }, flags: { haruka2: 'help' },
        then: [{ who: '旁白', text: '来了一个一年级的学妹。美术社活下来了，春香把你的名字写在了「名誉社员」一栏。' }] },
      { label: '「解散就解散吧，你可以自己画。」', aff: { haruka: -5 }, flags: { haruka2: 'skip' },
        then: [{ who: '春香', text: '「……嗯。说得也是。」那天美术室的灯很早就熄了。' }] }
    ]
  },
  {
    id: 'ren2', icon: '⚽', title: '莲 · 不想再端碗了',
    when: (c) => c.minor && c.grade >= 7 && c.grade <= 9 && c.loc === 'ramen' && c.hour >= 15 && c.aff('ren') >= 30 && (c.done('ren1') || c.startGrade > 6),
    scenes: [
      { who: '莲', text: '「足球部的教练说我有天赋，让我每天放学去训练。」' },
      { who: '莲', text: '「可是店里只有我爸一个人……他腰不好。我要是走了，谁帮他端碗？」' }
    ],
    choices: [
      { label: '「去踢球吧。叔叔那边，我陪你一起去说。」', tag: 'brave', courage: 15, aff: { ren: 12 }, flags: { ren2: 'soccer' },
        then: [{ who: '莲的爸爸', text: '沉默了很久，他把围裙从莲身上解下来：「去吧。别丢老子的脸。」' }] },
      { label: '「你家的店需要你。」', aff: { ren: 5 }, flags: { ren2: 'shop' },
        then: [{ who: '莲', text: '「……嗯。也是。」他把足球部的申请表折成了纸飞机，从店门口飞了出去。' }] },
      { label: '🫠 「随便啦，你开心就好」', tag: 'lazy', aff: { ren: -3 }, flags: { ren2: 'none' },
        then: [{ who: '莲', text: '「……你根本没在听吧。」' }] }
    ]
  }
]
