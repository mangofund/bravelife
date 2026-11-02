import { reactive } from 'vue'

// 画风主题：样式变量在 App.vue 的 .theme-xxx 类里定义，插画放在 art/<主题>/ 下
export const THEMES = [
  { id: 'watercolor', name: '温暖水彩', icon: '🎨', desc: '米黄纸张、柔和淡彩、铅笔描边' },
  { id: 'crayon', name: '蜡笔童趣', icon: '🖍️', desc: '高饱和、粗线条、儿童绘本感' },
  { id: 'wafu', name: '和风淡彩', icon: '🏮', desc: '浮世绘配色、墨线轮廓、米白和纸' }
]

const SETTINGS_KEY = 'bravelife_settings_v1'
// 改名前的旧键，读取时兼容
const LEGACY_SETTINGS_KEY = 'tokyo_life_settings_v1'

// speed：实时时钟倍速，0 为暂停；1 表示现实 1 秒 = 游戏 1 分钟
export const SPEEDS = [0, 1, 2, 5]
export const settings = reactive({ theme: 'watercolor', speed: 1 })

export function loadSettings() {
  try {
    const raw = uni.getStorageSync(SETTINGS_KEY) || uni.getStorageSync(LEGACY_SETTINGS_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (data && THEMES.some((t) => t.id === data.theme)) settings.theme = data.theme
    if (data && SPEEDS.indexOf(data.speed) >= 0) settings.speed = data.speed
  } catch (e) {
    console.error('load settings failed', e)
  }
}

function persist() {
  try {
    uni.setStorageSync(SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('save settings failed', e)
  }
}

export function setTheme(id) {
  if (!THEMES.some((t) => t.id === id)) return
  settings.theme = id
  persist()
}

export function setSpeed(v) {
  if (SPEEDS.indexOf(v) < 0) return
  settings.speed = v
  persist()
}

// 插画地址：H5 打包在 static/h5/art（只进 H5 包）；小程序包体有 2MB 限制，从 CDN 加载
// 网页部署在 bravelife.app，小程序直接从网站加载同一份插画
export const CDN_ART_BASE = 'https://bravelife.app/static/h5/art'

// uni-app 会把以 /static 开头的路径换成部署目录下的真实地址
let base = '/static/h5/art'
// #ifdef MP
base = CDN_ART_BASE
// #endif

export function art(name) {
  return base + '/' + settings.theme + '/' + name + '.jpg'
}
