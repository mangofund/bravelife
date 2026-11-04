<template>
  <view v-if="ev" class="ev-mask">
    <view class="ev-box">
      <text class="ev-icon">{{ ev.icon }}</text>
      <text class="ev-title">{{ ev.title }}</text>
      <text class="ev-text">{{ ev.text }}</text>
      <view v-for="(c, i) in ev.choices" :key="i" class="btn ev-btn" :data-preview-cost="Math.max(0, -(c.effects?.money || 0))" :class="{ ghost: i > 0 }" @click="actionAudio(() => resolveEvent(i))">{{ c.label }}</view>
    </view>
  </view>
</template>

<script setup>
import { actionAudio } from '../../game/action-audio.js'
import { computed } from 'vue'
import { state, eventById, resolveEvent } from '../../game/index.js'

const ev = computed(() => (state.pendingEvent ? eventById(state.pendingEvent) : null))
</script>

<style>
.ev-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 80;
  background: rgba(20, 18, 34, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ev-box {
  width: 600rpx;
  background: var(--card);
  border-radius: 32rpx;
  padding: 40rpx 36rpx 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ev-icon {
  font-size: 96rpx;
}
.ev-title {
  font-size: 36rpx;
  font-weight: 800;
  margin: 8rpx 0 12rpx;
}
.ev-text {
  color: var(--muted);
  text-align: center;
  margin-bottom: 28rpx;
}
.ev-btn {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 16rpx;
}
</style>
