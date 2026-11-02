<template>
  <view class="avatar" :style="{ width: size + 'rpx', height: size + 'rpx', borderColor: hairColor, background: skinColor }">
    <text class="face" :style="{ fontSize: size * 0.55 + 'rpx' }">{{ face }}</text>
    <view class="badge" :style="{ width: size * 0.4 + 'rpx', height: size * 0.4 + 'rpx' }">
      <text :style="{ fontSize: size * 0.24 + 'rpx' }">{{ outfit }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { GENDERS, SKINS, HAIRS, OUTFITS } from '../../game/data/profile.js'

const props = defineProps({
  profile: { type: Object, default: null },
  size: { type: Number, default: 120 }
})

function pick(list, id) {
  return list.filter((x) => x.id === id)[0] || list[0]
}

const face = computed(() => {
  const p = props.profile || {}
  return pick(GENDERS, p.gender).emoji + pick(SKINS, p.skin).tone
})
const skinColor = computed(() => pick(SKINS, (props.profile || {}).skin).color)
const hairColor = computed(() => pick(HAIRS, (props.profile || {}).hair).color)
const outfit = computed(() => pick(OUTFITS, (props.profile || {}).outfit).emoji)
</script>

<style>
.avatar {
  position: relative;
  border-radius: 50%;
  border-style: solid;
  border-width: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;
}
.face {
  line-height: 1;
}
.badge {
  position: absolute;
  right: -8rpx;
  bottom: -8rpx;
  border-radius: 50%;
  background: var(--card);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}
</style>
