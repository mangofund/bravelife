<template>
  <view v-if="ready" class="game theme-root" :class="['theme-' + settings.theme, wide ? 'wide' : 'narrow']">
    <!-- 宽屏端游 HUD：全屏场景 + 左状态栏 + 右工具栏 + 底部快捷栏 -->
    <block v-if="wide">
      <view class="scene-layer">
        <city-map v-if="tab === 'map'" @open="onOpen" @arrive-home="tab = 'home'" />
        <scroll-view v-else scroll-y class="scene-scroll"><home-view wide /></scroll-view>
      </view>

      <view class="left-rail">
        <view class="rail-handle">PLAYER</view>
        <view class="left-rail-scroll">
          <game-hud />
          <guide-bar />
          <side-status />
        </view>
      </view>

      <view class="right-rail">
        <view class="rail-handle">ACTIONS</view>
        <view class="rail-actions">
          <view class="rail-action" :class="{ on: rightPanel === 'phone' }" @click="openPhone('msg')">
            <text class="rail-icon">📱</text><text>手机</text>
            <text v-if="state.unread" class="rail-badge">{{ state.unread }}</text>
          </view>
          <view class="rail-action" :class="{ on: rightPanel === 'bag' }" @click="openPhone('bag')">
            <text class="rail-icon">🎒</text><text>背包</text>
          </view>
          <view class="rail-action" :class="{ on: rightPanel === 'contacts' }" @click="openPhone('contacts')">
            <text class="rail-icon">👥</text><text>关系</text>
          </view>
          <view class="rail-action" @click="focusCurrentLocation">
            <text class="rail-icon">📍</text><text>当前位置</text>
          </view>
        </view>
        <view v-if="rightPanel === 'phone'" class="right-drawer">
          <view class="drawer-head">
            <text>手机</text>
            <text class="drawer-close" @click="rightPanel = ''">✕</text>
          </view>
          <scroll-view scroll-y class="drawer-scroll"><phone-view :initial-app="phoneApp" /></scroll-view>
        </view>
      </view>

      <view class="bottom-toolbar">
        <view class="bottom-group">
          <view v-for="t in WIDE_TABS" :key="t.id" class="bottom-action" :class="{ on: tab === t.id }" @click="tab = t.id">
            <text class="bottom-icon">{{ t.icon }}</text><text>{{ t.name }}</text>
          </view>
        </view>
        <view class="bottom-divider" />
        <view class="bottom-group">
          <view class="bottom-action" :class="{ on: settings.speed === 0 }" @click="togglePause">
            <text class="bottom-icon">{{ settings.speed === 0 ? '▶' : '⏸' }}</text><text>{{ settings.speed === 0 ? '继续' : '暂停' }}</text>
          </view>
          <view v-for="v in [1, 2, 3]" :key="v" class="speed-action" :class="{ on: settings.speed === v }" @click="setSpeed(v)">{{ v }}×</view>
        </view>
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

    <location-sheet
      v-if="sheet && wide"
      fullscreen
      :loc-id="sheet"
      @close="sheet = ''"
      @gohome="goHome"
      @go="onGo"
    />
    <event-modal />
    <story-modal />
    <inner-os />
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
import StoryModal from '../../components/story-modal/story-modal.vue'
import InnerOs from '../../components/inner-os/inner-os.vue'
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
const rightPanel = ref('')
const phoneApp = ref('msg')
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

// 实时时钟：现实每秒走 settings.speed 分钟；弹出随机事件、播放剧情或切到后台时暂停
let clock = null
let seconds = 0
function startClock() {
  if (clock) return
  clock = setInterval(() => {
    // 登录后每 60 秒把进度同步到云端自动存档
    seconds += 1
    if (seconds % 60 === 0) autoCloudSave()
    if (!ready.value || !settings.speed || state.pendingEvent || state.pendingStory || ui.reading) return
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
  rightPanel.value = ''
}

function openPhone(app) {
  const sameApp = rightPanel.value === 'phone' && phoneApp.value === app
  phoneApp.value = app
  rightPanel.value = sameApp ? '' : 'phone'
}

function focusCurrentLocation() {
  tab.value = 'map'
  rightPanel.value = ''
  requestNudge(0, 0)
}

function togglePause() {
  if (settings.speed) {
    lastSpeed = settings.speed
    setSpeed(0)
  } else setSpeed(lastSpeed || 1)
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

/* ---------- 宽屏端游 HUD：场景铺满全屏，工具栏锚定在视口边缘 ---------- */
.game.wide {
  position: relative;
}
.scene-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;
}
.scene-scroll {
  width: 100%;
  height: 100%;
}
.left-rail,
.right-rail {
  position: absolute;
  top: 18px;
  bottom: 94px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  width: 286px;
  overflow: visible;
  pointer-events: none;
}
.left-rail {
  left: 18px;
}
.right-rail {
  right: 18px;
  align-items: flex-end;
}
.left-rail-scroll,
.rail-actions,
.right-drawer {
  pointer-events: auto;
}
.left-rail-scroll {
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
  border-radius: 20px;
  background: rgba(42, 34, 28, 0.86);
  border: var(--bw) solid rgba(255, 250, 240, 0.5);
  box-shadow: 0 12px 36px rgba(20, 14, 10, 0.28);
  backdrop-filter: blur(8px);
}
.rail-handle {
  align-self: flex-start;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--hud);
  color: #ffd166;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  box-shadow: var(--shadow);
}
.right-rail .rail-handle {
  align-self: flex-end;
}
.rail-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 82px;
  margin-top: 12px;
  padding: 8px;
  border-radius: 18px;
  background: rgba(42, 34, 28, 0.86);
  border: var(--bw) solid rgba(255, 250, 240, 0.5);
  box-shadow: 0 12px 36px rgba(20, 14, 10, 0.28);
  backdrop-filter: blur(8px);
}
.rail-action {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 4px;
  border-radius: 12px;
  color: #fffaf0;
  font-size: 12px;
  cursor: pointer;
}
.rail-action:hover,
.rail-action.on {
  background: var(--accent);
}
.rail-icon {
  font-size: 24px;
}
.rail-badge {
  position: absolute;
  top: 4px;
  right: 7px;
  min-width: 16px;
  padding: 1px 4px;
  border-radius: 999px;
  background: var(--warn);
  color: #fff;
  font-size: 10px;
  text-align: center;
}
.right-drawer {
  position: absolute;
  top: 112px;
  right: 0;
  bottom: 0;
  width: 360px;
  overflow: hidden;
  border-radius: 20px;
  background: var(--paper);
  border: var(--bw) solid var(--line);
  box-shadow: 0 12px 36px rgba(20, 14, 10, 0.32);
}
.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--hud);
  color: #fff;
  font-weight: 800;
}
.drawer-close {
  padding: 4px 8px;
  cursor: pointer;
}
.drawer-scroll {
  height: calc(100% - 52px);
}
.bottom-toolbar {
  position: absolute;
  left: 50%;
  bottom: 18px;
  z-index: 45;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 18px;
  background: rgba(42, 34, 28, 0.9);
  border: var(--bw) solid rgba(255, 250, 240, 0.5);
  box-shadow: 0 12px 36px rgba(20, 14, 10, 0.3);
  backdrop-filter: blur(8px);
  color: #fffaf0;
}
.bottom-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bottom-action,
.speed-action {
  min-width: 56px;
  padding: 8px 10px;
  border-radius: 12px;
  text-align: center;
  font-size: 12px;
  cursor: pointer;
}
.bottom-action:hover,
.bottom-action.on,
.speed-action:hover,
.speed-action.on {
  background: var(--accent);
  color: #fff;
}
.bottom-action {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bottom-icon {
  font-size: 20px;
}
.bottom-divider {
  width: 1px;
  height: 28px;
  background: rgba(255, 250, 240, 0.35);
}
.game.wide .left-rail .hud {
  margin: -12px -12px 0;
  border-radius: 18px 18px 0 0;
}
.game.wide .left-rail .hud > .row.between {
  align-items: flex-start;
}
.game.wide .left-rail .hud .clock {
  align-items: flex-end;
}
.game.wide .left-rail .hud .bars {
  flex-direction: column;
}
.game.wide .left-rail .hud .bar {
  margin: 4px 0;
}
.game.wide .left-rail .guide {
  margin: 0 -12px;
  padding-left: 12px;
  padding-right: 12px;
}
.game.wide .left-rail .side {
  padding: 12px 0 0;
}
.game.wide .left-rail .side .card,
.game.wide .left-rail .side .notice {
  margin-bottom: 10px;
}
.game.wide .left-rail .keys {
  display: none;
}
.game.wide .home.wide {
  min-height: 100%;
  box-sizing: border-box;
  padding: 24px;
}
</style>
