<template>
  <view v-if="people.length || inviteHere" class="panel">
    <view class="section-title">👥 这里的人</view>
    <view v-if="inviteHere" class="notice row between">
      <text>{{ inviteName }} 约你今天在这里见面</text>
      <view class="btn mini" @click="socialAction(() => keepInvite())">赴约</view>
    </view>
    <view v-for="p in people" :key="p.id" class="card person">
      <view class="row">
        <text class="p-icon">{{ p.icon }}</text>
        <view class="p-main">
          <text class="act-name">{{ p.name }}<text class="tag-sm">{{ p.stage }}</text></text>
          <text class="muted">{{ p.known ? p.job : p.intro }}</text>
        </view>
      </view>
      <view v-if="p.known" class="aff">
        <text class="muted">好感</text>
        <view class="aff-track"><view class="aff-fill" :style="{ width: p.aff + '%' }" /></view>
        <text class="muted">{{ p.aff }}</text>
      </view>
      <view class="ops">
        <view class="btn mini" @click="socialAction(() => talk(p.id), false)">{{ p.known ? '聊天' : '打招呼' }}</view>
        <block v-if="p.known">
          <view class="btn mini ghost" @click="toggleGift(p.id)">送礼</view>
          <view class="btn mini ghost" :class="{ disabled: p.aff < 20 }" @click="socialAction(() => goDate(p.id), false)">约会 {{ fmtMoney(DATE_COST) }}</view>
          <view v-if="p.status === 'none' && p.aff >= CONFESS_MIN" class="btn mini pink" @click="socialAction(() => confess(p.id), true)">表白</view>
          <view v-if="p.status === 'dating'" class="btn mini pink" @click="socialAction(() => propose(p.id), true)">求婚</view>
        </block>
      </view>
      <view v-if="giftFor === p.id" class="gifts">
        <text v-if="!gifts.length" class="muted">背包里没有礼物。和果子在古寺、手办在电器街、花束和香水在银座百货。</text>
        <view v-for="g in gifts" :key="g.id" class="gift" @click="onGift(p.id, g.id)">
          <text>{{ g.icon }} {{ g.name }} ×{{ g.count }}</text>
        </view>
        <text class="muted block">{{ p.name }} 喜欢：{{ p.likes }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { state, fmtMoney, npcsAt, rel, stageName, talk, giftList, giveGift, goDate, confess, propose, keepInvite } from '../../game/index.js'
import { NPC_MAP, DATE_COST, CONFESS_MIN } from '../../game/data/npcs.js'
import { play } from '../../game/audio.js'
import { actionAudio } from '../../game/action-audio.js'
import { ITEMS } from '../../game/data/world.js'

const props = defineProps({ locId: { type: String, required: true } })
const giftFor = ref('')

const people = computed(() =>
  npcsAt(props.locId).map((n) => {
    const r = rel(n.id)
    // 认识之前不暴露喜好
    const likes = r && r.aff >= 20 ? n.likes.map((k) => ITEMS[k].icon + ITEMS[k].name).join('、') : '再熟一点才知道'
    return {
      id: n.id, name: n.name, icon: n.icon, job: n.job, intro: n.intro,
      known: !!r, aff: r ? Math.round(r.aff) : 0, status: r ? r.status : 'none', stage: stageName(r), likes
    }
  })
)
const gifts = computed(() => giftList())
const inviteHere = computed(() => {
  const inv = state.invite
  if (!inv || inv.done || inv.day !== state.day || inv.loc !== props.locId) return false
  return state.hour >= inv.from && state.hour < inv.to
})
const inviteName = computed(() => (state.invite ? NPC_MAP[state.invite.npc].name : ''))

function socialAction(fn, keyMoment = false) { return actionAudio(fn, 'dialogue', { visibleFailure: true, keyMoment }) }

function toggleGift(id) {
  play(giftFor.value === id ? 'closePanel' : 'openPanel')
  giftFor.value = giftFor.value === id ? '' : id
}

function onGift(id, itemId) {
  socialAction(() => giveGift(id, itemId))
  giftFor.value = ''
}
</script>

<style>
.person {
  margin-bottom: 16rpx;
}
.p-icon {
  font-size: 64rpx;
  margin-right: 16rpx;
}
.p-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.aff {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
}
.aff-track {
  flex: 1;
  height: 12rpx;
  margin: 0 12rpx;
  border-radius: 6rpx;
  background: var(--paper-deep);
  overflow: hidden;
}
.aff-fill {
  height: 100%;
  background: var(--accent2);
}
.ops {
  display: flex;
  flex-wrap: wrap;
  margin-top: 16rpx;
}
.btn.mini {
  padding: 10rpx 22rpx;
  font-size: 24rpx;
  margin: 0 12rpx 12rpx 0;
  border-radius: 14rpx;
}
.btn.pink {
  background: var(--accent2);
}
.gifts {
  display: flex;
  flex-wrap: wrap;
  padding-top: 8rpx;
}
.gift {
  padding: 10rpx 18rpx;
  margin: 0 12rpx 12rpx 0;
  border-radius: 14rpx;
  background: var(--paper-deep);
  font-size: 24rpx;
}
</style>
