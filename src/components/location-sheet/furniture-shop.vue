<template>
  <view class="panel">
    <view class="section-title">🛋️ 家具（买后放进家具仓库）</view>
    <view v-for="f in list" :key="f.id" class="act" @click="buyFurniture(f.id)">
      <text class="act-icon">{{ f.icon }}</text>
      <view class="act-main">
        <text class="act-name">{{ f.name }}<text class="muted"> · 已有 {{ f.owned }}</text></text>
        <text class="muted">{{ f.tip }}</text>
      </view>
      <text class="price">{{ fmtMoney(f.price) }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { state, fmtMoney, buyFurniture } from '../../game/index.js'
import { FURNITURE } from '../../game/data/world.js'

function tipOf(f) {
  const parts = []
  if (f.bed) parts.push('睡眠质量 ×' + f.bed)
  if (f.kitchen) parts.push(f.kitchen > 1 ? '高级厨房，厨艺成长 ×2' : '可以在家做饭')
  if (f.use) parts.push('解锁：' + f.use.name)
  if (f.decor) parts.push('装饰 +' + f.decor)
  return parts.join('，')
}

const list = computed(() =>
  Object.keys(FURNITURE).map((id) => {
    const f = FURNITURE[id]
    const placed = state.furniture.placed.filter((p) => p.fid === id).length
    return { id, name: f.name, icon: f.icon, price: f.price, tip: tipOf(f), owned: placed + (state.furniture.inv[id] || 0) }
  })
)
</script>
