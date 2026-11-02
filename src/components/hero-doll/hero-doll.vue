<template>
  <view class="doll" :class="['pose-' + pose, 'hair-' + hairId, 'outfit-' + outfitId]" :style="boxStyle">
    <view class="flip" :style="{ transform: 'scaleX(' + facing + ')' }">
      <view class="shadow" />
      <view class="anim">
      <view class="hair-back" :style="{ background: hairColor }" />
      <view class="leg leg-l" :style="{ background: legColor }"><view class="shoe" /></view>
      <view class="leg leg-r" :style="{ background: legColor }"><view class="shoe" /></view>
      <view class="arm arm-r" :style="{ background: sleeveColor }"><view class="hand" :style="{ background: skinColor }" /></view>
      <view class="body" :style="{ background: bodyColor }">
        <view v-if="outfitId === 'suit'" class="shirt"><view class="tie" /></view>
        <view v-if="outfitId === 'kimono'" class="obi" />
        <view v-if="outfitId === 'sport'" class="stripe" />
        <view v-if="outfitId === 'jacket'" class="zip" />
      </view>
      <view class="arm arm-l" :style="{ background: sleeveColor }"><view class="hand" :style="{ background: skinColor }" /></view>
      <view class="head" :style="{ background: skinColor }">
        <view class="eye eye-l" />
        <view class="eye eye-r" />
        <view class="blush blush-l" />
        <view class="blush blush-r" />
        <view class="mouth" />
      </view>
      <view class="hair-front" :style="{ background: hairColor }" />
      <view v-if="hairId === 'blonde'" class="curl curl-l" :style="{ background: hairColor }" />
      <view v-if="hairId === 'blonde'" class="curl curl-r" :style="{ background: hairColor }" />
      </view>
    </view>
    <text v-if="pose === 'sleep'" class="fx zzz">💤</text>
    <text v-if="pose === 'cook'" class="fx sparkle">✨</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { SKINS, HAIRS } from '../../game/data/profile.js'

const props = defineProps({
  profile: { type: Object, default: null },
  size: { type: Number, default: 140 },
  pose: { type: String, default: 'idle' },
  facing: { type: Number, default: 1 }
})

// 服装配色：身体、袖子、腿
const OUTFIT_COLORS = {
  suit: ['#2f3a56', '#2f3a56', '#2f3a56'],
  dress: ['#e8829a', '#f7d9c4', 'skin'],
  tee: ['#f2c14e', 'skin', '#4d6aa8'],
  jacket: ['#7a8b4e', '#7a8b4e', '#3b3b4f'],
  kimono: ['#5b7fb5', '#5b7fb5', '#f3efe6'],
  sport: ['#d9483b', '#d9483b', '#2f3a56']
}

function pick(list, id) {
  return list.filter((x) => x.id === id)[0] || list[0]
}

const p = computed(() => props.profile || {})
const hairId = computed(() => pick(HAIRS, p.value.hair).id)
const outfitId = computed(() => (OUTFIT_COLORS[p.value.outfit] ? p.value.outfit : 'tee'))
const skinColor = computed(() => pick(SKINS, p.value.skin).color)
const hairColor = computed(() => pick(HAIRS, p.value.hair).color)
const colors = computed(() => OUTFIT_COLORS[outfitId.value].map((c) => (c === 'skin' ? skinColor.value : c)))
const bodyColor = computed(() => colors.value[0])
const sleeveColor = computed(() => colors.value[1])
const legColor = computed(() => colors.value[2])
const boxStyle = computed(() => ({ width: props.size * 0.62 + 'rpx', height: props.size + 'rpx' }))
</script>

<style>
.doll {
  position: relative;
}
.doll .flip,
.doll .anim {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
.doll view {
  box-sizing: border-box;
}
.doll .shadow {
  position: absolute;
  left: 14%;
  bottom: -2%;
  width: 72%;
  height: 7%;
  border-radius: 50%;
  background: rgba(40, 30, 20, 0.18);
}
.doll .head {
  position: absolute;
  left: 14%;
  top: 2%;
  width: 72%;
  height: 40%;
  border-radius: 48% 52% 46% 54% / 52% 50% 50% 48%;
  border: 3rpx solid #3a2f27;
  z-index: 4;
}
.doll .eye {
  position: absolute;
  top: 50%;
  width: 11%;
  height: 15%;
  border-radius: 50%;
  background: #2b221c;
}
.doll .eye-l {
  left: 28%;
}
.doll .eye-r {
  left: 60%;
}
.doll .blush {
  position: absolute;
  top: 66%;
  width: 16%;
  height: 9%;
  border-radius: 50%;
  background: rgba(232, 110, 120, 0.45);
}
.doll .blush-l {
  left: 14%;
}
.doll .blush-r {
  left: 70%;
}
.doll .mouth {
  position: absolute;
  left: 44%;
  top: 72%;
  width: 14%;
  height: 8%;
  border-bottom: 3rpx solid #3a2f27;
  border-radius: 0 0 50% 50%;
}
.doll .hair-front {
  position: absolute;
  left: 11%;
  top: 0;
  width: 78%;
  height: 20%;
  border-radius: 50% 50% 30% 40% / 80% 80% 30% 30%;
  border: 3rpx solid #3a2f27;
  z-index: 5;
}
.doll .hair-back {
  position: absolute;
  left: 12%;
  top: 6%;
  width: 76%;
  height: 0;
  border-radius: 40%;
  border: 3rpx solid #3a2f27;
  z-index: 1;
}
.doll.hair-brown .hair-back {
  height: 56%;
}
.doll.hair-pink .hair-back {
  height: 40%;
  left: 8%;
  width: 84%;
  border-radius: 40% 40% 20% 20%;
}
.doll.hair-blue .hair-back {
  height: 48%;
  left: 30%;
  width: 40%;
}
.doll.hair-silver .hair-front {
  height: 13%;
  left: 16%;
  width: 68%;
}
.doll .curl {
  position: absolute;
  top: 10%;
  width: 22%;
  height: 22%;
  border-radius: 50%;
  border: 3rpx solid #3a2f27;
  z-index: 3;
}
.doll .curl-l {
  left: 2%;
}
.doll .curl-r {
  right: 2%;
}
.doll .body {
  position: absolute;
  left: 22%;
  top: 40%;
  width: 56%;
  height: 32%;
  border-radius: 30% 30% 18% 18%;
  border: 3rpx solid #3a2f27;
  z-index: 3;
  overflow: hidden;
}
.doll.outfit-dress .body {
  left: 14%;
  width: 72%;
  border-radius: 40% 40% 10% 10% / 50% 50% 10% 10%;
}
.doll.outfit-kimono .body {
  height: 48%;
  border-radius: 26% 26% 12% 12%;
}
.doll .shirt {
  position: absolute;
  left: 36%;
  top: 0;
  width: 28%;
  height: 60%;
  background: #f7f3ea;
  border-radius: 0 0 50% 50%;
}
.doll .tie {
  position: absolute;
  left: 32%;
  top: 10%;
  width: 36%;
  height: 80%;
  background: #c8402f;
  border-radius: 20% 20% 50% 50%;
}
.doll .obi {
  position: absolute;
  left: 0;
  top: 34%;
  width: 100%;
  height: 18%;
  background: #e2b74a;
}
.doll .stripe {
  position: absolute;
  left: 0;
  top: 40%;
  width: 100%;
  height: 14%;
  background: #fff;
}
.doll .zip {
  position: absolute;
  left: 48%;
  top: 0;
  width: 4%;
  height: 100%;
  background: #3a2f27;
}
.doll .arm {
  position: absolute;
  top: 42%;
  width: 15%;
  height: 26%;
  border-radius: 40%;
  border: 3rpx solid #3a2f27;
  transform-origin: 50% 8%;
}
.doll .arm-l {
  left: 12%;
  z-index: 4;
}
.doll .arm-r {
  right: 12%;
  z-index: 2;
}
.doll .hand {
  position: absolute;
  left: 4%;
  bottom: -14%;
  width: 92%;
  height: 30%;
  border-radius: 50%;
  border: 3rpx solid #3a2f27;
}
.doll .leg {
  position: absolute;
  top: 68%;
  width: 17%;
  height: 26%;
  border-radius: 30% 30% 20% 20%;
  border: 3rpx solid #3a2f27;
  transform-origin: 50% 0;
  z-index: 2;
}
.doll .leg-l {
  left: 30%;
}
.doll .leg-r {
  left: 53%;
}
.doll .shoe {
  position: absolute;
  left: -14%;
  bottom: -12%;
  width: 136%;
  height: 26%;
  border-radius: 50% 60% 30% 30%;
  background: #3a2f27;
}

/* 走路：腿和手臂交替摆动，身体上下起伏 */
.doll.pose-walk .anim {
  animation: doll-bob 0.5s ease-in-out infinite;
}
.doll.pose-walk .leg-l,
.doll.pose-walk .arm-r {
  animation: doll-swing 0.5s ease-in-out infinite;
}
.doll.pose-walk .leg-r,
.doll.pose-walk .arm-l {
  animation: doll-swing 0.5s ease-in-out infinite reverse;
}
.doll.pose-idle .anim {
  animation: doll-breathe 2.4s ease-in-out infinite;
}
.doll.pose-cook .arm-l,
.doll.pose-cook .arm-r {
  animation: doll-stir 0.4s ease-in-out infinite;
}
.doll.pose-sleep .anim {
  transform-origin: 50% 75%;
  transform: rotate(-80deg);
}
.doll.pose-sleep .eye {
  height: 4%;
  border-radius: 0;
}
.doll .fx {
  position: absolute;
  right: -30%;
  top: -10%;
  font-size: 36rpx;
  animation: doll-float 1.6s ease-in-out infinite;
}
@keyframes doll-swing {
  0% { transform: rotate(22deg); }
  50% { transform: rotate(-22deg); }
  100% { transform: rotate(22deg); }
}
@keyframes doll-bob {
  0% { transform: translateY(0); }
  50% { transform: translateY(-4%); }
  100% { transform: translateY(0); }
}
@keyframes doll-breathe {
  0% { transform: translateY(0); }
  50% { transform: translateY(-1.5%); }
  100% { transform: translateY(0); }
}
@keyframes doll-stir {
  0% { transform: rotate(-30deg); }
  50% { transform: rotate(-60deg); }
  100% { transform: rotate(-30deg); }
}
@keyframes doll-float {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-40rpx); opacity: 0; }
}
</style>
