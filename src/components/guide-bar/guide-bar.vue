<template>
  <view v-if="step || warns.length" class="guide">
    <view v-for="w in warns" :key="w" class="warn">{{ w }}</view>
    <view v-if="step" class="tut">
      <text class="tut-text">📖 新手任务 {{ index }}/{{ total }}：{{ step.text }}</text>
      <text class="skip" @click="onSkip">跳过</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { state, tutorialStep, warnings, skipTutorial, save, TUTORIAL } from '../../game/index.js'

const step = computed(() => tutorialStep())
const index = computed(() => state.tutorial.step + 1)
const total = TUTORIAL.length
const warns = computed(() => warnings().slice(0, 2))

function onSkip() {
  uni.showModal({
    title: '跳过新手任务？',
    content: '跳过后不再显示，也拿不到剩余奖励。',
    success(res) {
      if (res.confirm) {
        skipTutorial()
        save()
      }
    }
  })
}
</script>

<style>
.guide {
  background: var(--hud);
  padding: 0 24rpx 12rpx;
}
.warn {
  background: var(--warn);
  color: #fff;
  font-size: 24rpx;
  border-radius: 12rpx;
  padding: 8rpx 16rpx;
  margin-top: 10rpx;
}
.tut {
  display: flex;
  align-items: center;
  background: #ffd166;
  color: var(--ink);
  border-radius: 12rpx;
  padding: 10rpx 16rpx;
  margin-top: 10rpx;
}
.tut-text {
  flex: 1;
  font-size: 24rpx;
  font-weight: 600;
}
.skip {
  font-size: 22rpx;
  margin-left: 12rpx;
  opacity: 0.7;
}
</style>
