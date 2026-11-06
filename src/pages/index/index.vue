<template>
  <view class="title-page theme-root narrow" :class="'theme-' + settings.theme">
    <image v-if="!artFailed" class="cover" :src="art('title')" mode="aspectFill" @error="artFailed = true" />
    <view v-else class="cover cover-fallback"><text class="skyline">🏯🏢🗼🌆⛩️</text></view>

    <view class="logo card">
      <text class="logo-cn">勇敢人生</text>
      <text class="logo-en">BRAVELIFE</text>
      <text class="tag">在东京打工、交朋友、装修、买房、竞选知事，过你想要的人生</text>
    </view>

    <view class="actions">
      <view v-if="saved" class="btn" @click="onContinue">继续人生</view>
      <view class="btn" :class="{ ghost: saved }" @click="onNew">开始新的人生</view>
      <!-- #ifdef H5 || MP-WEIXIN -->
      <navigator class="btn ghost" url="/pages/settings/settings">设置</navigator>
      <!-- #endif -->
      <!-- #ifndef H5 || MP-WEIXIN -->
      <view class="themes">
        <view v-for="t in THEMES" :key="t.id" class="theme-chip" :class="{ on: settings.theme === t.id }" @click="onTheme(t.id)">
          {{ t.icon }} {{ t.name }}
        </view>
      </view>
      <!-- #endif -->
      <!-- #ifdef H5 || MP-WEIXIN -->
      <view class="btn ghost" @click="goAccount">{{ account.user ? displayName(account.user) : '登录 / 注册' }}</view>
      <view class="support-row">
        <!-- #ifdef H5 -->
        <a class="support-link" href="/guide.html">游戏介绍与存档说明</a>
        <!-- #endif -->
        <navigator class="support-link" url="/pages/feedback/feedback">
          <text class="support-icon" aria-hidden="true">🎧</text>
          <text>用户反馈</text>
        </navigator>
      </view>
      <!-- #endif -->
      <!-- #ifndef H5 || MP-WEIXIN -->
      <view class="btn ghost" @click="goAccount">{{ account.user ? '☁️ ' + displayName(account.user) + ' · 云存档已开启' : '登录 / 注册（云端保存进度）' }}</view>
      <navigator class="foot feedback-link" url="/pages/feedback/feedback">玩家反馈</navigator>
      <text class="foot">{{ account.user ? '进度会自动同步到云端' : '游客模式 · 进度保存在本机，登录后可上传' }}</text>
      <!-- #endif -->
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { hasSave, load } from '../../game/index.js'
import { THEMES, settings, setTheme, art } from '../../game/themes.js'
import { account, displayName } from '../../game/account.js'

function goAccount() {
  uni.navigateTo({ url: '/pages/account/account' })
}

const saved = ref(false)
const artFailed = ref(false)

onShow(() => {
  saved.value = hasSave()
})

// 换画风后重新尝试加载封面
watch(
  () => settings.theme,
  () => {
    artFailed.value = false
  }
)

function onTheme(id) {
  setTheme(id)
}

function onContinue() {
  if (load()) uni.reLaunch({ url: '/pages/game/game' })
  else uni.showToast({ title: '存档读取失败', icon: 'none' })
}

function onNew() {
  if (!saved.value) {
    uni.navigateTo({ url: '/pages/create/create' })
    return
  }
  uni.showModal({
    title: '开始新的人生？',
    content: '创建新角色后，当前存档会被覆盖。',
    success(res) {
      if (res.confirm) uni.navigateTo({ url: '/pages/create/create' })
    }
  })
}
</script>

<style>
.title-page {
  position: relative;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx 60rpx;
  box-sizing: border-box;
}
.cover {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
.cover-fallback {
  background: linear-gradient(180deg, var(--hud), var(--accent));
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 520rpx;
  box-sizing: border-box;
}
.skyline {
  font-size: 80rpx;
}
.logo {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28rpx 40rpx;
  transform: rotate(-1.5deg);
}
.logo-cn {
  font-family: var(--title-font);
  font-size: 92rpx;
  font-weight: 800;
  letter-spacing: 12rpx;
  color: var(--accent);
}
.logo-en {
  font-size: max(var(--readable-min, 0px), 28rpx);
  letter-spacing: 16rpx;
  color: var(--muted);
}
.tag {
  margin-top: 16rpx;
  font-size: max(var(--readable-min, 0px), 24rpx);
  text-align: center;
}
.actions {
  position: relative;
  width: 100%;
  margin-top: auto;
}
.actions .btn {
  margin-bottom: 24rpx;
  padding: 26rpx;
  font-size: 32rpx;
}
.themes {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.theme-chip {
  flex: 1;
  margin: 0 6rpx;
  text-align: center;
  font-size: max(var(--readable-min, 0px), 24rpx);
  padding: 12rpx 0;
  background: var(--card);
  border: var(--bw) solid var(--line);
  border-radius: 999rpx;
}
.theme-chip.on {
  background: var(--accent);
  color: #fff;
}
.foot {
  display: block;
  text-align: center;
  font-size: max(var(--readable-min, 0px), 22rpx);
  color: var(--ink);
  background: var(--card);
  border-radius: 999rpx;
  padding: 4rpx 0;
  opacity: 0.85;
}
.feedback-link {
  margin: 8rpx 0;
  padding: 12rpx 0;
  text-decoration: underline;
}
/* #ifdef H5 */
.title-page.narrow {
  max-width: none;
  height: auto;
  min-height: 100vh;
  min-height: 100dvh;
  padding: clamp(24px, 8vh, 80px) 20px 24px;
  gap: 32px;
}
.title-page .logo {
  max-width: 480px;
  box-sizing: border-box;
}
.title-page .actions {
  max-width: 400px;
}
.title-page .support-row {
  flex-wrap: wrap;
  gap: 8px;
}
.title-page .support-link {
  font-size: 14px;
  text-decoration: none;
}
/* #endif */
/* #ifdef H5 || MP-WEIXIN */
.support-row {
  display: flex;
  justify-content: flex-end;
}
.support-link {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-height: 72rpx;
  padding: 0 20rpx;
  background: var(--card);
  color: var(--ink);
  border-radius: 999rpx;
  font-size: 22rpx;
}
.support-icon {
  font-size: 28rpx;
}
/* #endif */
</style>
