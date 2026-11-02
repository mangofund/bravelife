<template>
  <view class="panel">
    <view class="section-title">🚘 交通工具</view>
    <view v-for="v in list" :key="v.id" class="act" @click="buyVehicle(v.id)">
      <text class="act-icon">{{ v.icon }}</text>
      <view class="act-main">
        <text class="act-name">{{ v.name }}<text v-if="v.owned" class="tag-sm">已拥有</text></text>
        <text class="muted">{{ v.desc }}{{ v.parking ? '（' + fmtMoney(v.parking) + '/周）' : '' }}</text>
      </view>
      <text class="price">{{ v.owned ? '' : fmtMoney(v.price) }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { state, fmtMoney, buyVehicle } from '../../game/index.js'
import { VEHICLES } from '../../game/data/transport.js'

const list = computed(() =>
  Object.keys(VEHICLES).map((id) =>
    Object.assign({ id, owned: !!(state.vehicles && state.vehicles[id]) }, VEHICLES[id])
  )
)
</script>
