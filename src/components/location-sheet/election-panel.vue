<template>
  <view class="panel">
    <view class="section-title">🗳️ 东京都知事选举</view>
    <view class="card">
      <text v-if="isElectionDay()" class="hot">今天是投票日！明天公布结果。</text>
      <text v-else>距离下次投票日（{{ fmtDay(electionDay()) }}）还有 {{ daysToElection() }} 天</text>
      <text class="muted block">参选条件：声望 ≥ {{ ELECTION_MIN_REP }}，保证金 {{ fmtMoney(ELECTION_DEPOSIT) }}。当选后每天领取知事薪水 {{ fmtMoney(GOVERNOR_SALARY) }}。</text>
      <view v-for="r in rows" :key="r.id" class="cand">
        <text class="cand-name">{{ r.icon }} {{ r.name }}</text>
        <view class="track"><view class="fill" :style="{ width: r.pct + '%' }" /></view>
        <text class="pct">{{ r.pct }}%</text>
      </view>
      <text class="muted">以上为民调预估，实际开票有波动。</text>
    </view>

    <view v-if="state.election.last" class="card">
      <text class="act-name">上届结果（{{ fmtDay(state.election.last.day) }}）：{{ state.election.last.winner }} 当选</text>
      <text v-for="r in state.election.last.results" :key="r.name" class="muted block">{{ r.name }} {{ r.pct }}%</text>
    </view>

    <block v-if="isElectionDay()">
      <view class="section-title">投出你的一票</view>
      <view v-if="state.election.voted" class="notice">你今天已经投过票了。</view>
      <block v-else>
        <view v-if="state.election.registered" class="act" @click="vote('me')">
          <text class="act-icon">⭐</text>
          <view class="act-main"><text class="act-name">投给自己</text></view>
        </view>
        <view v-for="c in CANDIDATES" :key="c.id" class="act" @click="vote(c.id)">
          <text class="act-icon">{{ c.icon }}</text>
          <view class="act-main">
            <text class="act-name">{{ c.name }} · {{ c.party }}</text>
            <text class="muted">“{{ c.slogan }}”</text>
          </view>
        </view>
      </block>
    </block>

    <block v-else>
      <view v-if="!state.election.registered" class="btn dark" @click="registerCandidate">报名参选</view>
      <block v-else>
        <view class="notice">你是本届候选人，当前支持度 {{ state.election.support }}。每种拉票方式每天一次。</view>
        <view v-for="c in CAMPAIGNS" :key="c.id" class="act" @click="campaign(c.id)">
          <text class="act-icon">{{ c.icon }}</text>
          <view class="act-main">
            <text class="act-name">{{ c.name }}</text>
            <text class="muted">{{ c.hours }} 小时 · 支持度 +{{ campaignGain(c.id) }} · {{ c.desc }}</text>
          </view>
          <text class="price">{{ c.cost ? fmtMoney(c.cost) : '免费' }}</text>
        </view>
      </block>
    </block>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import {
  state, fmtMoney, isElectionDay, electionDay, daysToElection, projection, campaignGain,
  registerCandidate, campaign, vote, fmtDay } from '../../game/index.js'
import { CANDIDATES, CAMPAIGNS, ELECTION_DEPOSIT, ELECTION_MIN_REP, GOVERNOR_SALARY } from '../../game/data/events.js'

const rows = computed(() => projection())
</script>

<style>
.hot {
  color: var(--warn);
  font-weight: 700;
}
.cand {
  display: flex;
  align-items: center;
  margin: 10rpx 0;
}
.cand-name {
  width: 260rpx;
  font-size: 24rpx;
}
.cand .track {
  flex: 1;
  height: 16rpx;
  background: var(--paper-deep);
  border-radius: 8rpx;
  overflow: hidden;
}
.cand .fill {
  height: 100%;
  background: var(--accent);
}
.pct {
  width: 100rpx;
  text-align: right;
  font-size: 24rpx;
}
</style>
