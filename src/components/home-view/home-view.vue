<template>
  <view class="home">
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

    <view class="section-title">房间布置 <text class="muted">{{ selected ? '点空格放下「' + FURNITURE[selected].name + '」' : '点仓库里的家具，再点空格摆放' }}</text></view>
    <view class="room">
      <image v-if="!roomFailed" class="room-img" :src="art('room')" mode="aspectFill" @error="roomFailed = true" />
      <view class="grid">
      <view
        v-for="cell in cells"
        :key="cell.key"
        class="cell"
        :class="{ filled: !!cell.item, target: selected && !cell.item }"
        :style="{ width: cellW }"
        @click="onCell(cell)"
      >
        <text v-if="cell.item" class="cell-icon">{{ FURNITURE[cell.item.fid].icon }}</text>
      </view>
        <view v-if="atHome" class="room-hero" :style="heroStyle">
          <hero-doll :profile="state.profile" :size="96" :pose="pose" :facing="facing" />
        </view>
      </view>
    </view>

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
</template>

<script setup>
import { computed, ref, reactive, onBeforeUnmount } from 'vue'
import HeroDoll from '../hero-doll/hero-doll.vue'
import { art } from '../../game/themes.js'
import {
  state, fmtMoney, fmtHours, describe, travel, sleep, cook, useFurniture, placeFurniture, removeFurniture, orderDelivery, doChores,
  bestBed, kitchenLevel, decorScore
} from '../../game/index.js'
import { FURNITURE, HOMES, ITEMS, DELIVERY, CHORES, DIRTY_LINE } from '../../game/data/world.js'

const selected = ref('')
const choreList = Object.keys(CHORES).map((id) => Object.assign({ id }, CHORES[id]))
const roomFailed = ref(false)
const home = computed(() => HOMES[state.home])
const atHome = computed(() => state.location === 'home')
const decor = computed(() => decorScore())
const bed = computed(() => bestBed())
const kitchen = computed(() => kitchenLevel())
const cellW = computed(() => 100 / home.value.cols + '%')

const cells = computed(() => {
  const list = []
  for (let y = 0; y < home.value.rows; y++) {
    for (let x = 0; x < home.value.cols; x++) {
      const item = state.furniture.placed.filter((p) => p.x === x && p.y === y)[0] || null
      list.push({ key: x + '-' + y, x, y, item })
    }
  }
  return list
})

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

function onCell(cell) {
  if (cell.item) {
    const f = FURNITURE[cell.item.fid]
    uni.showModal({
      title: f.icon + ' ' + f.name,
      content: '收回到家具仓库？',
      success(res) {
        if (res.confirm) removeFurniture(cell.item.uid)
      }
    })
    return
  }
  if (!selected.value) return
  const fid = selected.value
  placeFurniture(fid, cell.x, cell.y)
  if (!state.furniture.inv[fid]) selected.value = ''
}

// ---------- 房间里的主人公 ----------
const hero = reactive({ x: 0, y: 0, dur: 0 })
const pose = ref('idle')
const facing = ref(1)
let busy = false
let walkTimer = null
let poseTimer = null

const heroStyle = computed(() => ({
  left: ((hero.x + 0.5) / home.value.cols) * 100 + '%',
  top: ((hero.y + 0.5) / home.value.rows) * 100 + '%',
  transitionDuration: hero.dur + 's'
}))

function moveTo(x, y, then) {
  if (busy) return
  const dist = Math.abs(x - hero.x) + Math.abs(y - hero.y)
  if (x !== hero.x) facing.value = x < hero.x ? -1 : 1
  const dur = dist ? Math.min(1.6, 0.35 * dist) : 0
  busy = true
  pose.value = dur ? 'walk' : 'idle'
  hero.dur = dur
  hero.x = x
  hero.y = y
  walkTimer = setTimeout(() => {
    walkTimer = null
    busy = false
    pose.value = 'idle'
    if (then) then()
  }, dur * 1000)
}

function cellOf(test) {
  return state.furniture.placed.filter((p) => test(FURNITURE[p.fid], p))[0] || null
}

// 先走到对应家具旁，再执行行动并摆出动作
function act(kind, arg) {
  if (!atHome.value || busy) {
    if (kind === 'sleep') sleep(arg)
    else if (kind === 'cook') cook(arg)
    else useFurniture(arg)
    return
  }
  let spot = null
  let p = 'cook'
  let run = null
  if (kind === 'sleep') {
    spot = cellOf((f) => !!f.bed)
    p = 'sleep'
    run = () => sleep(arg)
  } else if (kind === 'cook') {
    spot = cellOf((f) => !!f.kitchen)
    run = () => cook(arg)
  } else {
    spot = cellOf((f, item) => item.fid === arg)
    run = () => useFurniture(arg)
  }
  const tx = spot ? spot.x : hero.x
  const ty = spot ? spot.y : hero.y
  moveTo(tx, ty, () => {
    pose.value = p
    busy = true
    run()
    poseTimer = setTimeout(() => {
      poseTimer = null
      busy = false
      pose.value = 'idle'
    }, p === 'sleep' ? 2400 : 1600)
  })
}

// 在家时偶尔随便走走
const wander = setInterval(() => {
  if (!atHome.value || busy || Math.random() < 0.4) return
  moveTo(Math.floor(Math.random() * home.value.cols), Math.floor(Math.random() * home.value.rows))
}, 3500)

onBeforeUnmount(() => {
  clearInterval(wander)
  if (walkTimer) clearTimeout(walkTimer)
  if (poseTimer) clearTimeout(poseTimer)
})
</script>

<style>
.home {
  padding: 20rpx;
}
.room {
  position: relative;
  border: var(--bw) solid var(--line);
  border-radius: 30rpx 22rpx 34rpx 24rpx / 24rpx 34rpx 22rpx 30rpx;
  box-shadow: var(--shadow);
  overflow: hidden;
  background: #d9c3a0;
  padding: 120rpx 16rpx 16rpx;
}
.room-img {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
.grid {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  border-radius: 12rpx;
  overflow: hidden;
}
.room-hero {
  position: absolute;
  transform: translate(-50%, -80%);
  transition-property: left, top;
  transition-timing-function: linear;
  pointer-events: none;
  z-index: 5;
  width: 60rpx;
}
.cell {
  height: 100rpx;
  box-sizing: border-box;
  border: 1rpx dashed rgba(80, 60, 40, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}
.cell.filled {
  background: rgba(255, 255, 255, 0.55);
  border-radius: 18rpx;
}
.cell.target {
  background: rgba(255, 107, 74, 0.15);
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
