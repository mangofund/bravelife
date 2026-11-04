<template>
  <view class="scene-stage" :style="{ visibility: project ? 'visible' : 'hidden' }">
    <div ref="surface" class="scene-surface"></div>
    <slot v-if="project" :project="project" />
  </view>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { state } from '../../game/engine/core.js'
import { ui } from '../../game/ui.js'
import { petHabitat } from '../../game/pet-behavior.js'

const props = defineProps({
  model: { type: Object, required: true },
  kind: { type: String, required: true }
})
const emit = defineEmits(['pick', 'ready', 'failure'])
const surface = ref(null)
const project = shallowRef(null)
let view, canvas, observer, build, addScenePets, updatePets
let lastDraw = 0
let lastWidth = 0, lastHeight = 0, habitatTimer
let frame = 0
let dirty = true
let active = true

function fail() {
  project.value = null
  emit('failure')
}

function schedule() {
  if (!active || !view || frame) return
  frame = requestAnimationFrame(time => {
    frame = 0
    try {
      const { clientWidth, clientHeight } = surface.value
      if (!clientWidth || !clientHeight) return
      const rebuilt = dirty
      if (rebuilt) {
        const model = build(props.model)
        view.setModel(model)
        updatePets = addScenePets(model.root, props.kind, props.model, state.garden.pets)
        dirty = false
      }
      const moving = updatePets?.(time) && ui.gameVisible && !document.hidden
      if (moving) schedule()
      if (moving && !rebuilt && project.value && clientWidth === lastWidth && clientHeight === lastHeight && time - lastDraw < 32) return
      lastDraw = time
      if (view.draw(clientWidth, clientHeight)) {
        const first = !project.value
        if (first || rebuilt || clientWidth !== lastWidth || clientHeight !== lastHeight) {
          project.value = (x, height, z) => view.project(x, height, z)
          lastWidth = clientWidth
          lastHeight = clientHeight
        }
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

watch(() => ['cat', 'dog'].map(kind => !!state.garden.pets[kind]), () => {
  dirty = true
  schedule()
})
watch(() => [ui.gameVisible, ...['cat', 'dog'].map(kind => petHabitat(kind, state.garden.pets[kind], Date.now()))], schedule)

onMounted(async () => {
  try {
    const { createSceneView, buildRoom, buildGarden, addScenePets: installPets } = await import('../../game/scene3d/index.js')
    if (!active) return
    addScenePets = installPets
    document.addEventListener('visibilitychange', schedule)
    build = props.kind === 'room' ? buildRoom : buildGarden
    canvas = document.createElement('canvas')
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y'
    canvas.addEventListener('click', onClick)
    surface.value.appendChild(canvas)
    view = createSceneView(canvas, fail)
    observer = new ResizeObserver(schedule)
    observer.observe(surface.value)
    habitatTimer = setInterval(() => {
      if (ui.gameVisible && !document.hidden && (state.garden.pets.cat || state.garden.pets.dog)) schedule()
    }, 2000)
    schedule()
  } catch {
    if (active) fail()
  }
})

onBeforeUnmount(() => {
  active = false
  if (frame) cancelAnimationFrame(frame)
  document.removeEventListener('visibilitychange', schedule)
  clearInterval(habitatTimer)
  observer?.disconnect()
  canvas?.removeEventListener('click', onClick)
  view?.dispose()
})
</script>

<style scoped>
.scene-stage, .scene-surface { position: absolute; inset: 0; }
</style>
