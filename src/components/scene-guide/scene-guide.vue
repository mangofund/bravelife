<template>
  <view v-if="guide" class="scene-guide" @click.stop>
    <view v-if="expanded" class="scene-guide-bubble">
      <view class="scene-guide-copy"><text class="scene-guide-title">{{ guide.title }}</text><text>{{ guide.text }}</text></view>
      <button aria-label="收起操作引导" @click="dismiss">知道了</button>
    </view>
    <button v-else class="scene-guide-reopen" @click="expanded = true">💡 操作提示</button>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { SCENE_GUIDES } from '../../game/data/scene-guides.js'
const props = defineProps({ scene: { type: String, required: true } })
const expanded = ref(true)
const guide = computed(() => SCENE_GUIDES[props.scene] || (props.scene.startsWith('location:') ? SCENE_GUIDES.location : null))
const storageKey = () => 'bravelife:scene-guide:v1:' + props.scene
watch(() => props.scene, () => {
  try { expanded.value = !uni.getStorageSync(storageKey()) } catch { expanded.value = true }
}, { immediate: true })
function dismiss() {
  expanded.value = false
  try { uni.setStorageSync(storageKey(), true) } catch { /* Still dismiss for this visit when storage is unavailable. */ }
}
</script>

<style>
.scene-guide { flex-shrink: 0; padding: 6px 12px; color: var(--ink); background: var(--paper); }
.scene-guide-bubble { display: flex; gap: 10px; align-items: center; border: 1px solid var(--line); border-radius: 12px 12px 12px 3px; background: var(--card); padding: 10px 12px; }
.scene-guide-copy { flex: 1; min-width: 0; font-size: 14px; line-height: 1.5; }
.scene-guide-copy text { display: block; }
.scene-guide-title { font-weight: 700; font-size: 16px; margin-bottom: 3px; }
.scene-guide button { flex-shrink: 0; margin: 0; min-height: 44px; padding: 8px 12px; font-size: 14px; line-height: 1.4; color: var(--ink); background: var(--paper-deep); border-radius: 8px; }
.scene-guide-reopen { width: fit-content; }
@media (max-height: 560px) { .scene-guide { max-height: 26vh; overflow-y: auto; } }
</style>
