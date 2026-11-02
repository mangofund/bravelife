<template>
  <view class="create theme-root" :class="'theme-' + settings.theme">
    <view class="steps">
      <text v-for="(s, i) in STEPS" :key="s" class="step" :class="{ on: i <= step }">{{ i + 1 }}. {{ s }}</text>
    </view>

    <view v-if="step === 0">
      <view class="preview">
        <view class="row preview-row">
          <avatar-card :profile="form" :size="180" />
          <hero-doll :profile="form" :size="220" pose="walk" />
        </view>
        <input class="name" v-model="form.name" maxlength="8" placeholder="输入你的名字" />
      </view>
      <view class="card">
        <view class="section-title">性别</view>
        <view class="opts">
          <view v-for="g in GENDERS" :key="g.id" class="opt" :class="{ on: form.gender === g.id }" @click="form.gender = g.id">{{ g.emoji }} {{ g.name }}</view>
        </view>
        <view class="section-title">肤色</view>
        <view class="opts">
          <view v-for="s in SKINS" :key="s.id" class="dot" :class="{ on: form.skin === s.id }" :style="{ background: s.color }" @click="form.skin = s.id" />
        </view>
        <view class="section-title">发型</view>
        <view class="opts">
          <view v-for="h in HAIRS" :key="h.id" class="opt" :class="{ on: form.hair === h.id }" @click="form.hair = h.id">
            <view class="swatch" :style="{ background: h.color }" />{{ h.name }}
          </view>
        </view>
        <view class="section-title">服装</view>
        <view class="opts">
          <view v-for="o in OUTFITS" :key="o.id" class="opt" :class="{ on: form.outfit === o.id }" @click="form.outfit = o.id">{{ o.emoji }} {{ o.name }}</view>
        </view>
      </view>
    </view>

    <view v-if="step === 1">
      <view class="hint">你是带着怎样的背景来到东京的？</view>
      <view v-for="b in BACKGROUNDS" :key="b.id" class="card pick" :class="{ on: form.background === b.id }" @click="form.background = b.id">
        <view class="row between">
          <text class="pick-title">{{ b.icon }} {{ b.name }}</text>
          <text class="money">{{ fmtMoney(b.money) }}</text>
        </view>
        <text class="muted">{{ b.desc }}</text>
      </view>
    </view>

    <view v-if="step === 2">
      <view class="hint">你的人生愿望是什么？达成后会有特别结局提示。</view>
      <view v-for="w in WISHES" :key="w.id" class="card pick" :class="{ on: form.wish === w.id }" @click="form.wish = w.id">
        <text class="pick-title">{{ w.icon }} {{ w.name }}</text>
        <text class="muted">{{ w.desc }}</text>
      </view>
    </view>

    <view class="bar">
      <view class="btn ghost" @click="prev">{{ step === 0 ? '返回' : '上一步' }}</view>
      <view class="btn" @click="next">{{ step === 2 ? '开始勇敢人生' : '下一步' }}</view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import AvatarCard from '../../components/avatar-card/avatar-card.vue'
import HeroDoll from '../../components/hero-doll/hero-doll.vue'
import { settings } from '../../game/themes.js'
import { GENDERS, SKINS, HAIRS, OUTFITS, BACKGROUNDS, WISHES } from '../../game/data/profile.js'
import { newGame, fmtMoney } from '../../game/index.js'

const STEPS = ['外观', '出身', '愿望']
const step = ref(0)
const form = reactive({
  name: '',
  gender: 'f',
  skin: 'b',
  hair: 'black',
  outfit: 'tee',
  background: 'normal',
  wish: 'rich'
})

function prev() {
  if (step.value === 0) uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  else step.value -= 1
}

function next() {
  if (step.value === 0) {
    form.name = (form.name || '').trim()
    if (!form.name) {
      uni.showToast({ title: '先给自己起个名字', icon: 'none' })
      return
    }
  }
  if (step.value < 2) {
    step.value += 1
    return
  }
  newGame(Object.assign({}, form))
  uni.reLaunch({ url: '/pages/game/game' })
}
</script>

<style>
.create {
  padding: 24rpx 24rpx 180rpx;
}
.steps {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24rpx;
}
.step {
  color: #b5aec0;
  font-weight: 600;
}
.step.on {
  color: var(--accent);
}
.preview-row {
  justify-content: center;
  gap: 40rpx;
}
.preview-row .avatar {
  margin-right: 48rpx;
}
.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0 32rpx;
}
.name {
  margin-top: 32rpx;
  width: 420rpx;
  height: 80rpx;
  background: var(--card);
  border-radius: 20rpx;
  text-align: center;
  font-size: 32rpx;
  border: 2rpx solid var(--line);
}
.opts {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 12rpx;
}
.opt {
  display: flex;
  align-items: center;
  padding: 12rpx 20rpx;
  margin: 0 12rpx 12rpx 0;
  border-radius: 16rpx;
  background: var(--paper);
  border: 2rpx solid transparent;
  font-size: 26rpx;
}
.opt.on,
.pick.on {
  border: 2rpx solid var(--accent);
  background: var(--paper-deep);
}
.dot {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  margin: 0 20rpx 12rpx 0;
  border: 4rpx solid transparent;
}
.dot.on {
  border-color: var(--accent);
}
.swatch {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  margin-right: 8rpx;
}
.hint {
  margin: 8rpx 0 24rpx;
  font-weight: 600;
}
.pick {
  display: flex;
  flex-direction: column;
  border: 2rpx solid transparent;
}
.pick-title {
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}
.money {
  color: var(--accent);
  font-weight: 700;
}
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0 auto;
  max-width: 750rpx;
  display: flex;
  padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  background: var(--paper);
  box-sizing: border-box;
}
.bar .btn {
  flex: 1;
  margin: 0 10rpx;
}
</style>
