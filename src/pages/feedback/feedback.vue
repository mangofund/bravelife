<template>
  <view class="theme-root narrow" :class="'theme-' + settings.theme">
    <view class="feedback card">
      <text class="section-title">玩家反馈</text>
      <view v-if="issueNumber" class="feedback-fields">
        <text>反馈已提交，编号 #{{ issueNumber }}。</text>
        <button class="btn ghost" @click="goBack">返回</button>
      </view>
      <view v-else class="feedback-fields">
        <picker :range="categories" :value="categoryIndex" :disabled="submitting" @change="categoryIndex = Number($event.detail.value)">
          <view class="feedback-input">反馈类型　{{ categories[categoryIndex] }} ▾</view>
        </picker>
        <text>标题</text>
        <input v-model="title" class="feedback-input" maxlength="60" :disabled="submitting" placeholder="一句话描述你的反馈" />
        <text>详细说明</text>
        <textarea v-model="description" class="feedback-input feedback-description" maxlength="1000" :disabled="submitting" placeholder="遇到了什么？如果是故障，可以写下出现前的操作。" />
        <text class="muted">反馈内容和提交平台会发布到公开的 GitHub Issues。请勿填写姓名、联系方式、密码或其他隐私信息。</text>
        <text v-if="error" role="alert">{{ error }}</text>
        <button class="btn" :disabled="submitting || !title.trim() || !description.trim()" :loading="submitting" @click="confirmSubmit">确认公开并提交</button>
        <button class="btn ghost" :disabled="submitting" @click="goBack">返回</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '../../game/api.js'
import { settings } from '../../game/themes.js'

const categories = ['游戏故障', '玩法建议', '其他反馈']
const categoryIds = ['bug', 'suggestion', 'other']
const categoryIndex = ref(0)
const title = ref('')
const description = ref('')
const error = ref('')
const submitting = ref(false)
const issueNumber = ref(0)

let platform = 'web'
// #ifdef MP-WEIXIN
platform = 'wechat'
// #endif

function goBack() {
  uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
}

async function confirmSubmit() {
  if (submitting.value || issueNumber.value || !title.value.trim() || !description.value.trim()) return
  submitting.value = true
  error.value = ''
  try {
    const result = await api('POST', '/api/feedback', {
      category: categoryIds[categoryIndex.value],
      title: title.value.trim(),
      description: description.value.trim(),
      platform,
      publicConsent: true
    })
    issueNumber.value = result.issueNumber
  } catch (err) {
    error.value = err.status ? err.message : '暂时无法确认是否提交成功，请先检查 GitHub Issues，再决定是否重试。'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.feedback {
  margin: 32rpx 24rpx;
  padding: 28rpx;
}
.feedback-fields {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
.feedback-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 76rpx;
  padding: 14rpx 18rpx;
  border: 1px solid currentColor;
  border-radius: 12rpx;
}
.feedback-description {
  height: 260rpx;
}
.feedback-fields button {
  width: 100%;
}
</style>
