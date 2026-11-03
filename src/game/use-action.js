import { ref, onBeforeUnmount } from 'vue'
export function useAction() {
  const busy = ref(false)
  let timer
  function run(action) {
    if (busy.value) return false
    busy.value = true
    try { return action() } finally { timer = setTimeout(() => { busy.value = false }, 350) }
  }
  onBeforeUnmount(() => clearTimeout(timer))
  return { busy, run }
}
