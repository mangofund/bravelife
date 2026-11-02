<template>
  <view class="hud">
    <view class="row between">
      <view class="row">
        <avatar-card :profile="state.profile" :size="76" />
        <view class="who">
          <text class="name">{{ state.profile.name }}<text v-if="state.election.governor" class="gov"> 🏛️都知事</text></text>
          <text class="job">{{ jobText }}</text>
        </view>
      </view>
      <view class="clock">
        <text class="time">{{ fmtHour(state.hour) }}</text>
        <text class="date">第 {{ state.day }} 天 · {{ weekday(state.day) }}</text>
      </view>
    </view>
    <view class="row between money-row">
      <text class="money" :class="{ neg: state.money < 0 }">{{ fmtMoney(state.money) }}</text>
      <text class="muted">📍{{ locName }} · 声望 {{ Math.round(state.rep) }}</text>
    </view>
    <view class="bars">
      <view v-for="b in bars" :key="b.key" class="bar">
        <text class="bar-label">{{ b.icon }}</text>
        <view class="track">
          <view class="fill" :style="{ width: b.value + '%', background: b.value < 25 ? 'var(--warn)' : b.color }" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import AvatarCard from '../avatar-card/avatar-card.vue'
import { state, fmtHour, fmtMoney, weekday } from '../../game/index.js'
import { CAREERS } from '../../game/data/jobs.js'
import { LOCATION_MAP } from '../../game/data/locations.js'

const jobText = computed(() => {
  if (!state.job) return '无业游民'
  const c = CAREERS[state.job.career]
  return c.icon + ' ' + c.levels[state.job.level].title
})
const locName = computed(() => LOCATION_MAP[state.location].name)
const bars = computed(() => [
  { key: 'hunger', icon: '🍙', color: '#f5a524', value: state.stats.hunger },
  { key: 'energy', icon: '⚡', color: '#3e9bff', value: state.stats.energy },
  { key: 'mood', icon: '😊', color: 'var(--accent2)', value: state.stats.mood },
  { key: 'health', icon: '❤️', color: 'var(--ok)', value: state.stats.health }
])
</script>

<style>
.hud {
  background: var(--hud);
  color: #fff;
  padding: 20rpx 24rpx 16rpx;
}
.who {
  display: flex;
  flex-direction: column;
  margin-left: 16rpx;
}
.name {
  font-weight: 700;
  font-size: 30rpx;
}
.gov {
  color: #ffd166;
  font-size: 22rpx;
}
.job {
  font-size: 22rpx;
  opacity: 0.75;
}
.clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.time {
  font-size: 40rpx;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.date {
  font-size: 22rpx;
  opacity: 0.75;
}
.money-row {
  margin: 12rpx 0 8rpx;
}
.money {
  font-size: 34rpx;
  font-weight: 800;
  color: #ffd166;
}
.money.neg {
  color: #ff7b7b;
}
.hud .muted {
  color: #c9c3d8;
}
.bars {
  display: flex;
  justify-content: space-between;
}
.bar {
  flex: 1;
  display: flex;
  align-items: center;
  margin-right: 12rpx;
}
.bar:last-child {
  margin-right: 0;
}
.bar-label {
  font-size: 22rpx;
  margin-right: 6rpx;
}
.track {
  flex: 1;
  height: 12rpx;
  border-radius: 6rpx;
  background: rgba(255, 255, 255, 0.15);
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 6rpx;
}
</style>
