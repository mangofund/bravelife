<template>
  <view v-if="ready" class="game theme-root" :class="['theme-' + settings.theme, wide ? 'wide' : 'narrow']">
    <!-- 宽屏：左状态 / 中地图或家 / 右地点面板或手机 -->
    <block v-if="wide">
      <view class="col-left">
        <game-hud />
        <guide-bar />
        <scroll-view scroll-y class="col-scroll"><side-status /></scroll-view>
      </view>
      <view class="col-main">
        <view class="seg">
          <view v-for="t in WIDE_TABS" :key="t.id" class="seg-item" :class="{ on: tab === t.id }" @click="tab = t.id">{{ t.icon }} {{ t.name }}</view>
        </view>
        <view class="content">
          <city-map v-if="tab === 'map'" @open="onOpen" @arrive-home="tab = 'home'" />
          <scroll-view v-else scroll-y class="pane"><home-view wide /></scroll-view>
        </view>
      </view>
      <view class="col-right">
        <location-sheet v-if="sheet" docked :loc-id="sheet" @close="sheet = ''" @gohome="goHome" @go="onGo" />
        <scroll-view v-else scroll-y class="col-scroll"><phone-view /></scroll-view>
      </view>
    </block>

    <!-- 手机：竖屏单栏 + 底部标签 -->
    <block v-else>
      <view class="top">
        <game-hud />
        <guide-bar />
      </view>
      <view class="content">
        <city-map v-if="tab === 'map'" @open="onOpen" @arrive-home="tab = 'home'" />
        <scroll-view v-else scroll-y class="pane">
          <home-view v-if="tab === 'home'" />
          <phone-view v-if="tab === 'phone'" />
        </scroll-view>
      </view>
      <view class="tabs">
        <view v-for="t in TABS" :key="t.id" class="tab" :class="{ on: tab === t.id }" @click="tab = t.id">
          <text class="tab-icon">{{ t.icon }}</text>
          <text class="tab-name">{{ t.name }}</text>
          <text v-if="t.id === 'phone' && state.unread" class="tab-dot" />
        </view>
      </view>
      <location-sheet v-if="sheet" :loc-id="sheet" @close="sheet = ''" @gohome="goHome" @go="onGo" />
    </block>

    <event-modal />
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app'
import GameHud from '../../components/game-hud/game-hud.vue'
import GuideBar from '../../components/guide-bar/guide-bar.vue'
import CityMap from '../../components/city-map/city-map.vue'
import HomeView from '../../components/home-view/home-view.vue'
import PhoneView from '../../components/phone-view/phone-view.vue'
import LocationSheet from '../../components/location-sheet/location-sheet.vue'
import EventModal from '../../components/event-modal/event-modal.vue'
import SideStatus from '../../components/side-status/side-status.vue'
import { state, load, tickClock } from '../../game/index.js'
import { settings, setSpeed } from '../../game/themes.js'
import { ui, requestWalk, requestNudge } from '../../game/ui.js'
import { autoCloudSave } from '../../game/account.js'

const TABS = [
  { id: 'map', name: '地图', icon: '🗺️' },
  { id: 'home', name: '家', icon: '🏠' },
  { id: 'phone', name: '手机', icon: '📱' }
]
// 宽屏里手机固定在右栏，中间只切换地图和家
const WIDE_TABS = TABS.slice(0, 2)

const ready = ref(false)
const tab = ref('map')
const sheet = ref('')
const wide = computed(() => ui.layout === 'wide')

// 从手机布局切到宽屏时，中间栏不显示手机
watch(wide, (w) => {
  if (w && tab.value === 'phone') tab.value = 'map'
})

onLoad(() => {
  // 刷新页面或直接打开时从存档恢复
  if (!state.started && !load()) {
    uni.reLaunch({ url: '/pages/index/index' })
    return
  }
  ready.value = true
})

// 实时时钟：现实每秒走 settings.speed 分钟；弹出随机事件或切到后台时暂停
let clock = null
let seconds = 0
function startClock() {
  if (clock) return
  clock = setInterval(() => {
    // 登录后每 60 秒把进度同步到云端自动存档
    seconds += 1
    if (seconds % 60 === 0) autoCloudSave()
    if (!ready.value || !settings.speed || state.pendingEvent) return
    tickClock(settings.speed)
  }, 1000)
}
function stopClock() {
  if (clock) clearInterval(clock)
  clock = null
}

// 电脑键盘快捷键（只在网页版生效）
let lastSpeed = 1
function onKey(e) {
  const tag = e.target && e.target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (e.key === ' ') {
    e.preventDefault()
    if (settings.speed) {
      lastSpeed = settings.speed
      setSpeed(0)
    } else setSpeed(lastSpeed || 1)
  } else if (e.key === '1') tab.value = 'map'
  else if (e.key === '2') tab.value = 'home'
  else if (e.key === '3' && !wide.value) tab.value = 'phone'
  else if (e.key === 'Escape') sheet.value = ''
  else if (e.key.indexOf('Arrow') === 0 && tab.value === 'map') {
    e.preventDefault()
    const d = { ArrowUp: [0, -3], ArrowDown: [0, 3], ArrowLeft: [-4, 0], ArrowRight: [4, 0] }[e.key]
    if (d) requestNudge(d[0], d[1])
  }
}

onShow(() => {
  startClock()
  // #ifdef H5
  window.addEventListener('keydown', onKey)
  // #endif
})
function teardown() {
  stopClock()
  // #ifdef H5
  window.removeEventListener('keydown', onKey)
  // #endif
}
onHide(teardown)
onUnload(teardown)

function onOpen(id) {
  if (id === 'home' && state.location === 'home') {
    tab.value = 'home'
    return
  }
  sheet.value = id
}

function goHome() {
  sheet.value = ''
  tab.value = 'home'
}

// 地点面板点「前往」：关掉面板，切到地图，主人公走过去
function onGo(id, mode) {
  sheet.value = ''
  tab.value = 'map'
  // 等地图组件挂载后再发走路请求
  setTimeout(() => requestWalk(id, mode), 50)
}
</script>

<style>
.game {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.top {
  flex-shrink: 0;
  z-index: 20;
}
.content {
  flex: 1;
  height: 0;
  position: relative;
  z-index: 1;
}
.pane {
  height: 100%;
}
.tabs {
  flex-shrink: 0;
  z-index: 30;
  display: flex;
  background: var(--card);
  border-top: var(--bw) solid var(--line);
  padding-bottom: env(safe-area-inset-bottom);
}
.tab {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx 0 10rpx;
  color: var(--muted);
}
.tab.on {
  color: var(--accent);
}
.tab.on .tab-icon {
  transform: rotate(-6deg) scale(1.12);
}
.tab-icon {
  font-size: 44rpx;
}
.tab-name {
  font-size: 22rpx;
  font-weight: 700;
  font-family: var(--title-font);
}
.tab-dot {
  position: absolute;
  top: 12rpx;
  right: 38%;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--warn);
}
.narrow {
  max-width: 480px;
  margin: 0 auto;
}

/* ---------- 宽屏：地图铺满全屏，左右栏浮在地图上 ---------- */
.game.wide {
  position: relative;
}
.col-main {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
}
.col-main .content {
  flex: 1;
  height: 100%;
}
.col-left,
.col-right {
  position: absolute;
  top: 16px;
  bottom: 16px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--paper);
  border: var(--bw) solid var(--line);
  border-radius: 22px 16px 24px 18px / 18px 24px 16px 22px;
  box-shadow: var(--shadow), 0 10px 30px rgba(40, 30, 20, 0.18);
}
.col-left {
  left: 16px;
  width: 330px;
}
.col-right {
  right: 16px;
  width: 390px;
}
.col-scroll {
  flex: 1;
  height: 0;
}
.col-right .col-scroll {
  height: 100%;
}
/* 地图/家切换浮在中间上方 */
.seg {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 41;
  display: flex;
  padding: 6px;
  background: var(--paper);
  border: var(--bw) solid var(--line);
  border-radius: 999px;
  box-shadow: var(--shadow);
}
.seg-item {
  padding: 6px 18px;
  margin: 0 3px;
  border-radius: 999px;
  font-family: var(--title-font);
  font-weight: 700;
  font-size: 15px;
}
.seg-item.on {
  background: var(--accent);
  color: #fff;
}
/* 家的页面在两侧浮层之间显示 */
.game.wide .pane {
  box-sizing: border-box;
  padding: 72px 422px 16px 362px;
}
</style>
