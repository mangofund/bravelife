// 勇气商店：商品、勇气课题、家族物品的故事、店主台词

// 每次开店从这里随机上架 3 件；kind：retry 第二次机会 / charm 护身符 / old 旧物（家具）
export const GOODS = [
  { id: 'retry', kind: 'retry', name: '第二次机会', icon: '🔁', price: 80, desc: '下一次告白失败时，时间会倒回去让你再试一次。每一代最多用 3 次。' },
  { id: 'charm_love', kind: 'charm', name: '恋爱御守', icon: '💗', price: 30, desc: '下一次告白成功率 +15%。' },
  { id: 'charm_mood', kind: 'charm', name: '晴天娃娃', icon: '🧸', price: 25, days: 7, desc: '7 天内心情不会低于 40。' },
  { id: 'charm_work', kind: 'charm', name: '招财猫', icon: '🐱', price: 40, days: 7, desc: '7 天内打工收入 +10%。' },
  { id: 'old_ticket', kind: 'old', name: '1964 年奥运门票', icon: '🎫', price: 15, story: '「那年整个东京都在看同一个跑道。有个人买了两张票，另一张一直没送出去。」' },
  { id: 'old_tape', kind: 'old', name: '没拆的磁带', icon: '📼', price: 12, story: '「录的是一首写给某人的歌。录完了，就再也没勇气拆开听。」' },
  { id: 'old_umbrella', kind: 'old', name: '一把别人的伞', icon: '☂️', price: 10, story: '「借伞的人说明天还。那个明天，过了三十年。」' },
  { id: 'old_postcard', kind: 'old', name: '没寄出的明信片', icon: '💌', price: 12, story: '「邮票都贴好了，只差丢进邮筒的那一步。」' },
  { id: 'old_camera', kind: 'old', name: '胶片相机', icon: '📷', price: 20, story: '「最后一张底片没有拍。主人说，要留给最重要的那一天。」' }
]

export const RETRY_MAX = 3
export const QUEST_REWARD = 30
// 集齐几枚书页解锁家族物品的一章
export const PAGES_PER_CHAPTER = 5
export const COURAGE_BURST = 100

// 勇气课题：metric 返回一个计数，接下课题后这个数变大就算完成
// stages：kid（小学）、teen（初中/高中）、adult（成年）
export const QUESTS = [
  { id: 'hello', stages: ['kid', 'teen', 'adult'], days: 7, text: '去跟一个你还不认识的人打招呼。', metric: (s) => Object.keys(s.social).length },
  { id: 'train', stages: ['kid', 'teen'], days: 14, text: '一个人坐电车，去一个从没去过的地方。', metric: (s) => Object.keys(s.visited).filter((k) => s.visited[k] === 'train').length },
  { id: 'shrine', stages: ['kid', 'teen', 'adult'], days: 7, text: '去神社，替别人许一个愿。', metric: (s) => s.counters['act:shrine:pray'] || 0 },
  { id: 'run', stages: ['kid', 'teen'], days: 7, text: '在公园跑完一次步，不许中途停下。', metric: (s) => s.counters['act:park:jog'] || 0 },
  { id: 'sing', stages: ['teen', 'adult'], days: 10, text: '去卡拉 OK，大声唱一首你不敢在别人面前唱的歌。', metric: (s) => s.counters['act:karaoke:sing'] || 0 },
  { id: 'playground', stages: ['kid'], days: 7, text: '放学后在操场上，和大家一起疯跑一次。', metric: (s) => s.counters['act:school:playground'] || 0 },
  { id: 'gift', stages: ['kid', 'teen', 'adult'], days: 14, text: '送一份礼物给一个你在乎的人。', metric: (s) => s.counters.gifts || 0 },
  { id: 'blood', stages: ['adult'], days: 14, text: '去医院献一次血。', metric: (s) => s.counters['act:hospital:blood'] || 0 },
  { id: 'apply', stages: ['adult'], days: 21, text: '去应聘一份你觉得自己「还不够格」的工作。', metric: (s) => s.counters.applies || 0 },
  { id: 'class', stages: ['adult'], days: 14, text: '报一门你一直觉得「太晚了」的课。', metric: (s) => s.counters.paidClasses || 0 },
  { id: 'treat', stages: ['adult'], days: 14, text: '在居酒屋请大家喝一杯。', metric: (s) => s.counters['act:izakaya:treat'] || 0 }
]

// 初代的家族物品：来自祖父母，分 5 章，最后一章总是那个人当年没有勇气做的事
export const HEIRLOOMS = {
  pen: {
    name: '祖父的钢笔', icon: '🖋️', bg: 'rich',
    chapters: [
      '笔帽上刻着一行小字：「给 1962 年的我」。这支笔签过很多份合同，墨水却总是新的。',
      '祖父年轻时在银座的画廊打杂。他用这支笔画过速写，画满了三本本子。',
      '后来他继承了曾祖父的公司。画本被锁进了书房最下面的抽屉，钥匙丢在了隅田川里。',
      '他签下第一份大合同的那天晚上，一个人在雨里走了很久，最后走进了一条没见过的小巷。',
      '店主说：「他那晚想问我，如果当年去画画，会不会更快乐。他最后没有问出口。」这件事，也许有一天你能替他问出答案。'
    ]
  },
  bento: {
    name: '母亲的饭盒', icon: '🍱', bg: 'normal',
    chapters: [
      '一个掉了漆的铝饭盒，盖子内侧贴着一张褪色的贴纸：一颗歪歪扭扭的星星。',
      '这是外婆用了二十年的饭盒。她每天四点起床，给全家做五份便当。',
      '星星是你妈妈小学时贴上去的。那天她在饭盒里留了一张纸条：「妈妈辛苦了」。',
      '外婆看到纸条，在厨房里站了很久。她一辈子没对女儿说过一句「我爱你」。',
      '店主说：「她想说的话，全都装在每天的饭里了。可是她一直遗憾，没有亲口说一次。」这件事，也许有一天你能替她说出来。'
    ]
  },
  ticket: {
    name: '写着「对不起」的旧车票', icon: '🎟️', bg: 'self',
    chapters: [
      '一张东北本线的旧车票，终点是上野。背面用铅笔写着：「对不起」。',
      '这是外公来东京打工那天的车票。他十七岁，口袋里只有这张票和三百日元。',
      '「对不起」是写给老家的一个女孩的。他答应过她，等他赚到钱就回去。',
      '他在东京待了一辈子，攒够钱的时候，已经不知道该怎么回去了。',
      '店主说：「他把这张票留了五十年，每年都想寄回去，每年都没有。」这件事，也许有一天你能替他完成。'
    ]
  }
}

export const BG_HEIRLOOM = { rich: 'pen', normal: 'bento', self: 'ticket' }

// 店主的问候：随机一句
export const KEEPER_LINES = [
  '雨停之前，这里是你的。',
  '你奶奶小时候也坐在这张椅子上。……还是你爷爷来着？我记不太清了。',
  '这家店开了很久了，久到我也忘了是谁开的。',
  '我不卖东西，我只是替人保管。',
  '害怕是正常的。害怕还去做，才叫勇气。',
  '夜又睡着了。它比我还老。',
  '今天也带着勇气来了啊。'
]
