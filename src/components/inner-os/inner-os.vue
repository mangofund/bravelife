<template>
  <view class="os-layer">
    <text v-for="o in ui.os" :key="o.id" class="os-line" :style="{ top: 18 + o.lane * 7 + '%' }">💭 {{ o.text }}</text>
  </view>
</template>

<script setup>
import { watch } from 'vue'
import { ui } from '../../game/ui.js'

// 每条弹幕飘 5 秒后移除
const LIFE_MS = 5000
const timers = {}
watch(
  () => ui.os.map((o) => o.id),
  (ids) => {
    ids.forEach((id) => {
      if (timers[id]) return
      timers[id] = setTimeout(() => {
        const i = ui.os.findIndex((o) => o.id === id)
        if (i >= 0) ui.os.splice(i, 1)
        delete timers[id]
      }, LIFE_MS)
    })
  },
  { immediate: true }
)
</script>

<style>
.os-layer {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 70;
  pointer-events: none;
  overflow: hidden;
}
.os-line {
  position: absolute;
  left: 100%;
  white-space: nowrap;
  padding: 8rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(42, 34, 28, 0.78);
  color: #fffaf0;
  font-size: 26rpx;
  font-weight: 600;
  animation: os-fly 5s linear forwards;
}
@keyframes os-fly {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100vw) translateX(-100%);
  }
}
</style>
