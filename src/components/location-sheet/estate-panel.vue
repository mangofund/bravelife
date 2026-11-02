<template>
  <view class="panel">
    <view class="section-title">🏠 租房 / 买房</view>
    <view v-for="h in homes" :key="h.id" class="act" @click="onMove(h)">
      <text class="act-icon">{{ h.icon }}</text>
      <view class="act-main">
        <text class="act-name">{{ h.name }}<text v-if="h.current" class="tag-sm">当前</text></text>
        <text class="muted">{{ h.cols }}×{{ h.rows }} 格 · {{ h.price ? '买断，不再交房租' : '每周房租 ' + fmtMoney(h.rent) + '，搬家押金一周' }}</text>
      </view>
      <text class="price">{{ fmtMoney(h.price || h.rent) }}</text>
    </view>

    <view class="section-title">🌊 湾岸地块 · 已拥有 {{ ownedCount }} / {{ PLOTS.length }}</view>
    <text class="muted block">买地后可盖公寓楼（{{ fmtMoney(BUILD_COST) }}），每栋每天收租 {{ fmtMoney(BUILD_INCOME) }}。</text>
    <view class="plots">
      <view v-for="p in plots" :key="p.id" class="plot" :class="{ own: p.own, built: p.built }" @click="onPlot(p)">
        <text class="plot-icon">{{ p.built ? '🏘️' : p.own ? '🚧' : '🟦' }}</text>
        <text class="plot-id">{{ p.id }}</text>
        <text class="muted">{{ p.built ? '收租中' : p.own ? '可建造' : fmtMoney(p.price) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { state, fmtMoney, moveHome, buyPlot, buildOnPlot } from '../../game/index.js'
import { HOMES, PLOTS, BUILD_COST, BUILD_INCOME } from '../../game/data/world.js'

const homes = computed(() =>
  Object.keys(HOMES).map((id) => Object.assign({ id, current: state.home === id }, HOMES[id]))
)
const plots = computed(() =>
  PLOTS.map((p) => ({ id: p.id, price: p.price, own: !!state.plots[p.id], built: !!(state.plots[p.id] && state.plots[p.id].built) }))
)
const ownedCount = computed(() => Object.keys(state.plots).length)

function onMove(h) {
  if (h.current) return
  uni.showModal({
    title: h.price ? '买下' + h.name + '？' : '搬到' + h.name + '？',
    content: (h.price ? '价格 ' + fmtMoney(h.price) : '押金 ' + fmtMoney(h.rent)) + '。放不下的家具会退回仓库。',
    success(res) {
      if (res.confirm) moveHome(h.id)
    }
  })
}

function onPlot(p) {
  if (p.built) return
  if (p.own) buildOnPlot(p.id)
  else buyPlot(p.id)
}
</script>

<style>
.plots {
  display: flex;
  flex-wrap: wrap;
}
.plot {
  width: 23%;
  margin: 0 2% 16rpx 0;
  background: #e3f1fa;
  border-radius: 16rpx;
  padding: 12rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.plot.own {
  background: var(--paper-deep);
}
.plot.built {
  background: #dff3e4;
}
.plot-icon {
  font-size: 40rpx;
}
.plot-id {
  font-weight: 700;
}
</style>
