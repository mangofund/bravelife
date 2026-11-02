<template>
  <scroll-view
    class="map-scroll"
    scroll-x
    scroll-y
    :scroll-left="cam.left"
    :scroll-top="cam.top"
    scroll-with-animation
    :style="{ height: viewH }"
  >
    <view class="world" :style="{ width: W + 'rpx', height: H + 'rpx' }" @tap="onGround">
      <image v-if="!mapFailed" class="map-img" :src="art('map')" mode="aspectFill" @error="mapFailed = true" />
      <view v-else class="map-fallback">
        <view class="fb-water fb-bay" />
        <view class="fb-water fb-river" />
        <view class="fb-green fb-g1" />
        <view class="fb-green fb-g2" />
      </view>

      <view
        v-for="(loc, i) in spots"
        :key="loc.id"
        class="spot"
        :class="{ here: loc.here, closed: !loc.open, soon: loc.soon }"
        :style="{ left: loc.x + '%', top: loc.y + '%', transform: 'translate(-50%, -50%) rotate(' + (i % 2 ? 2 : -2) + 'deg)', zIndex: Math.round(loc.y) }"
        @tap.stop="emit('open', loc.id)"
      >
        <view class="sticker">
          <image v-if="!failed[loc.id]" class="sticker-img" :src="art(loc.id)" mode="aspectFill" @error="onImgError(loc.id)" />
          <text v-else class="sticker-emoji">{{ loc.icon }}</text>
          <text v-if="loc.people" class="people">👥</text>
        </view>
        <text class="label">{{ loc.name }}</text>
        <text v-if="loc.soon" class="tip">即将开放</text>
        <text v-else-if="!loc.open" class="tip">休息中</text>
      </view>

      <view
        class="hero"
        :style="{ left: hero.x + '%', top: hero.y + '%', transitionDuration: hero.dur + 's', zIndex: Math.round(hero.y) + 1 }"
      >
        <hero-doll :profile="state.profile" :size="110" :pose="hero.pose" :facing="hero.facing" />
        <text v-if="hero.vehicle" class="ride">{{ hero.vehicle }}</text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup>
import { computed, reactive, ref, watch, onBeforeUnmount, getCurrentInstance, nextTick } from 'vue'
import HeroDoll from '../hero-doll/hero-doll.vue'
import { state, isOpen, travel, npcsAt, defaultMode } from '../../game/index.js'
import { MODE_MAP } from '../../game/data/transport.js'
import { LOCATIONS, LOCATION_MAP } from '../../game/data/locations.js'
import { art } from '../../game/themes.js'
import { ui } from '../../game/ui.js'

const emit = defineEmits(['open', 'arrive-home'])
const instance = getCurrentInstance()

// 世界尺寸与地图底图同为 3:4；地点坐标仍用百分比
const W = 1400
const H = 1866
const SPEED = 500 // rpx / 秒
const viewH = '100%'

const mapFailed = ref(false)
const failed = reactive({})
const hero = reactive({ x: 0, y: 0, dur: 0, pose: 'idle', facing: 1, vehicle: '' })
// 不同出行方式在地图上的动画速度倍数（只影响画面，游戏时间按出行方式结算）
const ANIM_SPEED = { walk: 1, bike: 1.8, train: 2.6, taxi: 2.6, car: 2.6 }
const cam = reactive({ left: 0, top: 0 })
let walking = false
let timer = null

const spots = computed(() =>
  LOCATIONS.map((l) => ({
    id: l.id, name: l.name, icon: l.icon, x: l.x, y: l.y,
    soon: !!l.soon,
    open: isOpen(l, state.hour),
    here: state.location === l.id,
    people: !l.soon && npcsAt(l.id).length > 0
  }))
)

function onImgError(id) {
  failed[id] = true
}

// 站在建筑门口：贴纸下方一点
function door(locId) {
  const l = LOCATION_MAP[locId]
  return { x: l.x + 6, y: Math.min(l.y + 10, 99) }
}

function centerCamera(xPct, yPct) {
  const vw = uni.upx2px(750)
  const vh = uni.getSystemInfoSync().windowHeight - uni.upx2px(330)
  const px = uni.upx2px((W * xPct) / 100)
  const py = uni.upx2px((H * yPct) / 100)
  // 小程序里相同的值不会触发滚动，加一点抖动保证每次都生效
  const jitter = cam.left % 1 === 0 ? 0.5 : 0
  cam.left = Math.max(0, px - vw / 2) + jitter
  cam.top = Math.max(0, py - vh / 2) + jitter
}

function place(xPct, yPct) {
  hero.dur = 0
  hero.x = xPct
  hero.y = yPct
  hero.pose = 'idle'
}

function walk(xPct, yPct, done, mode) {
  if (walking) return
  const dx = ((xPct - hero.x) * W) / 100
  const dy = ((yPct - hero.y) * H) / 100
  const dist = Math.sqrt(dx * dx + dy * dy)
  const mul = ANIM_SPEED[mode] || 1
  const dur = Math.min(3, Math.max(0.35, dist / (SPEED * mul)))
  hero.vehicle = mode && mode !== 'walk' ? MODE_MAP[mode].icon : ''
  walking = true
  if (Math.abs(dx) > 4) hero.facing = dx < 0 ? -1 : 1
  hero.pose = 'walk'
  hero.dur = dur
  hero.x = xPct
  hero.y = yPct
  centerCamera(xPct, yPct)
  timer = setTimeout(() => {
    walking = false
    hero.pose = 'idle'
    hero.vehicle = ''
    timer = null
    if (done) done()
  }, dur * 1000)
}

// 点空地：主人公散步过去（只是走动，不消耗游戏时间）
function onGround(e) {
  if (walking) return
  const d = e.detail || {}
  if (d.x === undefined) return
  uni.createSelectorQuery()
    .in(instance.proxy)
    .select('.world')
    .boundingClientRect((rect) => {
      if (!rect || !rect.width) return
      const x = ((d.x - rect.left) / rect.width) * 100
      const y = ((d.y - rect.top) / rect.height) * 100
      if (x < 0 || x > 100 || y < 0 || y > 100) return
      walk(x, y)
    })
    .exec()
}

// 地点面板里点「前往」后：先走过去，到了再结算出行
watch(
  () => ui.walkRequest && ui.walkRequest.nonce,
  () => {
    const req = ui.walkRequest
    if (!req) return
    const target = door(req.loc)
    const mode = req.mode || defaultMode(req.loc)
    walk(target.x, target.y, () => {
      travel(req.loc, mode)
      if (state.location === 'home' && req.loc === 'home') emit('arrive-home')
      else if (state.location === req.loc) emit('open', req.loc)
    }, mode)
  }
)

// 被送医等非走路方式换了地点时，直接把人物放过去
watch(
  () => state.location,
  (loc) => {
    if (walking) return
    const d = door(loc)
    place(d.x, d.y)
    centerCamera(d.x, d.y)
  }
)

const start = door(state.location)
place(start.x, start.y)
nextTick(() => centerCamera(start.x, start.y))

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  walking = false
})
</script>

<style>
.map-scroll {
  width: 100%;
  background: var(--paper-deep);
}
.world {
  position: relative;
}
.map-img,
.map-fallback {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
.map-fallback {
  background: var(--paper);
  overflow: hidden;
}
.fb-water {
  position: absolute;
  background: #a9d3ec;
}
.fb-bay {
  right: -200rpx;
  bottom: -200rpx;
  width: 900rpx;
  height: 900rpx;
  border-radius: 50%;
}
.fb-river {
  left: 0;
  top: 50%;
  width: 100%;
  height: 60rpx;
  transform: rotate(-6deg);
}
.fb-green {
  position: absolute;
  background: #c7e3b4;
  border-radius: 80rpx;
}
.fb-g1 {
  left: 30%;
  top: 55%;
  width: 360rpx;
  height: 260rpx;
}
.fb-g2 {
  left: 4%;
  top: 52%;
  width: 260rpx;
  height: 300rpx;
}
.spot {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.sticker {
  position: relative;
  width: 150rpx;
  height: 150rpx;
  padding: 8rpx;
  background: var(--card);
  border: var(--bw) solid var(--line);
  border-radius: 30rpx 22rpx 34rpx 24rpx / 24rpx 34rpx 22rpx 30rpx;
  box-shadow: var(--shadow);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sticker-img {
  width: 100%;
  height: 100%;
  border-radius: 22rpx 16rpx 26rpx 18rpx;
}
.sticker-emoji {
  font-size: 72rpx;
}
.people {
  position: absolute;
  right: -14rpx;
  top: -14rpx;
  font-size: 30rpx;
  background: var(--card);
  border: 2rpx solid var(--line);
  border-radius: 50%;
  padding: 2rpx 6rpx;
}
.label {
  margin-top: 6rpx;
  padding: 2rpx 14rpx;
  font-size: 22rpx;
  font-weight: 700;
  white-space: nowrap;
  background: var(--card);
  border: 2rpx solid var(--line);
  border-radius: 999rpx;
}
.spot.here .sticker {
  border-color: var(--accent);
  border-width: 6rpx;
}
.spot.here .label {
  background: var(--accent);
  color: #fff;
}
.spot.closed .sticker {
  opacity: 0.6;
}
.spot.soon .sticker {
  opacity: 0.5;
  border-style: dashed;
}
.tip {
  font-size: 18rpx;
  color: var(--muted);
  background: var(--card);
  border-radius: 999rpx;
  padding: 0 10rpx;
  margin-top: 4rpx;
}
.ride {
  position: absolute;
  left: 50%;
  bottom: -10rpx;
  transform: translateX(-50%);
  font-size: 56rpx;
}
.hero {
  position: absolute;
  transform: translate(-50%, -92%);
  transition-property: left, top;
  transition-timing-function: linear;
  pointer-events: none;
}
</style>
