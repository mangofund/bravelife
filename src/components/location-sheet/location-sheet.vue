<template>
  <view class="mask" @click="emit('close')">
    <view class="sheet" @click.stop="noop">
      <view class="head">
        <text class="h-icon">{{ loc.icon }}</text>
        <view class="h-text">
          <text class="h-name">{{ loc.name }}</text>
          <text class="muted">{{ openText(loc) }} · {{ open ? '营业中' : '休息中' }}</text>
        </view>
        <text class="close" @click="emit('close')">✕</text>
      </view>
      <scroll-view scroll-y class="body">
        <text class="desc">{{ loc.desc }}</text>

        <view v-if="loc.soon" class="notice">这里还在建设中，敬请期待。</view>

        <view v-else-if="!here">
          <view class="btn" @click="onTravel">前往 · {{ fmtHours(cost.hours) }} · {{ fmtMoney(cost.cost) }}</view>
          <text v-if="state.money < cost.cost" class="muted">钱不够坐电车，会走路过去（耗时 ×3）。</text>
        </view>

        <view v-else>
          <view v-if="loc.id === 'home'" class="btn dark" @click="emit('gohome')">进入我的家</view>
          <view v-if="!open" class="notice">现在不营业，可以先在附近等一等。</view>

          <block v-if="open">
            <view v-if="loc.actions.length" class="section-title">行动</view>
            <view v-for="a in loc.actions" :key="a.id" class="act" @click="onAction(a.id)">
              <text class="act-icon">{{ a.icon }}</text>
              <view class="act-main">
                <text class="act-name">{{ a.name }}<text v-if="a.daily" class="muted">（每天一次）</text></text>
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
                <text class="price">¥200</text>
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
            <election-panel v-if="loc.special === 'election'" />
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
import {
  state, isOpen, openText, fmtMoney, fmtHours, describe, travelCost, doAction, omikuji, buyItem, wait
} from '../../game/index.js'
import { LOCATION_MAP } from '../../game/data/locations.js'
import { ITEMS } from '../../game/data/world.js'

const props = defineProps({ locId: { type: String, required: true } })
const emit = defineEmits(['close', 'gohome', 'go'])

const loc = computed(() => LOCATION_MAP[props.locId])
const here = computed(() => state.location === props.locId)
const open = computed(() => isOpen(loc.value, state.hour))
const cost = computed(() => travelCost(props.locId))

function noop() {}

function onTravel() {
  emit('go', props.locId)
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
.wait {
  margin: 24rpx 0 40rpx;
}
</style>
