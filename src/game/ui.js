import { reactive } from 'vue'

// 界面层的临时状态（不进存档）：地图上的走路请求
export const ui = reactive({
  walkRequest: null,
  nonce: 0
})

export function requestWalk(locId) {
  ui.nonce += 1
  ui.walkRequest = { loc: locId, nonce: ui.nonce }
}
