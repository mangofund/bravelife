<template>
  <view class="hud" :class="{ compact }">
    <view class="row between">
      <view class="row hud-left">
        <avatar-card v-if="!compact" :profile="state.profile" :size="76" />
        <view class="who">
          <text class="name">{{ state.profile.name }}<text v-if="title" class="gov"> {{ title }}</text><text v-if="state.election.governor" class="gov"> 🏛️都知事</text></text>
          <text v-if="!compact" class="job">{{ jobText }}</text>
        </view>
      </view>
      <view class="clock">
        <text class="time">{{ fmtHour(state.hour) }}</text>
        <text v-if="!compact" class="date">{{ dateText }} {{ weekday(state.day) }} {{ weatherInfo().icon }}</text>
        <view class="speeds">
          <text
            v-for="v in SPEEDS"
            :key="v"
            class="speed"
            :class="{ on: settings.speed === v }"
            @click="setSpeed(v)"
          >{{ v === 0 ? '⏸' : v + '×' }}</text>
          <text class="speed skip" @click="onSkip">⏭ {{ skipsLeft() }}</text>
        </view>
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
import {
  state, fmtHour, fmtMoney, weekday, dateOf, weatherInfo, age, isMinor, schoolName, titleText, skipDay, skipReason, skipsLeft
} from '../../game/index.js'
import { CAREERS } from '../../game/data/jobs.js'
import { LOCATION_MAP } from '../../game/data/locations.js'
import { settings, SPEEDS, setSpeed } from '../../game/themes.js'

defineProps({ compact: Boolean })

const title = computed(() => titleText())
const dateText = computed(() => {
  const d = dateOf(state.day)
  return d.y + '/' + d.m + '/' + d.d
})
const jobText = computed(() => {
  if (isMinor()) return age() + ' 岁 · ' + schoolName() + (state.job ? ' · 打工中' : '')
  if (!state.job) return age() + ' 岁 · 无业游民'
  const c = CAREERS[state.job.career]
  return age() + ' 岁 · ' + c.icon + ' ' + c.levels[state.job.level].title
})
const locName = computed(() => LOCATION_MAP[state.location].name)

function onSkip() {
  const why = skipReason()
  if (why) {
    uni.showToast({ title: why, icon: 'none' })
    return
  }
  uni.showModal({
    title: '跳过今天？',
    content: '按平淡的一天结算到明早 7:00，这一天不会发生任何剧情和邀约。本月还能跳 ' + skipsLeft() + ' 次。',
    success(res) {
      if (res.confirm) skipDay()
    }
  })
}
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
.hud-left {
  flex: 1;
  min-width: 0;
}
.who {
  flex: 1;
  min-width: 140rpx;
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
  font-size: max(var(--readable-min, 0px), 22rpx);
}
.job {
  font-size: max(var(--readable-min, 0px), 22rpx);
  opacity: 0.75;
}
.clock {
  flex-shrink: 0;
  max-width: 60%;
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
  font-size: max(var(--readable-min, 0px), 22rpx);
  opacity: 0.75;
}
.speeds {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-top: 6rpx;
}
.speed {
  font-size: max(var(--readable-min, 0px), 20rpx);
  min-width: 44rpx;
  text-align: center;
  padding: 2rpx 8rpx;
  margin-left: 8rpx;
  border-radius: 999rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.4);
  opacity: 0.75;
}
.speed.skip {
  min-width: 56rpx;
}
.speed.on {
  background: #ffd166;
  color: #3a2f27;
  border-color: #ffd166;
  opacity: 1;
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
  font-size: max(var(--readable-min, 0px), 22rpx);
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
.hud.compact { padding: 7px 12px; }
.compact .who { margin-left: 0; min-width: 0; }
.compact .name { font-size: max(var(--readable-min, 0px), 13px); }
.compact .time { font-size: 20px; }
.compact .money { font-size: 17px; }
.compact .money-row { margin: 4px 0; }
.compact .speeds { margin-top: 3px; }
.compact .clock { flex-direction: row; align-items: center; gap: 5px; max-width: none; }
.compact .time { font-size: 18px; }
.compact .speeds { margin-top: 0; flex-wrap: nowrap; }
.compact .speed { min-width: 0; font-size: max(var(--readable-min, 0px), 9px); padding: 2px 4px; margin-left: 3px; }
.compact .speed.skip { display: none; }
.compact .money-row { margin: 2px 0; }
.compact .who .name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
@media (max-width: 959px) {
  .hud > .row:first-child { flex-wrap: wrap; gap: 6px; }
  .hud .clock, .hud.compact .clock { width: 100%; max-width: none; flex-basis: 100%; display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 4px; }
  .hud .clock .date { display: none; }
  .hud .speeds { display: flex; margin: 0; gap: 2px; flex-wrap: wrap; justify-content: flex-end; }
  .hud .speed, .hud.compact .speed { display: flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 0 3px; box-sizing: border-box; border-radius: 10px; font-size: 14px; }
  .hud .speed.skip { margin-left: 0; }
  .hud.compact .speed.skip { display: none; }
  .hud .time { flex-shrink: 0; }
  .hud .who { margin-left: 8px; }
  .hud .money-row { gap: 8px; flex-wrap: wrap; }
}
</style>
