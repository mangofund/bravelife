<template>
  <scroll-view
    class="map-scroll"
    scroll-x
    scroll-y
    :scroll-left="cam.left"
    :scroll-top="cam.top"
    :scroll-with-animation="!drag.active"
    @scroll="onScroll"
    :style="{ height: viewH }"
  >
    <!-- 地图始终占满场景层，HUD 作为上层覆盖，不参与地图布局 -->
    <view class="world-wrap" :style="padStyle">
    <view
      class="world"
      :style="{ width: W + 'rpx', height: H + 'rpx' }"
      @tap="onGround"
    >
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
        @tap.stop="play('openPanel'); emit('open', loc.id)"
      >
        <view class="sticker">
          <image v-if="!failed[loc.id]" class="sticker-img" :src="art(loc.id)" mode="aspectFill" @error="onImgError(loc.id)" />
          <text v-else class="sticker-emoji">{{ loc.icon }}</text>
          <text v-if="loc.people" class="people">👥</text>
        </view>
        <text class="label">{{ loc.name }}</text>
        <text v-if="loc.neighbor" class="neighbor-label">{{ loc.neighbor.icon }} {{ loc.neighbor.name }}</text>
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
    </view>
  </scroll-view>
</template>

<script setup>
import { play } from '../../game/audio.js'
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount, getCurrentInstance, nextTick } from 'vue'
import { useGuideAnchor } from '../../game/use-guide-anchor.js'
import HeroDoll from '../hero-doll/hero-doll.vue'
import { state, isOpen, travel, npcsAt, defaultMode, locVisible } from '../../game/index.js'
import { MODE_MAP } from '../../game/data/transport.js'
import { LOCATIONS, LOCATION_MAP } from '../../game/data/locations.js'
import { art } from '../../game/themes.js'
import { ui } from '../../game/ui.js'

const emit = defineEmits(['open', 'arrive-home'])
const instance = getCurrentInstance()

// 世界尺寸与地图底图同为 3:4；地点坐标仍用百分比
// 网页版可以用滚轮缩放：缩放只改变地图尺寸，建筑贴纸和人物大小不变
// 宽屏默认放大一些，让地图铺满整个场景层
const zoom = ref(ui.layout === 'wide' ? 1.5 : 1)
const W = computed(() => Math.round(1400 * zoom.value))
const H = computed(() => Math.round(1866 * zoom.value))
// w/h：可视区域像素；bw/bh：缩放为 1 时地图的像素尺寸（rpx 换算在网页和小程序不同，直接量出来最准）
const view = reactive({ w: 0, h: 0, bw: 0, bh: 0 })
// 地图不为 HUD 预留布局空间，镜头始终以整个场景层为中心
const PAD_TOP = 0
const pad = computed(() => {
  if (ui.layout !== 'wide') return { l: 0, r: 0, t: 0, b: 0 }
  return { l: 0, r: 0, t: PAD_TOP, b: 0 }
})
const padStyle = computed(() => {
  const p = pad.value
  return { padding: p.t + 'px ' + p.r + 'px ' + p.b + 'px ' + p.l + 'px', display: 'inline-block' }
})
const scrollPos = reactive({ left: 0, top: 0 })
const drag = reactive({ active: false, moved: false, x: 0, y: 0, left: 0, top: 0 })
const SPEED = 500 // rpx / 秒
const viewH = '100%'

const mapFailed = ref(false)
const failed = reactive({})
useGuideAnchor('map', '.hero')
const hero = reactive({ x: 0, y: 0, dur: 0, pose: 'idle', facing: 1, vehicle: '' })
// 不同出行方式在地图上的动画速度倍数（只影响画面，游戏时间按出行方式结算）
const ANIM_SPEED = { walk: 1, bike: 1.8, train: 2.6, taxi: 2.6, car: 2.6 }
const cam = reactive({ left: 0, top: 0 })
let walking = false
let timer = null

const spots = computed(() =>
  LOCATIONS.filter((l) => locVisible(l.id)).map((l) => {
    const people = !l.soon && isOpen(l, state.hour) ? npcsAt(l.id) : []
    return {
      id: l.id, name: l.name, icon: l.icon, x: l.x, y: l.y,
      soon: !!l.soon,
      open: isOpen(l, state.hour),
      here: state.location === l.id,
      people: people.length > 0,
      neighbor: people.find(npc => npc.route)
    }
  })
)

function onImgError(id) {
  failed[id] = true
}

// 站在建筑门口：贴纸下方一点
function door(locId) {
  const l = LOCATION_MAP[locId]
  return { x: l.x + 6, y: Math.min(l.y + 10, 99) }
}

// 量一下地图可视区域的实际大小（手机和宽屏不一样，窗口缩放后也会变）
function minZoom() {
  if (!view.bw || !view.bh) return 0.6
  // 宽屏要铺满整个屏幕，不能露出地图外的空白
  const p = pad.value
  const fill = Math.max((view.w - p.l - p.r) / view.bw, (view.h - p.t - p.b) / view.bh)
  return ui.layout === 'wide' ? Math.max(0.6, fill) : 0.6
}

function measure(done) {
  uni.createSelectorQuery()
    .in(instance.proxy)
    .select('.map-scroll')
    .boundingClientRect()
    .select('.world')
    .boundingClientRect()
    .exec((res) => {
      const a = res && res[0]
      const b = res && res[1]
      if (a && a.width) {
        view.w = a.width
        view.h = a.height
      }
      if (b && b.width) {
        view.bw = b.width / zoom.value
        view.bh = b.height / zoom.value
      }
      const mz = minZoom()
      if (zoom.value < mz) zoom.value = Math.round(mz * 100) / 100 + 0.01
      if (done) done()
    })
}

function centerX() {
  return view.w / 2
}

function centerCamera(xPct, yPct) {
  const vh = view.h || uni.getSystemInfoSync().windowHeight - uni.upx2px(330)
  const bw = view.bw || uni.upx2px(1400)
  const bh = view.bh || uni.upx2px(1866)
  const px = (bw * zoom.value * xPct) / 100 + pad.value.l
  const py = (bh * zoom.value * yPct) / 100 + pad.value.t
  // 小程序里相同的值不会触发滚动，加一点抖动保证每次都生效
  const jitter = cam.left % 1 === 0 ? 0.5 : 0
  cam.left = Math.max(0, px - centerX()) + jitter
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
  const dx = ((xPct - hero.x) * W.value) / 100
  const dy = ((yPct - hero.y) * H.value) / 100
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
function onScroll(e) {
  scrollPos.left = e.detail.scrollLeft
  scrollPos.top = e.detail.scrollTop
}

// ---------- 网页版：鼠标拖动、滚轮缩放 ----------
function onDragStart(e) {
  if (e.button !== undefined && e.button !== 0) return
  drag.active = true
  drag.moved = false
  drag.x = e.clientX
  drag.y = e.clientY
  drag.left = scrollPos.left
  drag.top = scrollPos.top
  // #ifdef H5
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
  // #endif
}

function onDragMove(e) {
  if (!drag.active) return
  const dx = e.clientX - drag.x
  const dy = e.clientY - drag.y
  if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true
  cam.left = Math.max(0, drag.left - dx)
  cam.top = Math.max(0, drag.top - dy)
}

function onDragEnd() {
  drag.active = false
  // #ifdef H5
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
  // #endif
  // 拖动结束后紧跟着的 click 不算点空地
  if (drag.moved) setTimeout(() => (drag.moved = false), 50)
}

function onWheel(e) {
  if (!e.deltaY) return
  if (e.preventDefault) e.preventDefault()
  const old = zoom.value
  const next = Math.min(2.4, Math.max(minZoom(), Math.round((old * (e.deltaY < 0 ? 1.1 : 1 / 1.1)) * 100) / 100))
  if (next === old) return
  // 以视野中心为基准缩放
  const vw = view.w || 400
  const vh = view.h || 600
  const p = pad.value
  const cx = (scrollPos.left + centerX() - p.l) / old
  const cy = (scrollPos.top + vh / 2 - p.t) / old
  zoom.value = next
  cam.left = Math.max(0, cx * next + p.l - centerX())
  cam.top = Math.max(0, cy * next + p.t - vh / 2)
}

function onGround(e) {
  if (walking || drag.moved) return
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

// 键盘方向键：主人公在地图上散步
watch(
  () => ui.nudge && ui.nudge.nonce,
  () => {
    const n = ui.nudge
    if (!n || walking) return
    walk(Math.min(99, Math.max(1, hero.x + n.dx)), Math.min(99, Math.max(1, hero.y + n.dy)))
  }
)

watch(
  () => ui.width,
  () => nextTick(() => measure())
)
// 网页版直接在 DOM 上监听鼠标和滚轮（uni 组件不转发 wheel 事件；滚轮需要 passive: false 才能阻止页面滚动）
let mapEl = null
onMounted(() => {
  // #ifdef H5
  mapEl = instance.proxy.$el && instance.proxy.$el.querySelector ? instance.proxy.$el : document.querySelector('.map-scroll')
  if (mapEl) {
    mapEl.addEventListener('wheel', onWheel, { passive: false })
    mapEl.addEventListener('mousedown', onDragStart)
  }
  // #endif
})

const start = door(state.location)
place(start.x, start.y)
nextTick(() => {
  measure(() => setTimeout(() => centerCamera(start.x, start.y), 60))
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  walking = false
  onDragEnd()
  // #ifdef H5
  if (mapEl) {
    mapEl.removeEventListener('wheel', onWheel)
    mapEl.removeEventListener('mousedown', onDragStart)
  }
  // #endif
})
</script>

<style>
.neighbor-label {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -65%);
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: var(--card);
  color: var(--ink);
  white-space: nowrap;
  font-size: max(var(--readable-min, 0px), 22rpx);
}
.map-scroll {
  width: 100%;
  background: var(--paper-deep);
}
.world {
  position: relative;
  cursor: grab;
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
  font-size: max(var(--readable-min, 0px), 22rpx);
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
  font-size: max(var(--readable-min, 0px), 18rpx);
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
