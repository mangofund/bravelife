<template>
  <view class="iso" :style="{ width: CW + 'rpx', height: CH + 'rpx' }" @tap="onTap">
    <!-- #ifdef H5 || MP-WEIXIN -->
    <scene-stage v-if="threeD" kind="room" :model="roomModel" :anchors="roomAnchors"
      @ready="threeReady = true" @failure="fail3d" @pick="pick3d" @projected="roomProjection = $event" />
    <view v-if="threeD && threeReady && atHome" class="iso-hero iso-hero-3d" :style="hero3dStyle">
      <hero-doll :profile="state.profile" :size="Math.round(TW * 1.05)" :pose="pose" :facing="facing" />
    </view>
    <!-- #endif -->
    <template v-if="!threeD || !threeReady">
    <!-- 后面两面墙：沿房间左上、右上两条边立起来 -->
    <view class="wall wall-l" :style="wallL" />
    <view class="wall wall-r" :style="wallR"><view class="window" /></view>

    <view
      v-for="c in cells"
      :key="c.key"
      class="tile"
      :class="{ alt: (c.x + c.y) % 2, target: selected && !c.item, blocked: selected && c.item }"
      :style="{ left: c.left + 'rpx', top: c.top + 'rpx', width: TW + 'rpx', height: TH + 'rpx' }"
    />

    <view
      v-for="f in furniture"
      :key="f.uid"
      class="furn"
      @tap.stop="emit('inspect', { uid: f.uid, fid: f.fid })"
      :style="{ left: f.left + 'rpx', top: f.top + 'rpx', width: f.w + 'rpx', zIndex: f.z }"
    >
      <image v-if="!failed[f.fid]" class="furn-img" :src="art('furn/' + f.fid, 'png')" mode="widthFix" @error="failed[f.fid] = true" />
      <text v-else class="furn-emoji" :style="{ fontSize: TW * 0.5 + 'rpx' }">{{ f.icon }}</text>
    </view>

    <pet-residents environment="room" :points="petPoints" />
    <view v-if="atHome" class="iso-hero" :style="heroStyle">
      <hero-doll :profile="state.profile" :size="Math.round(TW * 1.05)" :pose="pose" :facing="facing" />
    </view>
    </template>
  </view>
</template>

<script setup>
import { computed, reactive, ref, watch, onBeforeUnmount, getCurrentInstance } from 'vue'
// #ifdef H5 || MP-WEIXIN
import SceneStage from '../scene-stage/scene-stage.vue'
// #endif
import PetResidents from '../pet-actor/pet-residents.vue'
import { useGuideAnchor } from '../../game/use-guide-anchor.js'
import HeroDoll from '../hero-doll/hero-doll.vue'
import { state, placeFurniture } from '../../game/index.js'
import { FURNITURE, HOMES } from '../../game/data/world.js'
import { art } from '../../game/themes.js'
import { ui } from '../../game/ui.js'

const props = defineProps({ selected: { type: String, default: '' }, threeD: Boolean })
const emit = defineEmits(['placed', 'inspect', '3d-failure'])
const instance = getCurrentInstance()
const threeReady = ref(false)
watch(() => props.threeD, () => { threeReady.value = false })

// #ifdef H5 || MP-WEIXIN
const roomModel = computed(() => ({
  cols: cols.value,
  rows: rows.value,
  cells: cells.value.map(({ x, y, item }) => ({ x, y, item: item && { fid: item.fid } })),
  placing: !!props.selected
}))
const heroHeight = computed(() => {
  if (pose.value !== 'sleep') return 0
  const fid = itemAt.value[hero.x + ',' + hero.y]?.fid
  return fid === 'futon' ? .22 : ON_TOP[fid] ? .4 : 0
})
const roomAnchors = computed(() => [[hero.x + .5, heroHeight.value, hero.y + .5]])
const roomProjection = ref([])
const hero3dStyle = computed(() => ({
  ...roomProjection.value[0],
  transitionDuration: STEP + 's'
}))
function fail3d() {
  threeReady.value = false
  emit('3d-failure')
}
function pick3d({ x, y }) {
  onCell(x, y)
}
// #endif

// 可以踩上去的家具（地毯、扫地机器人）
const WALKABLE = { rug: true, robovac: true }
// 睡觉、坐下时人物直接站到家具格子上
const ON_TOP = { bed: true, futon: true, kingbed: true, sofa: true }
const STEP = 0.3 // 每走一格的秒数

const CW = 690
const failed = reactive({})
const home = computed(() => HOMES[state.home])
const cols = computed(() => home.value.cols)
const rows = computed(() => home.value.rows)
// 2:1 等轴格子：宽 TW，高 TH
const TW = computed(() => Math.min(150, Math.floor((CW * 2) / (cols.value + rows.value))))
const TH = computed(() => TW.value / 2)
const WH = computed(() => Math.round(TW.value * 1.15))
const OX = computed(() => CW / 2 + ((rows.value - cols.value) * TW.value) / 4)
const OY = computed(() => WH.value + 12)
const CH = computed(() => Math.ceil(OY.value + ((cols.value + rows.value) * TH.value) / 2 + 24))
const atHome = computed(() => state.location === 'home')

// 格子 (x, y) 的上顶点在画面上的位置
function top(x, y) {
  return { X: OX.value + ((x - y) * TW.value) / 2, Y: OY.value + ((x + y) * TH.value) / 2 }
}

const itemAt = computed(() => {
  const m = {}
  state.furniture.placed.forEach((p) => {
    m[p.x + ',' + p.y] = p
  })
  return m
})

const cells = computed(() => {
  const list = []
  for (let y = 0; y < rows.value; y++) {
    for (let x = 0; x < cols.value; x++) {
      const p = top(x, y)
      list.push({ key: x + '-' + y, x, y, left: p.X - TW.value / 2, top: p.Y, item: itemAt.value[x + ',' + y] || null })
    }
  }
  return list
})

// 家具贴在格子底部顶点上方；越靠前（x + y 越大）越后画
const furniture = computed(() =>
  state.furniture.placed
    .filter((p) => p.x < cols.value && p.y < rows.value)
    .map((p) => {
      const t = top(p.x, p.y)
      const flat = p.fid === 'rug' || p.fid === 'robovac'
      const w = Math.round(TW.value * (flat ? 0.95 : 1.1))
      return {
        uid: p.uid,
        fid: p.fid,
        icon: FURNITURE[p.fid].icon,
        w,
        left: t.X - w / 2,
        top: t.Y + TH.value * (flat ? 0.75 : 0.92),
        z: (p.x + p.y) * 10 + (flat ? 1 : 5)
      }
    })
)

const wallL = computed(() => {
  const w = (rows.value * TW.value) / 2
  return { left: OX.value - w + 'rpx', top: OY.value + (rows.value * TH.value) / 2 - WH.value + 'rpx', width: w + 'rpx', height: WH.value + 'rpx' }
})
const wallR = computed(() => {
  const w = (cols.value * TW.value) / 2
  return { left: OX.value + 'rpx', top: OY.value - WH.value + 'rpx', width: w + 'rpx', height: WH.value + 'rpx' }
})

// ---------- 主人公：沿格子寻路，不穿墙、不穿家具 ----------
const hero = reactive({ x: 0, y: 0 })
const pose = ref('idle')
const facing = ref(1)
let busy = false
let timers = []

useGuideAnchor('room', '.iso-hero')
const petPoints = computed(() => cells.value.filter(c => !c.item || WALKABLE[c.item.fid]).map(c => {
  const t = top(c.x, c.y)
  return { id: c.key, x: c.x, y: c.y, left: t.X + 'rpx', top: (t.Y + TH.value * .65) + 'rpx', z: (c.x + c.y) * 10 + 6 }
}))
const heroStyle = computed(() => {
  const t = top(hero.x, hero.y)
  return {
    left: t.X + 'rpx',
    top: t.Y + TH.value * 0.6 + 'rpx',
    zIndex: (hero.x + hero.y) * 10 + 7,
    transitionDuration: STEP + 's'
  }
})

function walkable(x, y, allow) {
  if (x < 0 || y < 0 || x >= cols.value || y >= rows.value) return false
  const it = itemAt.value[x + ',' + y]
  if (!it) return true
  if (allow && allow === x + ',' + y) return true
  return !!WALKABLE[it.fid]
}

// 广度优先搜索：返回从当前位置到任一目标格的路径（不含起点）
function findPath(goals, allow) {
  const key = (x, y) => x + ',' + y
  const goalSet = {}
  goals.forEach((g) => (goalSet[key(g.x, g.y)] = true))
  if (goalSet[key(hero.x, hero.y)]) return []
  const prev = {}
  const queue = [{ x: hero.x, y: hero.y }]
  prev[key(hero.x, hero.y)] = null
  while (queue.length) {
    const c = queue.shift()
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    for (let i = 0; i < dirs.length; i++) {
      const nx = c.x + dirs[i][0]
      const ny = c.y + dirs[i][1]
      const k = key(nx, ny)
      if (k in prev || !walkable(nx, ny, allow)) continue
      prev[k] = c
      if (goalSet[k]) {
        const path = [{ x: nx, y: ny }]
        let p = c
        while (p && !(p.x === hero.x && p.y === hero.y)) {
          path.unshift(p)
          p = prev[key(p.x, p.y)]
        }
        return path
      }
      queue.push({ x: nx, y: ny })
    }
  }
  return null
}
function clearTimers() {
  timers.forEach((t) => clearTimeout(t))
  timers = []
}

// 一格一格走，每一步都更新朝向；画面上 x 增大往右下、y 增大往左下
function walkPath(path, done) {
  if (!path || !path.length) {
    if (done) done()
    return
  }
  busy = true
  pose.value = 'walk'
  path.forEach((c, i) => {
    timers.push(
      setTimeout(() => {
        const dx = c.x - hero.x - (c.y - hero.y)
        if (dx) facing.value = dx > 0 ? 1 : -1
        hero.x = c.x
        hero.y = c.y
      }, i * STEP * 1000)
    )
  })
  timers.push(
    setTimeout(() => {
      pose.value = 'idle'
      busy = false
      if (done) done()
    }, path.length * STEP * 1000 + 20)
  )
}

function neighbors(x, y) {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].map((d) => ({ x: x + d[0], y: y + d[1] })).filter((c) => walkable(c.x, c.y))
}

// 家里的行动请求：走到家具旁（床、沙发直接躺上去），摆出动作，再结算
watch(
  () => ui.roomRequest && ui.roomRequest.nonce,
  () => {
    const req = ui.roomRequest
    if (!req) return
    if (!atHome.value || busy) {
      req.run()
      return
    }
    const test = req.kind === 'sleep' ? (f) => !!f.bed : req.kind === 'cook' ? (f) => !!f.kitchen : (f, p) => p.fid === req.fid
    const target = state.furniture.placed.filter((p) => test(FURNITURE[p.fid], p))[0]
    const finalPose = req.kind === 'sleep' ? 'sleep' : 'cook'
    const perform = () => {
      busy = true
      pose.value = finalPose
      req.run()
      timers.push(
        setTimeout(() => {
          busy = false
          pose.value = 'idle'
        }, finalPose === 'sleep' ? 2400 : 1600)
      )
    }
    if (!target) {
      perform()
      return
    }
    const onTop = ON_TOP[target.fid]
    const goals = onTop ? [{ x: target.x, y: target.y }] : neighbors(target.x, target.y)
    const path = findPath(goals.length ? goals : [{ x: hero.x, y: hero.y }], onTop ? target.x + ',' + target.y : '')
    if (path === null) perform()
    else walkPath(path, perform)
  }
)

// 在家时偶尔随便走走
const wander = setInterval(() => {
  if (!atHome.value || busy || Math.random() < 0.45) return
  const free = cells.value.filter((c) => walkable(c.x, c.y) && !(c.x === hero.x && c.y === hero.y))
  if (!free.length) return
  const goal = free[Math.floor(Math.random() * free.length)]
  const path = findPath([goal])
  if (path && path.length <= 6) walkPath(path)
}, 3800)

// 家具摆到人物脚下、或者搬家后格子变了，就把人物挪到最近的空地
function settleHero() {
  if (hero.x < cols.value && hero.y < rows.value && walkable(hero.x, hero.y)) return
  const free = cells.value.filter((c) => walkable(c.x, c.y))
  if (!free.length) return
  free.sort((a, b) => Math.abs(a.x - hero.x) + Math.abs(a.y - hero.y) - (Math.abs(b.x - hero.x) + Math.abs(b.y - hero.y)))
  hero.x = free[0].x
  hero.y = free[0].y
}
watch(() => [state.furniture.placed.length, state.home], settleHero)
settleHero()

// 点击位置换算成格子：等轴坐标的逆变换
function onTap(e) {
  if (props.threeD && threeReady.value) return
  const d = e.detail || {}
  if (d.x === undefined) return
  uni.createSelectorQuery()
    .in(instance.proxy)
    .select('.iso')
    .boundingClientRect((rect) => {
      if (!rect || !rect.width) return
      const scale = CW / rect.width
      const px = (d.x - rect.left) * scale - OX.value
      const py = (d.y - rect.top) * scale - OY.value
      const gx = Math.floor((px / (TW.value / 2) + py / (TH.value / 2)) / 2)
      const gy = Math.floor((py / (TH.value / 2) - px / (TW.value / 2)) / 2)
      if (gx < 0 || gy < 0 || gx >= cols.value || gy >= rows.value) return
      onCell(gx, gy)
    })
    .exec()
}

function onCell(x, y) {
  const item = itemAt.value[x + ',' + y]
  if (item) {
    emit('inspect', { uid: item.uid, fid: item.fid })
    return
  }
  if (props.selected) {
    placeFurniture(props.selected, x, y)
    emit('placed', props.selected)
    settleHero()
    return
  }
  // 没选家具时点空地：主人公走过去
  if (atHome.value && !busy) {
    const path = findPath([{ x, y }])
    if (path) walkPath(path)
  }
}

onBeforeUnmount(() => {
  clearInterval(wander)
  clearTimers()
})
</script>

<style>
.iso {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
}
.wall {
  position: absolute;
  transform-origin: 0 100%;
  border: 3rpx solid rgba(60, 40, 20, 0.35);
  box-sizing: border-box;
}
.wall-l {
  background: var(--wall-l);
  transform: skewY(-26.565deg);
}
.wall-r {
  background: var(--wall-r);
  transform: skewY(26.565deg);
}
.window {
  position: absolute;
  left: 30%;
  top: 18%;
  width: 34%;
  height: 46%;
  background: linear-gradient(180deg, #cfe9f7, #f4fbff);
  border: 6rpx solid #fff;
  box-shadow: 0 0 0 3rpx rgba(60, 40, 20, 0.3);
}
.tile {
  position: absolute;
  background: var(--floor-a);
  -webkit-clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
}
.tile.alt {
  background: var(--floor-b);
}
.tile.target {
  background: #ffe2a8;
}
.tile.blocked {
  opacity: 0.85;
}
.furn {
  position: absolute;
  transform: translateY(-100%);
  pointer-events: auto;
}
.furn-img {
  width: 100%;
  display: block;
}
.furn-emoji {
  display: block;
  text-align: center;
}
.iso-hero-3d { z-index: 2; }
.iso-hero {
  position: absolute;
  transform: translate(-50%, -100%);
  transition-property: left, top;
  transition-timing-function: linear;
  pointer-events: none;
}
</style>
