<template>
  <view class="card">
    <view class="section-title">☁️ 账号与存档</view>
    <sound-setting />
    <block v-if="!account.user">
      <text class="muted block">游客模式：进度只保存在这台设备上。登录后会自动上传，换设备也能继续。</text>
      <view class="btn" @click="goAccount">登录 / 注册</view>
    </block>
    <block v-else>
      <text class="act-name">{{ displayName(account.user) }}</text>
      <text class="muted block">{{ syncText }}</text>
      <view v-for="s in slots" :key="s.slot" class="slot">
        <view class="slot-main">
          <text class="act-name">{{ SLOT_NAMES[s.slot] }}</text>
          <text class="muted">{{ s.info }}</text>
        </view>
        <text v-if="s.slot !== 'auto'" class="slot-btn" @click="onSave(s.slot)">存到这里</text>
        <text v-if="s.has" class="slot-btn load" @click="onLoad(s.slot)">读档</text>
      </view>
      <view class="row between gap">
        <text class="slot-btn" @click="refresh">刷新</text>
        <text class="slot-btn" @click="goAccount">账号设置</text>
      </view>
    </block>
    <navigator class="btn ghost" url="/pages/feedback/feedback">玩家反馈</navigator>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import SoundSetting from '../sound-setting.vue'
import { fmtHour } from '../../game/index.js'
import { account, displayName, listSaves, saveToSlot, loadFromSlot, SLOT_NAMES } from '../../game/account.js'

const remote = ref([])
const loading = ref(false)

function when(t) {
  const d = new Date(t)
  const pad = (n) => (n < 10 ? '0' : '') + n
  return d.getMonth() + 1 + '/' + d.getDate() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

const slots = computed(() =>
  ['auto', '1', '2', '3'].map((slot) => {
    const s = remote.value.filter((x) => x.slot === slot)[0]
    if (!s) return { slot, has: false, info: loading.value ? '读取中…' : '空' }
    const m = s.summary || {}
    return { slot, has: true, info: (m.name || '') + ' · 第 ' + m.day + ' 天 ' + fmtHour(m.hour || 0) + ' · ' + (m.moneyText || '') + ' · 保存于 ' + when(s.updatedAt) }
  })
)

const syncText = computed(() => {
  if (account.syncing) return '正在同步…'
  if (account.error) return '同步失败：' + account.error
  return account.lastSync ? '自动存档已同步 ' + when(account.lastSync) : '每分钟自动同步到云端'
})

async function refresh() {
  if (!account.user) return
  loading.value = true
  try {
    remote.value = await listSaves()
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

watch(() => account.user, refresh, { immediate: true })
watch(() => account.lastSync, refresh)

async function onSave(slot) {
  try {
    await saveToSlot(slot)
    uni.showToast({ title: '已保存到' + SLOT_NAMES[slot], icon: 'none' })
    refresh()
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  }
}

function onLoad(slot) {
  uni.showModal({
    title: '读取' + SLOT_NAMES[slot] + '？',
    content: '当前进度会被这个存档覆盖。想保留当前进度，可以先存到别的存档位。',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await loadFromSlot(slot)
        uni.showToast({ title: '读档成功', icon: 'none' })
        uni.reLaunch({ url: '/pages/game/game' })
      } catch (e) {
        uni.showToast({ title: e.message, icon: 'none' })
      }
    }
  })
}

function goAccount() {
  uni.navigateTo({ url: '/pages/account/account' })
}
</script>

<style>
.slot {
  display: flex;
  align-items: center;
  padding: 14rpx 0;
  border-bottom: 2rpx dashed var(--line);
}
.slot-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.slot-btn {
  font-size: max(var(--readable-min, 0px), 24rpx);
  padding: 8rpx 18rpx;
  margin-left: 10rpx;
  border-radius: 999rpx;
  border: 2rpx solid var(--line);
  background: var(--card);
  white-space: nowrap;
}
.slot-btn.load {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.gap {
  margin-top: 16rpx;
}
</style>
