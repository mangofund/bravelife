import { reactive, ref, watch } from 'vue'
import { state } from './engine/core.js'

const sessions = new WeakMap()
export const homeVisit = ref(0)
watch(() => state.location, (location, previous) => {
  if (location === 'home' && previous !== 'home') homeVisit.value++
}, { flush: 'sync' })

export function petCare(pet) {
  if (!sessions.has(pet)) sessions.set(pet, reactive({
    visit: 0, meal: 0, stage: 0, activities: [], nextCall: 0, holdUntil: 0
  }))
  return sessions.get(pet)
}
