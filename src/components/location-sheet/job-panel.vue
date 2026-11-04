<template>
  <view class="panel">
    <view class="section-title">{{ c.icon }} 招聘 · {{ c.name }}</view>
    <view class="card">
      <text class="muted">上班时间：{{ c.window[0] }}:00 - {{ c.window[1] }}:00 之间开始，每班 {{ c.hours }} 小时，每天一班。连续上满 {{ PROMOTE_SHIFTS }} 班且能力达标即可升职。</text>
      <view v-for="(lv, i) in c.levels" :key="lv.title" class="lv" :class="{ cur: mine && state.job.level === i }">
        <text class="lv-title">{{ i + 1 }}. {{ lv.title }}</text>
        <text class="muted lv-req">{{ reqText(lv.req) }}</text>
        <text class="price">{{ fmtMoney(lv.pay) }}/班</text>
      </view>
    </view>
    <view v-if="mine">
      <view class="muted progress">当前职位「{{ c.levels[state.job.level].title }}」，本职级已上 {{ state.job.shifts }} 班</view>
      <view class="btn" :class="{ disabled: !!shiftErr }" @click="actionAudio(() => work(), 'confirm', { visibleFailure: true, keyMoment: true })">{{ shiftErr || '开始上班' }}</view>
      <view class="btn ghost quit" @click="onQuit">辞职</view>
    </view>
    <view v-else class="btn dark" @click="actionAudio(() => applyJob(careerId), 'confirm', { visibleFailure: true })">{{ state.job ? '跳槽到这里' : '应聘' }}（{{ c.levels[0].title }}）</view>
  </view>
</template>

<script setup>
import { play } from '../../game/audio.js'
import { actionAudio } from '../../game/action-audio.js'
import { computed } from 'vue'
import { state, fmtMoney, reqText, applyJob, work, quitJob, canStartShift } from '../../game/index.js'
import { CAREERS, PROMOTE_SHIFTS } from '../../game/data/jobs.js'

const props = defineProps({ careerId: { type: String, required: true } })

const c = computed(() => CAREERS[props.careerId])
const mine = computed(() => !!state.job && state.job.career === props.careerId)
const shiftErr = computed(() => (mine.value ? canStartShift() : ''))

function onQuit() {
  play('question')
  uni.showModal({
    title: '确定辞职？',
    content: '辞职后职级会清零。',
    success(res) {
      if (res.confirm) quitJob()
    }
  })
}
</script>

<style>
.lv {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 2rpx solid var(--line);
}
.lv.cur {
  background: var(--paper-deep);
}
.lv-title {
  width: 200rpx;
  font-weight: 600;
  font-size: max(var(--readable-min, 0px), 26rpx);
}
.lv-req {
  flex: 1;
}
.progress {
  margin-bottom: 12rpx;
}
.quit {
  margin-top: 16rpx;
}
</style>
