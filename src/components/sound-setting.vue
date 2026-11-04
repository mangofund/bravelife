<template>
  <view class="row between"><text>游戏音效</text><switch :checked="!soundMuted" aria-label="游戏音效" @change="changeSound" /></view>
</template>

<script setup>
import { ref } from 'vue'
import { isMuted, setMuted, play } from '../game/audio.js'

const soundMuted = ref(isMuted())
function changeSound(event) {
  soundMuted.value = setMuted(!event.detail.value)
  if (!soundMuted.value) play('toggle')
}
</script>
