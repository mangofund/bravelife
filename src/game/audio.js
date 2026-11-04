// BraveLife 音效管理器（2026-11-03 定稿，未接线到各事件前不自动发声）
//
// 来源：Kenney Interface Sounds，CC0，商用免署名，见 docs/AUDIO-LICENSE.md。
// 映射：见 docs/AUDIO-MAPPING.md。每个事件一个主音，除 petFeed 外不跨系统复用。
// petFeed 与 plant 共用 garden/drop_003.mp3，是用户 2026-11-03 明确批准的唯一跨系统复用。
//
// 关键约束（不要绕过）：
// - 首声必须由用户手势触发。宠物叫声只在音频已解锁后播放。
// - 静音状态持久化：存在 bravelife_sound_muted_v1，不随每次进游戏重置。
// - error_006 进游戏时压低音量：ERROR_VOLUME = 0.5，其余短音默认 1.0。
// - 短音与环境循环走不同实例：短音用缓存的 InnerAudioContext，环境循环单独一路，带淡入淡出。
// - 路径说明：短音总量约 160 KB，用本地 /static/audio，不走插画那套 CDN 路线，
//   这样小程序里也能离线即时播放，且不超小程序包体限制；插画大才走 CDN。

const SOUND_BASE = '/static/audio'
const MUTE_KEY = 'bravelife_sound_muted_v1'
const ERROR_VOLUME = 0.5

// 事件 -> 文件。文件只写相对路径，拼 SOUND_BASE 使用。
export const SOUND_MAP = {
  // UI
  click: 'ui/select_008.mp3',
  openPanel: 'ui/maximize_008.mp3',
  closePanel: 'ui/minimize_006.mp3',
  toggle: 'ui/toggle_001.mp3',
  dialogue: 'ui/tick_001.mp3',
  question: 'ui/question_002.mp3',
  error: 'ui/error_006.mp3',
  confirm: 'ui/confirmation_001.mp3',
  taskComplete: 'ui/confirmation_002.mp3',
  // 菜园（抽象反馈，不是真实土声 / 水声）
  plant: 'garden/drop_003.mp3',
  dig: 'garden/scratch_003.mp3',
  harvest: 'garden/pluck_001.mp3',
  // 厨房 / 打工（抽象反馈，真实切菜 / 煎炒声后补）
  serve: 'kitchen/glass_001.mp3',
  // 关系 / 剧情
  courage: 'story/pluck_002.mp3',
  affection: 'story/confirmation_003.mp3',
  keyMoment: 'story/glass_004.mp3',
  // 宠物：喂食放入与播种共用 drop_003（用户批准的唯一跨系统复用）
  petFeed: 'garden/drop_003.mp3',
  catMeow: 'pets/meow.mp3',
  dogBark: 'pets/bark.mp3'
}

// 页签切换变体池：switch_002 为主，003-007 只在页签系统里轮换，不拆到别处。
export const TAB_SWITCH_VARIANTS = [
  'ui/switch_002.mp3',
  'ui/switch_003.mp3',
  'ui/switch_004.mp3',
  'ui/switch_005.mp3',
  'ui/switch_006.mp3',
  'ui/switch_007.mp3'
]

// 暂不配 UI 音、等真实录音的事件：调用 play() 会静默返回 false，不报错、不拿 UI 音冒充。
export const SOUND_TBD = [
  'water', 'chop', 'fry', 'purr',
  'train', 'rain', 'cicada', 'shrineBell', 'ambientHome', 'ambientCafe'
]

let muted = false
let unlocked = false
let tabIndex = 0
const cache = {}
let ambientCtx = null
let ambientTimer = null

try {
  muted = uni.getStorageSync(MUTE_KEY) === true
} catch (e) {
  muted = false
}

export function isMuted() {
  return muted
}

export function setMuted(value) {
  muted = !!value
  try {
    uni.setStorageSync(MUTE_KEY, muted)
  } catch (e) {
    // 存储失败只影响下次进游戏的静音记忆，不阻塞本次播放控制
  }
  if (muted) stopAmbient()
  return muted
}

export function toggleMuted() {
  return setMuted(!muted)
}

// 首次用户手势里调用一次：解锁并预加载短音。启动页、onLaunch 里不要调用。
export function unlock() {
  if (unlocked) return
  unlocked = true
  Object.keys(SOUND_MAP).forEach((key) => {
    try {
      getContext(SOUND_MAP[key], key === 'error' ? ERROR_VOLUME : 1.0)
    } catch (e) {}
  })
}

function getContext(file, volume) {
  if (cache[file]) return cache[file]
  const ctx = uni.createInnerAudioContext()
  ctx.src = SOUND_BASE + '/' + file
  ctx.volume = typeof volume === 'number' ? volume : 1.0
  // 短音不循环；环境循环用单独的 ambientCtx，不走这里
  ctx.loop = false
  cache[file] = ctx
  return ctx
}

function playFile(file, volume) {
  if (muted) return false
  // play() 本身就是用户操作里的调用，第一次调用即视为手势解锁
  if (!unlocked) unlock()
  try {
    const ctx = getContext(file, volume)
    try { ctx.seek(0) } catch (e) {}
    ctx.play()
    return true
  } catch (e) {
    return false
  }
}

export function play(event) {
  if (SOUND_TBD.indexOf(event) >= 0) return false
  const file = SOUND_MAP[event]
  if (!file) return false
  return playFile(file, event === 'error' ? ERROR_VOLUME : 1.0)
}

export function playPetCall(kind) {
  if (!unlocked) return false
  return play(kind === 'cat' ? 'catMeow' : 'dogBark')
}

export function playTabSwitch() {
  const file = TAB_SWITCH_VARIANTS[tabIndex % TAB_SWITCH_VARIANTS.length]
  tabIndex += 1
  return playFile(file, 1.0)
}

function fadeAmbient(target, done) {
  if (!ambientCtx) {
    if (done) done()
    return
  }
  if (ambientTimer) clearInterval(ambientTimer)
  const from = ambientCtx.volume || 0
  const steps = 10
  let i = 0
  ambientTimer = setInterval(() => {
    i += 1
    ambientCtx.volume = from + (target - from) * (i / steps)
    if (i >= steps) {
      clearInterval(ambientTimer)
      ambientTimer = null
      if (done) done()
    }
  }, 50)
}

export function playAmbient(file, volume) {
  if (muted) return false
  if (!unlocked) unlock()
  try {
    if (!ambientCtx) {
      ambientCtx = uni.createInnerAudioContext()
      ambientCtx.loop = true
    }
    ambientCtx.src = SOUND_BASE + '/' + file
    ambientCtx.volume = 0
    ambientCtx.play()
    fadeAmbient(typeof volume === 'number' ? volume : 0.3)
    return true
  } catch (e) {
    return false
  }
}

export function stopAmbient() {
  if (!ambientCtx) return
  fadeAmbient(0, () => {
    try { ambientCtx.pause() } catch (e) {}
  })
}
