<template>
  <view v-if="view || after" class="st-mask">
    <view class="st-box">
      <view class="st-head">
        <text class="st-icon">{{ head.icon }}</text>
        <text class="st-title">{{ head.title }}</text>
      </view>

      <view v-if="scene" class="st-scene" @click="nextScene">
        <text v-if="scene.who && scene.who !== '旁白'" class="st-who">{{ scene.who }}</text>
        <text class="st-text" :class="{ narr: !scene.who || scene.who === '旁白' }">{{ scene.text }}</text>
        <text class="st-more">{{ more ? '点击继续 ▶' : '' }}</text>
      </view>

      <block v-if="!more">
        <block v-if="!after">
          <view v-for="(c, i) in view.choices" :key="i" class="btn st-btn" :class="tagClass(c.tag)" @click="pick(i)">
            <text v-if="c.tag" class="st-tag">{{ c.tag }}</text>{{ c.label }}
          </view>
        </block>
        <block v-else>
          <text v-if="after.msg" class="st-result">{{ after.msg }}</text>
          <view class="btn st-btn" @click="close">好</view>
        </block>
      </block>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { state, storyView, chooseStory, doneReading } from '../../game/index.js'
import { play } from '../../game/audio.js'
import { actionAudio } from '../../game/action-audio.js'
import { ui } from '../../game/ui.js'

const index = ref(0)
const after = ref(null)
// 剧情弹出时先把内容固定下来，避免播放途中条件变化
const view = ref(null)
const head = ref({ icon: '', title: '' })

watch(
  () => state.pendingStory,
  (id) => {
    if (!id || after.value) return
    view.value = storyView()
    if (!view.value) return
    head.value = { icon: view.value.icon, title: view.value.title }
    index.value = 0
    ui.reading = true
  },
  { immediate: true }
)

const scenes = computed(() => (after.value ? after.value.scenes : view.value ? view.value.scenes : []))
const scene = computed(() => scenes.value[index.value] || null)
const more = computed(() => index.value < scenes.value.length - 1)

function nextScene() {
  if (more.value) { index.value += 1; play('dialogue') }
}

function pick(i) {
  const r = actionAudio(() => chooseStory(i), 'dialogue')
  view.value = null
  after.value = r
  index.value = 0
}

function close() {
  play('closePanel')
  after.value = null
  view.value = null
  doneReading()
  // 下一段剧情已经挂起时，watch 不会再触发，这里补一次
  if (state.pendingStory && !view.value) {
    view.value = storyView()
    if (view.value) {
      head.value = { icon: view.value.icon, title: view.value.title }
      index.value = 0
      ui.reading = true
    }
  }
}

function tagClass(tag) {
  return { brave: tag === '勇敢', wild: tag === '发疯' || tag === '整活', lazy: tag === '摆烂', ghost: !tag }
}
</script>

<style>
.st-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 85;
  background: rgba(20, 18, 34, 0.66);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.st-box {
  width: 100%;
  max-width: 720px;
  box-sizing: border-box;
  background: var(--card);
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx 32rpx calc(28rpx + env(safe-area-inset-bottom));
}
.st-head {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}
.st-icon {
  font-size: 56rpx;
  margin-right: 16rpx;
}
.st-title {
  font-size: 34rpx;
  font-weight: 800;
  font-family: var(--title-font);
}
.st-scene {
  min-height: 180rpx;
  background: var(--paper);
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
}
.st-who {
  font-weight: 800;
  color: var(--accent);
  margin-bottom: 8rpx;
}
.st-text {
  line-height: 1.7;
}
.st-text.narr {
  color: var(--muted);
}
.st-more {
  align-self: flex-end;
  font-size: 22rpx;
  color: var(--muted);
  margin-top: 8rpx;
}
.st-btn {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 14rpx;
  text-align: left;
}
.st-btn.brave {
  background: #e8603c;
}
.st-btn.wild {
  background: #8a4fd8;
}
.st-btn.lazy {
  background: #6f8fa8;
}
.st-tag {
  font-size: 20rpx;
  padding: 2rpx 10rpx;
  margin-right: 10rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.25);
}
.st-result {
  display: block;
  color: var(--accent);
  font-weight: 700;
  margin-bottom: 16rpx;
}
</style>
