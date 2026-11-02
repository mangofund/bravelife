<template>
  <view v-if="ready" class="game theme-root" :class="'theme-' + settings.theme">
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
    <event-modal />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import GameHud from '../../components/game-hud/game-hud.vue'
import GuideBar from '../../components/guide-bar/guide-bar.vue'
import CityMap from '../../components/city-map/city-map.vue'
import HomeView from '../../components/home-view/home-view.vue'
import PhoneView from '../../components/phone-view/phone-view.vue'
import LocationSheet from '../../components/location-sheet/location-sheet.vue'
import EventModal from '../../components/event-modal/event-modal.vue'
import { state, load } from '../../game/index.js'
import { settings } from '../../game/themes.js'
import { requestWalk } from '../../game/ui.js'

const TABS = [
  { id: 'map', name: '地图', icon: '🗺️' },
  { id: 'home', name: '家', icon: '🏠' },
  { id: 'phone', name: '手机', icon: '📱' }
]

const ready = ref(false)
const tab = ref('map')
const sheet = ref('')

onLoad(() => {
  // 刷新页面或直接打开时从存档恢复
  if (!state.started && !load()) {
    uni.reLaunch({ url: '/pages/index/index' })
    return
  }
  ready.value = true
})

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
function onGo(id) {
  sheet.value = ''
  tab.value = 'map'
  // 等地图组件挂载后再发走路请求
  setTimeout(() => requestWalk(id), 50)
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
</style>
