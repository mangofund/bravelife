import { reactive } from 'vue'

// 界面层的临时状态（不进存档）：布局模式、地图上的走路请求
export const ui = reactive({
  walkRequest: null,
  nudge: null,
  nonce: 0,
  // 'mobile'：竖屏单栏；'wide'：电脑/平板横屏三栏
  layout: 'mobile',
  width: 375
})

// 宽于这个值（且是网页版）用三栏布局；iPad 横屏 1024 起也会进入宽屏
export const WIDE_MIN = 960

export function requestWalk(locId, mode) {
  ui.nonce += 1
  ui.walkRequest = { loc: locId, mode: mode || '', nonce: ui.nonce }
}

// 键盘方向键让主人公在地图上散步
export function requestNudge(dx, dy) {
  ui.nonce += 1
  ui.nudge = { dx, dy, nonce: ui.nonce }
}

function apply(width) {
  ui.width = width
  let wide = false
  // #ifdef H5
  wide = width >= WIDE_MIN
  // #endif
  ui.layout = wide ? 'wide' : 'mobile'
}

let listening = false

export function initLayout() {
  try {
    apply(uni.getSystemInfoSync().windowWidth)
  } catch (e) {
    apply(375)
  }
  if (listening) return
  listening = true
  // #ifdef H5
  window.addEventListener('resize', () => apply(window.innerWidth))
  // #endif
}
