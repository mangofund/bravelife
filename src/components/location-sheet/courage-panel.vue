<template>
  <view class="panel">
    <view class="card keeper">
      <text class="act-name">🧓 店主</text>
      <text class="muted block">「{{ keeperLine() }}」</text>
      <view class="row between cg-row">
        <text class="cg-value">🔥 勇气 {{ state.courage.value }}</text>
        <text class="muted">书页 {{ state.courage.pages }} · 课题完成 {{ state.courage.questsDone }}</text>
      </view>
    </view>

    <view class="section-title">📜 勇气课题</view>
    <view v-if="quest" class="card">
      <text>{{ quest.text }}</text>
      <text class="muted block">还剩 {{ quest.left }} 天 · 完成后勇气 +30，书页 +1</text>
    </view>
    <view v-else class="act" @click="actionAudio(() => takeQuest(), 'confirm', { visibleFailure: true })">
      <text class="act-icon">📜</text>
      <view class="act-main">
        <text class="act-name">向店主要一个课题</text>
        <text class="muted">害怕但想做的事。失败或过期都没有惩罚。</text>
      </view>
    </view>

    <view class="section-title">🛒 今天的货架（用勇气交换）</view>
    <view v-for="g in goods" :key="g.id" class="act" :class="{ disabled: g.sold }" @click="onBuy(g)">
      <text class="act-icon">{{ g.icon }}</text>
      <view class="act-main">
        <text class="act-name">{{ g.name }}<text v-if="g.sold" class="muted">（已换走）</text></text>
        <text class="muted">{{ g.desc || '旧物 · 放在家里是装饰，背后有一段故事' }}</text>
      </view>
      <text class="price">🔥{{ g.price }}</text>
    </view>

    <block v-if="item">
      <view class="section-title">{{ item.icon }} 家族物品：{{ item.name }}（{{ item.chapters.length }}/{{ item.total }} 章）</view>
      <view v-for="(t, i) in item.chapters" :key="i" class="card">
        <text class="muted">第 {{ i + 1 }} 章</text>
        <text class="block">{{ t }}</text>
      </view>
      <text v-if="item.chapters.length < item.total" class="muted block">每集齐 5 枚书页，翻开下一章。</text>
    </block>

    <view class="act" @click="actionAudio(() => petCat(), 'dialogue', { visibleFailure: true })">
      <text class="act-icon">🐈‍⬛</text>
      <view class="act-main">
        <text class="act-name">摸摸黑猫「夜」</text>
        <text class="muted">它总是在睡觉。每天一次，心情 +5</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { actionAudio } from '../../game/action-audio.js'
import { computed } from 'vue'
import { state, stock, buyGood, takeQuest, questDef, heirloom, petCat, keeperLine } from '../../game/index.js'

const goods = computed(() => stock())
const item = computed(() => heirloom())
const quest = computed(() => {
  const q = state.courage.quest
  if (!q) return null
  const def = questDef(q.id)
  return { text: def ? def.text : '', left: Math.max(0, q.until - state.day) }
})

function onBuy(g) {
  if (g.sold) return
  actionAudio(() => buyGood(g.id), 'confirm', { visibleFailure: true })
}
</script>

<style>
.keeper {
  background: var(--paper-deep);
}
.cg-row {
  margin-top: 12rpx;
}
.cg-value {
  font-weight: 800;
  color: var(--accent);
}
</style>
