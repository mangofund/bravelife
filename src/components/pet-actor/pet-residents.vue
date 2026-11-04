<template>
  <view v-for="pet in residents" :key="pet.kind" class="pet-resident" :style="styleFor(pet)" :data-pet="pet.kind" :data-action="pet.action">
    <text v-if="pet.action === 'sun'" class="pet-sun">☀️</text>
    <pet-actor :kind="pet.kind" :action="pet.kind === 'cat' && pet.action === 'toilet' ? 'groom' : PET_CLIPS[pet.action] || pet.action" :activity="pet.action" :facing="pet.facing" :size="environment === 'room' ? 60 : 54" />
  </view>
</template>
<script setup>
import { computed, reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import PetActor from './pet-actor.vue'
import { state } from '../../game/engine/core.js'
import { ui } from '../../game/ui.js'
import { PET_ROUTINES, PET_CLIPS, petHabitat, petResting, nextPetSpot } from '../../game/pet-behavior.js'

const props = defineProps({ environment: { type: String, required: true }, points: { type: Array, required: true } })
const STEP = 2400
const now = ref(Date.now())
const motion = reactive({ cat: {}, dog: {} })
const residents = computed(() => ['dog', 'cat'].flatMap(kind => {
  const pet = state.garden.pets[kind]
  const turn = Math.floor(now.value / STEP)
  if (!pet || petHabitat(kind, pet, now.value, turn) !== props.environment || !props.points.length) return []
  const move = motion[kind]
  const spot = props.points.find(p => p.id === move.id) || props.points[kind === 'cat' ? props.points.length - 1 : 0]
  return [{ kind, spot, action: move.action || 'idle', facing: move.facing || 1, moving: move.moving }]
}))

function styleFor(pet) {
  return { left: pet.spot.left, top: pet.spot.top, zIndex: pet.spot.z, transitionDuration: pet.moving ? '1.4s' : '0s' }
}

function step() {
  if (!ui.gameVisible) return
  now.value = Date.now()
  const turn = Math.floor(now.value / STEP)
  for (const pet of residents.value) {
    const { kind, spot } = pet
    const move = motion[kind]
    const routine = PET_ROUTINES[kind]
    const visit = Math.floor(turn / routine.length)
    let action = petResting(state.garden.pets[kind], now.value)
      ? 'sleep'
      : (move.visit === visit && move.pending) || routine[turn % routine.length]
    if (action === 'sun' && (props.environment !== 'garden' || state.hour < 6 || state.hour >= 18)) action = 'sleep'
    const seeking = ['sleep', 'play', 'toilet'].includes(action) && props.points.some(p => p.pet === kind && p.activity === action)
    const goal = seeking ? p => p.pet === kind && p.activity === action : null
    const next = goal || ['run', 'jump'].includes(action)
      ? nextPetSpot(props.points, spot.id, Math.floor(Math.random() * 12), move.previous, goal)
      : spot
    const pending = goal && !goal(spot) && next !== spot ? action : null
    if (pending) action = 'run'
    if (action === 'toilet' && (!goal || !goal(spot))) action = kind === 'cat' ? 'groom' : 'sniff'
    const delta = parseFloat(next.left) - parseFloat(spot.left)
    motion[kind] = { visit, pending, id: next.id, previous: next === spot ? move.previous : spot.id, facing: delta ? Math.sign(delta) : pet.facing, action, moving: next !== spot }
  }
}

let timer
onMounted(() => { step(); timer = setInterval(step, STEP) })
onBeforeUnmount(() => clearInterval(timer))
</script>
<style>
.pet-resident{position:absolute;transform:translate(-50%,-93%);transition-property:left,top;transition-timing-function:linear;pointer-events:none}
.pet-sun{position:absolute;right:0;top:3px;font-size:16px;opacity:.9}
</style>
