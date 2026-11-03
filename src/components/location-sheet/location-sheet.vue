<template>
  <view :class="fullscreen ? 'fullscreen-mask' : docked ? 'dock' : 'mask'" @click="onMask">
    <view class="sheet" :class="{ docked, fullscreen }" @click.stop="noop">
      <view class="head">
        <text class="h-icon">{{ loc.icon }}</text>
        <view class="h-text">
          <text class="h-name">{{ loc.name }}</text>
          <text class="muted">{{ openText(loc) }} · {{ open ? '营业中' : '休息中' }}</text>
        </view>
        <button class="close" @click="emit('close')">{{ docked ? '返回地图' : '✕' }}</button>
      </view>
      <scroll-view scroll-y class="body">
        <text class="desc">{{ loc.desc }}</text>

        <view v-if="loc.soon" class="notice">这里还在建设中，敬请期待。</view>

        <view v-else-if="!here">
          <view class="section-title">怎么去？<text class="muted">约 {{ options[0].km }} 公里</text></view>
          <view
            v-for="o in options"
            :key="o.id"
            class="act mode"
            :class="{ disabled: !o.ok }"
            @click="onTravel(o)"
          >
            <text class="act-icon">{{ o.icon }}</text>
            <view class="act-main">
              <text class="act-name">{{ o.name }} · {{ fmtHours(o.hours) }}<text class="muted">（{{ arrive(o.hours) }} 到）</text></text>
              <text class="muted">{{ o.reason || o.warn || o.desc }}</text>
            </view>
            <text class="price">{{ o.cost ? fmtMoney(o.cost) : '免费' }}</text>
          </view>
        </view>

        <view v-else>
          <view v-if="loc.id === 'home'" class="btn dark" @click="emit('gohome')">进入我的家</view>
          <view v-if="!open" class="notice">现在不营业，可以先在附近等一等。</view>

          <block v-if="open">
            <view v-if="loc.actions.length" class="section-title">行动</view>
            <view v-for="a in loc.actions" :key="a.id" class="act" @click="onAction(a.id)">
              <text class="act-icon">{{ a.icon }}</text>
              <view class="act-main">
                <text class="act-name">{{ a.name }}<text v-if="a.paid" class="tag-sm">付费 · 成长快</text><text v-if="a.daily" class="muted">（每天一次）</text></text>
                <text class="muted">{{ fmtHours(a.hours) }} · {{ describe(a.effects, a.skills, a.rep) }}</text>
              </view>
              <text class="price">{{ a.cost ? fmtMoney(a.cost) : '免费' }}</text>
            </view>

            <block v-if="loc.special === 'omikuji'">
              <view class="act" @click="omikuji">
                <text class="act-icon">🎴</text>
                <view class="act-main">
                  <text class="act-name">抽签<text class="muted">（每天一次）</text></text>
                  <text class="muted">看看今天的运势</text>
                </view>
                <text class="price">{{ fmtMoney(200) }}</text>
              </view>
            </block>

            <block v-if="loc.shop">
              <view class="section-title">买回家（放进背包）</view>
              <view class="shop">
                <view v-for="id in loc.shop" :key="id" class="good" @click="buyItem(loc.id, id)">
                  <text class="good-icon">{{ ITEMS[id].icon }}</text>
                  <text class="good-name">{{ ITEMS[id].name }}</text>
                  <text class="price">{{ fmtMoney(ITEMS[id].price) }}</text>
                  <text class="muted">有 {{ state.bag[id] || 0 }}</text>
                </view>
              </view>
            </block>

            <people-panel :loc-id="loc.id" />
            <job-panel v-if="loc.career" :career-id="loc.career" />
            <furniture-shop v-if="loc.special === 'furniture'" />
            <estate-panel v-if="loc.special === 'estate'" />
            <vehicle-panel v-if="loc.id === 'ginza'" />
            <election-panel v-if="loc.special === 'election'" />
            <courage-panel v-if="loc.special === 'courage'" />
          </block>

          <view class="btn ghost wait" @click="wait(1)">在附近消磨 1 小时</view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import JobPanel from './job-panel.vue'
import PeoplePanel from './people-panel.vue'
import FurnitureShop from './furniture-shop.vue'
import EstatePanel from './estate-panel.vue'
import ElectionPanel from './election-panel.vue'
import VehiclePanel from './vehicle-panel.vue'
import CouragePanel from './courage-panel.vue'
import {
  state, isOpen, openText, fmtMoney, fmtHours, fmtHour, describe, travelOptions, doAction, omikuji, buyItem, wait
} from '../../game/index.js'
import { LOCATION_MAP } from '../../game/data/locations.js'
import { ITEMS } from '../../game/data/world.js'

const props = defineProps({
  locId: { type: String, required: true },
  // 宽屏时固定在右栏显示，不弹出遮罩
  docked: { type: Boolean, default: false },
  // 网页宽屏地点详情：覆盖地图、任务和两侧布局
  fullscreen: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'gohome', 'go'])

const loc = computed(() => LOCATION_MAP[props.locId])
const here = computed(() => state.location === props.locId)
const open = computed(() => isOpen(loc.value, state.hour))
const options = computed(() => (here.value || loc.value.soon ? [] : travelOptions(props.locId)))

function arrive(hours) {
  return fmtHour((state.hour + hours) % 24)
}

function noop() {}

function onMask() {
  if (!props.docked || props.fullscreen) emit('close')
}

function onTravel(o) {
  if (!o.ok) {
    uni.showToast({ title: o.name + '：' + o.reason, icon: 'none' })
    return
  }
  emit('go', props.locId, o.id)
}

function onAction(id) {
  doAction(props.locId, id)
}
</script>

<style>
.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(20, 18, 34, 0.5);
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.fullscreen-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  background: rgba(20, 18, 34, 0.58);
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}
.sheet {
  width: 100%;
  max-width: 750rpx;
  background: var(--paper);
  border-radius: 32rpx 32rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}
.head {
  display: flex;
  align-items: center;
  padding: 28rpx 28rpx 12rpx;
}
.h-icon {
  font-size: 64rpx;
  margin-right: 16rpx;
}
.h-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.h-name {
  font-size: 36rpx;
  font-weight: 800;
}
.close {
  font-size: 36rpx;
  padding: 12rpx;
  color: var(--muted);
}
.dock {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.sheet.docked {
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  max-width: none;
}
.sheet.docked .body {
  flex: 1;
  height: 0;
}
.sheet.fullscreen {
  width: 100%;
  max-width: none;
  height: 100vh;
  border-radius: 0;
  padding-bottom: env(safe-area-inset-bottom);
  display: flex;
  flex-direction: column;
}
.sheet.fullscreen .head {
  flex-shrink: 0;
  padding-left: 48rpx;
  padding-right: 48rpx;
}
.sheet.fullscreen .body {
  flex: 1;
  height: 0;
  padding-left: 48rpx;
  padding-right: 48rpx;
}
.body {
  height: 66vh;
  padding: 0 28rpx;
  box-sizing: border-box;
}
.desc {
  display: block;
  margin-bottom: 20rpx;
  color: var(--muted);
}
.shop {
  display: flex;
  flex-wrap: wrap;
}
.good {
  width: 31%;
  margin: 0 2% 16rpx 0;
  background: var(--card);
  border-radius: 20rpx;
  padding: 16rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.good-icon {
  font-size: 48rpx;
}
.good-name {
  font-weight: 600;
  font-size: 24rpx;
}
.mode.disabled {
  opacity: 0.45;
}
.wait {
  margin: 24rpx 0 40rpx;
}
.sheet.docked .head { padding-top: 12px; flex-shrink: 0; }
.sheet.docked .close { font-size: 12px; line-height: 1.5; padding: 7px 10px; margin: 0; color: var(--ink); background: var(--card); border-radius: 12px; }
</style>
