<template>
  <view v-for="pet in residents" :key="pet.kind" class="pet-resident" :style="styleFor(pet)" :data-pet="pet.kind" :data-action="pet.action">
    <button v-if="pet.action === 'greet'" class="pet-bubble pet-hug" @tap.stop="hugPet(pet.kind)">♡ 抱抱</button>
    <text v-else-if="bubble(pet)" class="pet-bubble">{{ bubble(pet) }}</text>
    <pet-actor :kind="pet.kind" :action="PET_CLIPS[pet.action] || pet.action" :activity="pet.action" :facing="pet.facing" :size="environment === 'room' ? 60 : 54" />
  </view>
</template>
<script setup>
import { computed, reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import PetActor from './pet-actor.vue'
import { state } from '../../game/engine/core.js'
import { ui } from '../../game/ui.js'
import { playPetCall } from '../../game/audio.js'
import { hugPet } from '../../game/engine/garden.js'
import { petCare, homeVisit } from '../../game/pet-care.js'
import { PET_ROUTINES, PET_CLIPS, petHabitat, petResting, nextPetSpot, petMealAction, petMealPending } from '../../game/pet-behavior.js'

const props = defineProps({ environment: { type: String, required: true }, points: { type: Array, required: true }, owner: Object })
const STEP = 2400
const now = ref(Date.now())
const motion = reactive({ cat: {}, dog: {} })

function priorities(pet, time) {
  if (state.location !== 'home') return {}
  const care = petCare(pet)
  return { care, greeting: care.visit !== homeVisit.value, meal: petMealAction(pet, care, time) }
}

const residents = computed(() => ['dog', 'cat'].flatMap(kind => {
  const pet = state.garden.pets[kind]
  if (!pet || !props.points.length) return []
  const care = petCare(pet)
  const time = now.value
  const needsRoom = state.location === 'home' && (
    care.visit !== homeVisit.value || petMealPending(pet, care, time) || pet.fedUntil <= time || time < care.holdUntil
  )
  const habitat = needsRoom ? 'room' : petHabitat(kind, pet, time, Math.floor(time / STEP))
  if (habitat !== props.environment) return []
  const move = motion[kind]
  const spot = props.points.find(p => p.id === move.id) || props.points[kind === 'cat' ? props.points.length - 1 : 0]
  return [{ kind, spot, action: move.action || 'idle', facing: move.facing || 1, moving: move.moving }]
}))

function bubble(pet) {
  if (pet.action === 'call') return pet.kind === 'cat' ? '喵喵！饿了' : '汪汪！饿了'
  if (pet.action === 'sun') return '☀️'
  if (pet.action === 'toilet') return '如厕'
  return ''
}
function styleFor(pet) {
  return { left: pet.spot.left, top: pet.spot.top, zIndex: pet.spot.z, transitionDuration: pet.moving ? '1.4s' : '0s' }
}

function step() {
  if (!ui.gameVisible) return
  now.value = Date.now()
  const time = now.value
  const turn = Math.floor(time / STEP)
  for (const { kind, spot, facing } of residents.value) {
    const pet = state.garden.pets[kind]
    const move = motion[kind]
    const routine = PET_ROUTINES[kind]
    const { care, greeting, meal } = props.environment === 'room' ? priorities(pet, time) : {}
    const hungry = care && pet.fedUntil <= time
    const calling = hungry && time >= care.nextCall
    let action = greeting ? 'greet' : meal || (calling ? 'call' : petResting(pet, time) ? 'sleep' : routine[turn % routine.length])
    if (action === 'sun' && (props.environment !== 'garden' || state.hour < 6 || state.hour >= 18)) action = 'sleep'
    const owner = props.owner
    const goal = ['greet', 'call'].includes(action) && owner
      ? p => Math.abs(p.x - owner.x) + Math.abs(p.y - owner.y) === 1
      : p => p.pet === kind && p.activity === action
    const next = props.points.some(goal)
      ? nextPetSpot(props.points, spot.id, 0, move.previous, goal)
      : ['run', 'jump'].includes(action)
        ? nextPetSpot(props.points, spot.id, Math.floor(Math.random() * 12), move.previous)
        : spot
    const atGoal = goal(spot)
    if (next !== spot && !['run', 'jump'].includes(action)) action = 'run'
    else if (greeting) {
      if (move.action === 'greet') care.visit = homeVisit.value
      care.holdUntil = time + STEP
    } else if (meal) {
      care.stage++
      care.holdUntil = time + STEP
    } else if (action === 'call') {
      care.nextCall = time + 30000
      playPetCall(kind)
    }
    if (!atGoal && action === 'toilet') action = kind === 'cat' ? 'groom' : 'sniff'
    if (!atGoal && action === 'play') action = 'jump'
    const ownerSpot = action === 'greet' && owner && props.points.find(p => p.x === owner.x && p.y === owner.y)
    const delta = parseFloat((ownerSpot || next).left) - parseFloat(spot.left)
    motion[kind] = { id: next.id, previous: next === spot ? move.previous : spot.id, facing: delta ? Math.sign(delta) : facing, action, moving: next !== spot }
  }
}

let timer
onMounted(() => { step(); timer = setInterval(step, STEP) })
onBeforeUnmount(() => clearInterval(timer))
</script>
<style>
.pet-resident{position:absolute;transform:translate(-50%,-93%);transition-property:left,top;transition-timing-function:linear;pointer-events:none}
.pet-bubble{position:absolute;z-index:1;bottom:86%;left:50%;transform:translateX(-50%);white-space:nowrap;background:#fff4d9;color:#654535;border-radius:10px;padding:2px 6px;font-size:11px}
.pet-hug{margin:0;border:0;line-height:1.35;pointer-events:auto}.pet-hug::after{border:0}
</style>
