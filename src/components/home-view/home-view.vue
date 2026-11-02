<template>
  <view class="home" :class="{ wide }">
    <view class="home-a">
    <view class="card">
      <view class="row between">
        <text class="act-name">{{ home.icon }} {{ home.name }}</text>
        <text class="muted">{{ home.rent ? '周租 ' + fmtMoney(home.rent) : '自有房产' }}</text>
      </view>
      <text class="muted">装饰分 {{ decor }} · 睡眠质量 ×{{ bed }} · {{ kitchen ? '可以做饭' : '没有厨房设备' }}</text>
      <view class="clean-row">
        <text class="muted">整洁度 {{ Math.round(state.clean) }}</text>
        <view class="track clean-track"><view class="clean-fill" :style="{ width: state.clean + '%', background: state.clean < DIRTY_LINE ? 'var(--warn)' : 'var(--ok)' }" /></view>
      </view>
      <view v-if="!atHome" class="notice">你现在在外面。可以摆放家具，但睡觉、做饭需要先回家。</view>
      <view v-if="!atHome" class="btn dark" @click="travel('home')">回家</view>
    </view>

    <view class="section-title">房间布置 <text class="muted">{{ selected ? '点地板放下「' + FURNITURE[selected].name + '」' : '点仓库里的家具，再点地板摆放；点空地让主人公走过去' }}</text></view>
    <view class="room">
      <iso-room :selected="selected" @placed="onPlaced" />
    </view>

    </view>
    <view class="home-b">
    <view class="section-title">家具仓库</view>
    <view v-if="!invList.length" class="muted">仓库空了。去家具城买些家具吧。</view>
    <view class="inv">
      <view v-for="f in invList" :key="f.id" class="inv-item" :class="{ on: selected === f.id }" @click="selected = selected === f.id ? '' : f.id">
        <text class="cell-icon">{{ f.icon }}</text>
        <text class="inv-name">{{ f.name }} ×{{ f.count }}</text>
      </view>
    </view>

    <block v-if="atHome">
      <view class="section-title">在家</view>
      <view class="act" @click="act('sleep', true)">
        <text class="act-icon">😴</text>
        <view class="act-main"><text class="act-name">睡一觉</text><text class="muted">晚上睡到早上 7 点，白天睡 8 小时</text></view>
      </view>
      <view class="act" @click="act('sleep', false)">
        <text class="act-icon">💤</text>
        <view class="act-main"><text class="act-name">小睡 2 小时</text><text class="muted">恢复一点精力</text></view>
      </view>
      <view v-for="u in uses" :key="u.fid" class="act" @click="act('use', u.fid)">
        <text class="act-icon">{{ u.icon }}</text>
        <view class="act-main"><text class="act-name">{{ u.name }}</text><text class="muted">{{ fmtHours(u.hours) }} · {{ u.tip }}</text></view>
      </view>

      <view class="section-title">吃饭 <text class="muted">自己做便宜但费时，外卖省事但贵</text></view>
      <view v-for="g in ingredients" :key="g.id" class="act" @click="act('cook', g.id)">
        <text class="act-icon">🍳</text>
        <view class="act-main"><text class="act-name">自己做：{{ g.name }} ×{{ g.count }}</text><text class="muted">1 小时 · {{ kitchen ? '饱腹、心情、厨艺提升' : '需要厨房设备' }}</text></view>
        <text class="price">已买好</text>
      </view>
      <view v-if="!ingredients.length" class="muted block">没有食材。去场外鱼市买蔬菜、鲜鱼或和牛，回家自己做最省钱。</view>
      <view v-for="d in DELIVERY" :key="d.id" class="act" @click="orderDelivery(d.id)">
        <text class="act-icon">{{ d.icon }}</text>
        <view class="act-main"><text class="act-name">叫外卖：{{ d.name }}</text><text class="muted">{{ fmtHours(d.hours) }}送达 · {{ describe(d.effects) }}</text></view>
        <text class="price">{{ fmtMoney(d.price) }}</text>
      </view>

      <view class="section-title">家务 <text class="muted">整洁度低于 {{ DIRTY_LINE }} 心情会掉得更快</text></view>
      <view v-for="c in choreList" :key="c.id" class="act" @click="doChores(c.id)">
        <text class="act-icon">{{ c.icon }}</text>
        <view class="act-main"><text class="act-name">{{ c.name }}</text><text class="muted">{{ fmtHours(c.hours) }} · 整洁度 +{{ c.clean }}{{ c.effects.energy ? ' · 精力' + c.effects.energy : '' }}</text></view>
        <text class="price">{{ c.cost ? fmtMoney(c.cost) : '免费' }}</text>
      </view>
    </block>
  </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import IsoRoom from '../iso-room/iso-room.vue'
import { requestRoom } from '../../game/ui.js'
import {
  state, fmtMoney, fmtHours, describe, travel, sleep, cook, useFurniture, orderDelivery, doChores,
  bestBed, kitchenLevel, decorScore
} from '../../game/index.js'
import { FURNITURE, HOMES, ITEMS, DELIVERY, CHORES, DIRTY_LINE } from '../../game/data/world.js'

defineProps({ wide: { type: Boolean, default: false } })

const selected = ref('')
const choreList = Object.keys(CHORES).map((id) => Object.assign({ id }, CHORES[id]))
const home = computed(() => HOMES[state.home])
const atHome = computed(() => state.location === 'home')
const decor = computed(() => decorScore())
const bed = computed(() => bestBed())
const kitchen = computed(() => kitchenLevel())

const invList = computed(() =>
  Object.keys(state.furniture.inv)
    .filter((id) => state.furniture.inv[id] > 0)
    .map((id) => ({ id, name: FURNITURE[id].name, icon: FURNITURE[id].icon, count: state.furniture.inv[id] }))
)

const uses = computed(() => {
  const seen = {}
  const list = []
  state.furniture.placed.forEach((p) => {
    const f = FURNITURE[p.fid]
    if (f.use && !seen[p.fid]) {
      seen[p.fid] = true
      list.push({ fid: p.fid, name: f.use.name, icon: f.use.icon, hours: f.use.hours, tip: f.use.stream ? '赚打赏，魅力和创意越高越多' : describe(f.use.effects, f.use.skills) })
    }
  })
  return list
})

const ingredients = computed(() =>
  Object.keys(state.bag)
    .filter((id) => ITEMS[id] && ITEMS[id].kind === 'ingredient' && state.bag[id] > 0)
    .map((id) => ({ id, name: ITEMS[id].name, count: state.bag[id] }))
)

// 先让主人公在房间里走到家具旁，再执行行动
function act(kind, arg) {
  const run = () => {
    if (kind === 'sleep') sleep(arg)
    else if (kind === 'cook') cook(arg)
    else useFurniture(arg)
  }
  requestRoom(kind, kind === 'use' ? arg : '', run)
}

function onPlaced(fid) {
  if (!state.furniture.inv[fid]) selected.value = ''
}
</script>

<style>
.home {
  padding: 20rpx;
}
/* 宽屏：房间在左，仓库和在家行动在右 */
.home.wide {
  display: flex;
  align-items: flex-start;
}
.home.wide .home-a {
  flex: 1.2;
  min-width: 0;
  margin-right: 20px;
}
.home.wide .home-b {
  flex: 1;
  min-width: 0;
}
.room {
  border: var(--bw) solid var(--line);
  border-radius: 30rpx 22rpx 34rpx 24rpx / 24rpx 34rpx 22rpx 30rpx;
  box-shadow: var(--shadow);
  overflow: hidden;
  background: var(--paper-deep);
  padding: 12rpx 0;
}
.cell-icon {
  font-size: 52rpx;
}
.clean-row {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
}
.clean-track {
  flex: 1;
  height: 14rpx;
  margin-left: 16rpx;
  border-radius: 8rpx;
  overflow: hidden;
}
.clean-fill {
  height: 100%;
}
.inv {
  display: flex;
  flex-wrap: wrap;
}
.inv-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 23%;
  margin: 0 2% 16rpx 0;
  background: var(--card);
  border-radius: 16rpx;
  padding: 12rpx 0;
  border: 2rpx solid transparent;
}
.inv-item.on {
  border-color: var(--accent);
  background: var(--paper-deep);
}
.inv-name {
  font-size: 22rpx;
}
</style>
