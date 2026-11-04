<template>
  <view class="side">
    <view class="card">
      <block v-if="state.profile.wish">
        <text class="act-name">{{ wish.icon }} 人生愿望：{{ wish.name }}</text>
        <text class="muted block">{{ wish.desc }} · {{ state.wishDone ? '✅ 已达成' : '进行中' }}</text>
      </block>
      <text v-else class="act-name block">🌱 人生愿望：18 岁离开家时再决定</text>
      <text class="muted block">🔥 勇气 {{ state.courage.value }}</text>
      <text class="muted">净资产 {{ fmtMoney(netWorth()) }}</text>
    </view>
    <view v-if="invite" class="notice">📅 {{ invite }}</view>
    <view class="card">
      <view class="section-title">能力</view>
      <view v-for="k in skillKeys" :key="k" class="srow">
        <text class="sname">{{ SKILL_NAMES[k] }}</text>
        <view class="track strack"><view class="sfill" :style="{ width: state.skills[k] + '%' }" /></view>
        <text class="sval">{{ Math.round(state.skills[k]) }}</text>
      </view>
      <view class="srow">
        <text class="sname">声望</text>
        <view class="track strack"><view class="sfill rep" :style="{ width: state.rep + '%' }" /></view>
        <text class="sval">{{ Math.round(state.rep) }}</text>
      </view>
      <view class="srow">
        <text class="sname">整洁</text>
        <view class="track strack"><view class="sfill clean" :style="{ width: state.clean + '%' }" /></view>
        <text class="sval">{{ Math.round(state.clean) }}</text>
      </view>
    </view>
    <view class="card keys">
      <view class="section-title">⌨️ 快捷键</view>
      <text class="muted block">空格 暂停/继续 · 1 地图 · 2 家 · Esc 关闭面板</text>
      <text class="muted block">方向键 让主人公散步 · 滚轮 缩放地图 · 按住鼠标拖动地图</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { state, fmtMoney, netWorth, wishInfo } from '../../game/index.js'
import { SKILL_NAMES } from '../../game/data/profile.js'
import { NPC_MAP } from '../../game/data/npcs.js'
import { LOCATION_MAP } from '../../game/data/locations.js'

const skillKeys = Object.keys(SKILL_NAMES)
const wish = computed(() => wishInfo())
const invite = computed(() => {
  const inv = state.invite
  if (!inv || inv.done || inv.day !== state.day) return ''
  return NPC_MAP[inv.npc].name + ' 约你 ' + inv.from + ':00 - ' + inv.to + ':00 在' + LOCATION_MAP[inv.loc].name + '见面'
})
</script>

<style>
.side {
  padding: 20rpx;
}
.srow {
  display: flex;
  align-items: center;
  margin: 8rpx 0;
}
.sname {
  width: 80rpx;
  font-size: max(var(--readable-min, 0px), 24rpx);
}
.strack {
  flex: 1;
  height: 14rpx;
  border-radius: 8rpx;
  overflow: hidden;
}
.sfill {
  height: 100%;
  background: var(--accent);
}
.sfill.rep {
  background: var(--accent2);
}
.sfill.clean {
  background: var(--ok);
}
.sval {
  width: 60rpx;
  text-align: right;
  font-size: max(var(--readable-min, 0px), 24rpx);
}
</style>
