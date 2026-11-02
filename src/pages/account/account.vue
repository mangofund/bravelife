<template>
  <view class="acct theme-root narrow" :class="'theme-' + settings.theme">
    <view class="card head">
      <text class="title">BraveLife 账号</text>
      <text class="muted">登录后进度会保存到云端，换手机、换电脑都能接着玩。</text>
    </view>

    <view v-if="account.user" class="card">
      <text class="act-name">已登录：{{ displayName(account.user) }}</text>
      <text class="muted block">{{ account.user.email || '' }}{{ account.user.wechat ? ' · 已绑定微信' : '' }}</text>
      <view class="btn" @click="goBack">返回游戏</view>
      <view class="btn ghost gap" @click="onLogout">退出登录</view>
    </view>

    <block v-else>
      <view class="tabs-row">
        <text v-for="t in tabs" :key="t.id" class="tab-chip" :class="{ on: mode === t.id }" @click="mode = t.id">{{ t.name }}</text>
      </view>

      <view v-if="mode === 'login'" class="card">
        <input class="field" v-model="form.account" placeholder="用户名或邮箱" />
        <input class="field" v-model="form.password" password placeholder="密码" />
        <view class="btn" :class="{ disabled: busy }" @click="submit">登录</view>
      </view>

      <view v-if="mode === 'register'" class="card">
        <input class="field" v-model="form.username" placeholder="用户名（3-20 位，可选）" />
        <input class="field" v-model="form.email" placeholder="邮箱（可选，用户名和邮箱至少填一个）" />
        <input class="field" v-model="form.password" password placeholder="密码（至少 8 位）" />
        <view class="btn" :class="{ disabled: busy }" @click="submit">注册并登录</view>
      </view>

      <view v-if="mode === 'code'" class="card">
        <input class="field" v-model="form.email" placeholder="邮箱" />
        <view class="row">
          <input class="field grow" v-model="form.code" maxlength="6" placeholder="6 位验证码" />
          <view class="btn ghost send" :class="{ disabled: cooldown > 0 }" @click="sendCode">{{ cooldown > 0 ? cooldown + ' 秒' : '发送验证码' }}</view>
        </view>
        <text class="muted block">没有账号会自动注册。</text>
        <view class="btn" :class="{ disabled: busy }" @click="submit">登录</view>
      </view>

      <view v-if="mode === 'wechat'" class="card">
        <text class="muted block">使用当前微信账号一键登录。</text>
        <view class="btn wx" :class="{ disabled: busy }" @click="submit">微信一键登录</view>
      </view>

      <text v-if="error" class="err">{{ error }}</text>
      <view class="btn ghost gap" @click="goBack">先不登录，继续游客模式</view>
    </block>
  </view>
</template>

<script setup>
import { reactive, ref, onBeforeUnmount } from 'vue'
import { settings } from '../../game/themes.js'
import {
  account, displayName, loginPassword, registerAccount, sendEmailCode, loginEmailCode, loginWechat, logout,
  syncAfterLogin, loadFromSlot, saveToSlot
} from '../../game/account.js'

const tabs = [
  { id: 'login', name: '密码登录' },
  { id: 'register', name: '注册' },
  { id: 'code', name: '邮箱验证码' }
]
// #ifdef MP-WEIXIN
tabs.unshift({ id: 'wechat', name: '微信登录' })
// #endif

const mode = ref(tabs[0].id)
const busy = ref(false)
const error = ref('')
const cooldown = ref(0)
const form = reactive({ account: '', username: '', email: '', password: '', code: '' })
let timer = null

function goBack() {
  uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
}

async function sendCode() {
  if (cooldown.value > 0) return
  error.value = ''
  try {
    await sendEmailCode(form.email.trim())
    uni.showToast({ title: '验证码已发送', icon: 'none' })
    cooldown.value = 60
    timer = setInterval(() => {
      cooldown.value -= 1
      if (cooldown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (e) {
    error.value = e.message
  }
}

function ask(title, content, confirmText, cancelText) {
  return new Promise((resolve) => {
    uni.showModal({ title, content, confirmText, cancelText, success: (r) => resolve(!!r.confirm) })
  })
}

// 登录成功后处理本地进度和云端进度
async function afterLogin() {
  const r = await syncAfterLogin()
  if (r.action === 'uploaded') uni.showToast({ title: '本机进度已上传到云端', icon: 'none' })
  if (r.action === 'choose') {
    const s = r.cloud.summary || {}
    const useCloud = await ask(
      '发现云端存档',
      '云端：' + (s.name || '') + ' 第 ' + (s.day || '?') + ' 天 · ' + (s.moneyText || '') + '。要用云端进度覆盖本机吗？',
      '用云端',
      '用本机'
    )
    if (useCloud) await loadFromSlot('auto')
    else await saveToSlot('auto')
  }
  if (r.action === 'cloud-only') await loadFromSlot('auto')
  uni.reLaunch({ url: '/pages/index/index' })
}

async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    if (mode.value === 'login') await loginPassword(form.account.trim(), form.password)
    else if (mode.value === 'register') await registerAccount(form.username.trim(), form.email.trim(), form.password)
    else if (mode.value === 'code') await loginEmailCode(form.email.trim(), form.code.trim())
    else await loginWechat()
    await afterLogin()
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

async function onLogout() {
  await logout()
  uni.showToast({ title: '已退出登录', icon: 'none' })
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style>
.acct {
  padding: 40rpx 32rpx;
}
.head {
  display: flex;
  flex-direction: column;
}
.title {
  font-family: var(--title-font);
  font-size: 44rpx;
  font-weight: 800;
  color: var(--accent);
}
.tabs-row {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 16rpx;
}
.tab-chip {
  padding: 10rpx 24rpx;
  margin: 0 12rpx 12rpx 0;
  border-radius: 999rpx;
  border: var(--bw) solid var(--line);
  background: var(--card);
  font-size: 26rpx;
}
.tab-chip.on {
  background: var(--accent);
  color: #fff;
}
.field {
  height: 84rpx;
  padding: 0 24rpx;
  margin-bottom: 20rpx;
  border-radius: 20rpx;
  border: var(--bw) solid var(--line);
  background: var(--paper);
  font-size: 28rpx;
}
.grow {
  flex: 1;
  margin-right: 16rpx;
}
.send {
  margin-bottom: 20rpx;
  padding: 0 20rpx;
  height: 84rpx;
  box-sizing: border-box;
  font-size: 24rpx;
}
.gap {
  margin-top: 20rpx;
}
.wx {
  background: #07c160;
}
.err {
  display: block;
  color: var(--warn);
  margin: 12rpx 0;
}
</style>
