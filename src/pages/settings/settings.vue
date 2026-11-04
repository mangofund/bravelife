<template>
  <view class="settings-page theme-root narrow" :class="'theme-' + settings.theme">
    <view class="card">
      <view class="section-title">声音</view>
      <sound-setting />
      <text class="muted block">开启时会播放一声试听，选择保存在当前设备。</text>
    </view>

    <view class="card">
      <view class="section-title">画风</view>
      <button v-for="theme in THEMES" :key="theme.id" class="btn ghost option" @click="setTheme(theme.id)">
        {{ theme.icon }} {{ theme.name }}{{ settings.theme === theme.id ? ' · 使用中' : '' }}
      </button>
    </view>

    <view class="card">
      <view class="section-title">游戏时间</view>
      <text class="muted block">调整游戏时钟的流逝速度。</text>
      <view class="speed-options">
        <button v-for="speed in SPEEDS" :key="speed" class="btn option" :class="{ ghost: settings.speed !== speed }" @click="setSpeed(speed)">
          {{ speed === 0 ? '暂停' : speed + '×' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import SoundSetting from '../../components/sound-setting.vue'
import { THEMES, SPEEDS, settings, setTheme, setSpeed } from '../../game/themes.js'
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 28rpx;
}
.option {
  margin: 16rpx 0 0;
  line-height: 1.4;
}
.speed-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.speed-options .option {
  flex: 1;
  min-width: 100rpx;
}
</style>
