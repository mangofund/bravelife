<template>
  <view v-if="step || goal || warns.length" class="guide" :class="{ compact }">
    <view v-for="w in compact ? warns.slice(0, 1) : warns" :key="w" class="warn">{{ w }}</view>
    <view v-if="step && (!compact || !warns.length)" class="tut">
      <text class="tut-text">📖 新手任务 {{ index }}/{{ total }}：{{ step.text }}</text>
      <text class="skip" @click="onSkip">跳过</text>
    </view>
    <view v-else-if="goal && (!compact || !warns.length)" class="tut">
      <text class="tut-text">⭐ {{ lifeStageName() }} {{ goalDone }}/{{ goals.length }}：{{ goal.text }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { state, tutorialStep, warnings, skipTutorial, save, TUTORIAL, currentGoals, lifeStageName } from '../../game/index.js'

defineProps({ compact: Boolean })

const step = computed(() => tutorialStep())
const index = computed(() => state.tutorial.step + 1)
const total = TUTORIAL.length
const warns = computed(() => warnings().slice(0, 2))
// 新手任务做完后，显示这个人生阶段下一个没完成的章节目标
const goals = computed(() => currentGoals())
const goal = computed(() => goals.value.filter((g) => !g.done)[0] || null)
const goalDone = computed(() => goals.value.filter((g) => g.done).length)

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
.guide.compact { padding-top: 4px; padding-bottom: 4px; }
.compact .tut-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.compact .tut { margin-top: 0; padding: 5px 8px; }
.compact .tut-text { font-size: 11px; }
.compact .warn { margin-top: 0; font-size: 11px; line-height: 1.4; padding: 5px 8px; }
</style>
