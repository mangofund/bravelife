<template>
  <view class="scene-stage" :style="{ visibility: project ? 'visible' : 'hidden' }">
    <div ref="surface" class="scene-surface"></div>
    <slot v-if="project" :project="project" />
  </view>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

const props = defineProps({
  model: { type: Object, required: true },
  kind: { type: String, required: true }
})
const emit = defineEmits(['pick', 'ready', 'failure'])
const surface = ref(null)
const project = shallowRef(null)
let view, canvas, observer, build
let frame = 0
let dirty = true
let active = true

function fail() {
  project.value = null
  emit('failure')
}

function schedule() {
  if (!active || !view || frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    try {
      const { clientWidth, clientHeight } = surface.value
      if (!clientWidth || !clientHeight) return
      if (dirty) {
        view.setModel(build(props.model))
        dirty = false
      }
      if (view.draw(clientWidth, clientHeight)) {
        const first = !project.value
        project.value = (x, height, z) => view.project(x, height, z)
        if (first) emit('ready')
      }
    } catch {
      fail()
    }
  })
}

function onClick(event) {
  const hit = view.pick(event)
  if (hit !== undefined) emit('pick', hit)
}

watch(() => props.model, () => {
  dirty = true
  schedule()
})

onMounted(async () => {
  try {
    const { createSceneView, buildRoom, buildGarden } = await import('../../game/scene3d/index.js')
    if (!active) return
    build = props.kind === 'room' ? buildRoom : buildGarden
    canvas = document.createElement('canvas')
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y'
    canvas.addEventListener('click', onClick)
    surface.value.appendChild(canvas)
    view = createSceneView(canvas, fail)
    observer = new ResizeObserver(schedule)
    observer.observe(surface.value)
    schedule()
  } catch {
    if (active) fail()
  }
})

onBeforeUnmount(() => {
  active = false
  if (frame) cancelAnimationFrame(frame)
  observer?.disconnect()
  canvas?.removeEventListener('click', onClick)
  view?.dispose()
})
</script>

<style scoped>
.scene-stage, .scene-surface { position: absolute; inset: 0; }
</style>
