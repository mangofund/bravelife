<template>
  <view class="scene-stage"  :class="{ 'scene-loading': !ready }">
    <!-- #ifdef H5 -->
    <div ref="surface" class="scene-surface"></div>
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN -->
    <canvas id="scene-native" type="webgl" class="scene-surface" @tap.stop="onTap" @error="fail" />
    <!-- #endif -->
  </view>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { state } from '../../game/engine/core.js'
import { ui } from '../../game/ui.js'
// #ifdef MP-WEIXIN
import { getCurrentInstance } from 'vue'
import { createSceneView, buildRoom, buildGarden, addScenePets as installPets } from '../../game/scene3d/index.js'
// #endif
import { petHabitat } from '../../game/pet-behavior.js'

const props = defineProps({
  model: { type: Object, required: true },
  kind: { type: String, required: true },
  anchors: { type: Array, required: true }
})
const emit = defineEmits(['pick', 'ready', 'failure', 'projected'])
const surface = ref(null)
const ready = ref(false)
// #ifdef MP-WEIXIN
const instance = getCurrentInstance()
let nativeSize = {}
function measureNative(withNode = false) {
  return new Promise(resolve => {
    uni.createSelectorQuery().in(instance.proxy).select('#scene-native')
      .fields({ node: withNode, size: true, rect: true }).exec(result => resolve(result?.[0]))
  })
}
async function resizeNative() {
  const size = await measureNative()
  if (!active || !size) return
  nativeSize = size
  schedule()
}
watch(() => [ui.width, ui.height], () => nextTick(resizeNative))
// #endif
function dimensions() {
  // #ifdef H5
  return { width: surface.value.clientWidth, height: surface.value.clientHeight }
  // #endif
  // #ifdef MP-WEIXIN
  return nativeSize
  // #endif
}
function visible() {
  // #ifdef H5
  if (document.hidden) return false
  // #endif
  return ui.gameVisible
}
function requestFrame(callback) {
  // #ifdef H5
  return requestAnimationFrame(callback)
  // #endif
  // #ifdef MP-WEIXIN
  return canvas.requestAnimationFrame(callback)
  // #endif
}
function cancelFrame(id) {
  // #ifdef H5
  cancelAnimationFrame(id)
  // #endif
  // #ifdef MP-WEIXIN
  canvas.cancelAnimationFrame(id)
  // #endif
}
function projectAnchors() {
  emit('projected', props.anchors.map(point => view.project(...point)))
}
watch(() => props.anchors, () => { if (ready.value) projectAnchors() })
let view, canvas, observer, build, addScenePets, updatePets
let lastDraw = 0
let lastWidth = 0, lastHeight = 0, habitatTimer
let frame = 0
let dirty = true
let active = true

function fail() {
  if (!active) return
  ready.value = false
  emit('failure')
}

function schedule() {
  if (!active || !view || frame) return
  frame = requestFrame(time => {
    frame = 0
    try {
      const { width: clientWidth, height: clientHeight } = dimensions()
      if (!clientWidth || !clientHeight) return
      const rebuilt = dirty
      if (rebuilt) {
        const model = build(props.model)
        view.setModel(model)
        updatePets = addScenePets(model.root, props.kind, props.model, state.garden.pets)
        dirty = false
      }
      const moving = updatePets?.(time) && visible()
      if (moving) schedule()
      if (moving && !rebuilt && ready.value && clientWidth === lastWidth && clientHeight === lastHeight && time - lastDraw < 32) return
      lastDraw = time
      if (view.draw(clientWidth, clientHeight)) {
        const first = !ready.value
        if (first || rebuilt || clientWidth !== lastWidth || clientHeight !== lastHeight) {
          projectAnchors()
          lastWidth = clientWidth
          lastHeight = clientHeight
        }
        if (first) {
          ready.value = true
          emit('ready')
          // #ifdef MP-WEIXIN
          nextTick(resizeNative)
          // #endif
        }
      }
    } catch {
      fail()
    }
  })
}

function pick(clientX, clientY, rect) {
  if (!ready.value || !rect?.width || !rect.height) return
  const hit = view.pick((clientX - rect.left) / rect.width, (clientY - rect.top) / rect.height)
  if (hit !== undefined) emit('pick', hit)
}
// #ifdef H5
function onClick(event) {
  pick(event.clientX, event.clientY, canvas.getBoundingClientRect())
}
// #endif
// #ifdef MP-WEIXIN
async function onTap(event) {
  const touch = event.changedTouches?.[0]
  const x = touch?.clientX ?? event.detail?.x
  const y = touch?.clientY ?? event.detail?.y
  const rect = await measureNative()
  if (active) pick(x, y, rect)
}
// #endif

watch(() => props.model, () => {
  dirty = true
  schedule()
})

watch(() => ['cat', 'dog'].map(kind => !!state.garden.pets[kind]), () => {
  dirty = true
  schedule()
})
watch(() => [ui.gameVisible, ...['cat', 'dog'].map(kind => petHabitat(kind, state.garden.pets[kind], Date.now()))], schedule)

onMounted(async () => {
  try {
    // #ifdef H5
    const { createSceneView, buildRoom, buildGarden, addScenePets: installPets } = await import('../../game/scene3d/index.js')
    if (!active) return
    addScenePets = installPets
    document.addEventListener('visibilitychange', schedule)
    build = props.kind === 'room' ? buildRoom : buildGarden
    canvas = document.createElement('canvas')
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y'
    canvas.addEventListener('click', onClick)
    surface.value.appendChild(canvas)
    view = createSceneView(canvas, fail, { pixelRatio: window.devicePixelRatio || 1 })
    observer = new ResizeObserver(schedule)
    observer.observe(surface.value)
    // #endif
    // #ifdef MP-WEIXIN
    await nextTick()
    const measured = await measureNative(true)
    if (!active) return
    canvas = measured?.node
    if (!canvas || !measured.width || !measured.height) throw new Error('Native canvas unavailable')
    nativeSize = measured
    addScenePets = installPets
    build = props.kind === 'room' ? buildRoom : buildGarden
    view = createSceneView(canvas, fail, {
      native: true, pixelRatio: wx.getWindowInfo?.().pixelRatio || 1
    })
    // #endif
    habitatTimer = setInterval(() => {
      if (visible() && (state.garden.pets.cat || state.garden.pets.dog)) schedule()
    }, 2000)
    schedule()
  } catch {
    if (active) fail()
  }
})

onBeforeUnmount(() => {
  active = false
  if (frame) cancelFrame(frame)
  // #ifdef H5
  document.removeEventListener('visibilitychange', schedule)
  observer?.disconnect()
  canvas?.removeEventListener('click', onClick)
  // #endif
  clearInterval(habitatTimer)
  view?.dispose()
})
</script>

<style scoped>
.scene-stage, .scene-surface { position: absolute; inset: 0; width: 100%; height: 100%; }
.scene-loading { opacity: 0; pointer-events: none; }
</style>
