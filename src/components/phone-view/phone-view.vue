<template>
  <view class="phone">
    <scene-guide :scene="'phone:' + app" />
    <view v-if="!hideApps" class="apps">
      <view v-for="a in APPS" :key="a.id" class="app" :class="{ on: app === a.id }" @click="openApp(a.id)">
        <text class="app-icon">{{ a.icon }}</text>
        <text class="app-name">{{ a.name }}</text>
        <text v-if="a.id === 'msg' && state.unread" class="dot-badge">{{ state.unread }}</text>
      </view>
    </view>

    <view v-if="hideApps" class="phone-app-heading">{{ currentApp.icon }} {{ currentApp.name }}</view>
    <view v-if="app === 'life'">
      <homestead-journal />
      <view class="card">
        <text class="act-name">{{ lifeStageName() }}</text>
        <text class="muted block">{{ fmtDate(state.day) }} · {{ age() }} 岁 · {{ isMinor() ? schoolName() + '，和家人住在一起' : '一个人在东京' }}</text>
        <text class="muted block">{{ dreamText }}</text>
      </view>
      <block v-if="goals.length">
        <view class="section-title">⭐ 章节目标（{{ goalsDone }}/{{ goals.length }}）</view>
        <view v-for="g in goals" :key="g.id" class="line">
          <text class="line-main" :class="{ muted: g.done }">{{ g.done ? '✅' : '⬜' }} {{ g.text }}</text>
        </view>
      </block>
      <view class="section-title">🔥 勇气</view>
      <view class="card">
        <text class="act-name">勇气 {{ state.courage.value }}<text class="muted"> · 累计 {{ state.courage.total }} · 书页 {{ state.courage.pages }}</text></text>
        <text class="muted block">{{ questText }}</text>
        <text class="muted block">{{ state.story.flags.shop_found ? '勇气商店在下雨的夜晚、人生转折点的晚上，以及累计勇气每过一个整百的那天晚上亮灯。' : '听说下雨的晚上，下町的小巷里会多出一家店。' }}</text>
      </view>
      <view class="section-title">🏷️ 称号（点击佩戴）</view>
      <view v-for="t in titles" :key="t.id" class="act" :class="{ disabled: !t.owned, on: t.worn }" @click="onWear(t)">
        <text class="act-icon">{{ t.owned ? t.icon : '🔒' }}</text>
        <view class="act-main">
          <text class="act-name">{{ t.name }}<text v-if="t.worn" class="tag-sm">佩戴中</text></text>
          <text class="muted">{{ t.desc }}</text>
        </view>
      </view>
    </view>

    <view v-if="app === 'bank'">
      <view class="card">
        <text class="muted">钱包余额</text>
        <text class="big">{{ fmtMoney(state.money) }}</text>
        <text class="muted">储蓄（日息 0.05%）：{{ fmtMoney(state.savings) }}</text>
        <text class="muted block">净资产：{{ fmtMoney(netWorth()) }}</text>
        <view class="amounts">
          <view v-for="v in AMOUNTS" :key="v" class="btn ghost amt" @click="deposit(v)">存 {{ fmtMoney(v) }}</view>
          <view v-for="v in AMOUNTS" :key="'w' + v" class="btn ghost amt" @click="withdraw(v)">取 {{ fmtMoney(v) }}</view>
        </view>
      </view>
      <view class="section-title">交易记录</view>
      <view v-for="(t, i) in state.txns" :key="i" class="line">
        <text class="line-main">{{ fmtDay(t.day) }} {{ fmtHour(t.hour) }} · {{ t.text }}</text>
        <text :class="t.amount >= 0 ? 'plus' : 'minus'">{{ t.amount >= 0 ? '+' : '' }}{{ fmtMoney(t.amount) }}</text>
      </view>
    </view>

    <view v-if="app === 'msg'">
      <view v-if="!state.messages.length" class="muted">还没有消息</view>
      <view v-for="(m, i) in state.messages" :key="i" class="card msg">
        <view class="row between"><text class="act-name">{{ m.from }}</text><text class="muted">{{ fmtDay(m.day) }} {{ fmtHour(m.hour) }}</text></view>
        <text>{{ m.text }}</text>
      </view>
    </view>

    <view v-if="app === 'news'">
      <view v-for="(n, i) in state.news" :key="i" class="card msg">
        <text class="muted">{{ fmtDay(n.day) }}</text>
        <text>{{ n.text }}</text>
      </view>
    </view>

    <view v-if="app === 'bag'">
      <view v-if="!bagList.length" class="muted">背包是空的。便利店和鱼市可以买东西带走。</view>
      <view v-for="b in bagList" :key="b.id" class="act" @click="useItem(b.id)">
        <text class="act-icon">{{ b.icon }}</text>
        <view class="act-main">
          <text class="act-name">{{ b.name }} ×{{ b.count }}</text>
          <text class="muted">{{ b.tip }}</text>
        </view>
        <text class="price">{{ b.label }}</text>
      </view>
    </view>

    <view v-if="app === 'contacts'">
      <view class="contact-sections"><button :class="{active:contactSection==='friends'}" @click="switchAudio(contactSection, 'friends', v => contactSection = v)">好友</button><button :class="{active:contactSection==='strategies'}" @click="switchAudio(contactSection, 'strategies', v => contactSection = v)">策略</button></view>
      <strategy-notebook v-if="contactSection==='strategies'" />
      <template v-else>
      <ren-conversation />
      <view v-if="invite" class="notice">📅 {{ invite }}</view>
      <view v-if="!contacts.length" class="muted">还没有认识的人。去图书馆、健身房、拉面横丁等地点看看谁在，点「打招呼」。</view>
      <view v-for="c in contacts" :key="c.id" class="card">
        <view class="row between">
          <text class="act-name">{{ c.icon }} {{ c.name }}<text class="tag-sm">{{ c.stage }}</text></text>
          <text class="muted">好感 {{ c.aff }}</text>
        </view>
        <text class="muted block">{{ c.job }} · 常在{{ c.where }}</text>
        <view class="track"><view class="fill pink" :style="{ width: c.aff + '%' }" /></view>
      </view>
      </template>
    </view>

    <view v-if="app === 'me'">
      <view class="card">
        <view class="row">
          <avatar-card :profile="state.profile" :size="120" />
          <view class="me-text">
            <text class="act-name">{{ state.profile.name }}</text>
            <text class="muted">{{ bgName }} · 在东京第 {{ state.day }} 天</text>
            <text class="muted">声望 {{ state.rep }} · 湾岸地块 {{ plotCount }} 块</text>
          </view>
        </view>
      </view>
      <view class="card">
        <block v-if="state.profile.wish">
          <text class="act-name">{{ wish.icon }} 人生愿望：{{ wish.name }}</text>
          <text class="muted block">{{ wish.desc }} · {{ state.wishDone ? '✅ 已达成' : '进行中' }}</text>
        </block>
        <text v-else class="act-name">🌱 人生愿望：18 岁离开家时再决定</text>
      </view>
      <view class="card">
        <view class="section-title">能力</view>
        <view v-for="k in skillKeys" :key="k" class="cand">
          <text class="skill-name">{{ SKILL_NAMES[k] }}</text>
          <view class="track"><view class="fill" :style="{ width: state.skills[k] + '%' }" /></view>
          <text class="pct">{{ state.skills[k] }}</text>
        </view>
        <view class="section-title">状态</view>
        <view v-for="k in statKeys" :key="k" class="cand">
          <text class="skill-name">{{ STAT_NAMES[k] }}</text>
          <view class="track"><view class="fill" :style="{ width: state.stats[k] + '%' }" /></view>
          <text class="pct">{{ Math.round(state.stats[k]) }}</text>
        </view>
      </view>
      <save-panel />
      <view class="card">
        <view class="section-title">🎨 画风</view>
        <view v-for="t in THEMES" :key="t.id" class="act theme-opt" :class="{ on: settings.theme === t.id }" @click="setTheme(t.id)">
          <text class="act-icon">{{ t.icon }}</text>
          <view class="act-main"><text class="act-name">{{ t.name }}</text><text class="muted">{{ t.desc }}</text></view>
          <text v-if="settings.theme === t.id" class="price">使用中</text>
        </view>
      </view>
      <view class="btn ghost" @click="onSave">保存到本机</view>
      <view class="btn ghost danger" @click="onRestart">重新开始人生</view>
    </view>
  </view>
</template>

<script setup>
import SceneGuide from '../scene-guide/scene-guide.vue'
import { computed, ref, watch } from 'vue'
import { play, playTabSwitch } from '../../game/audio.js'
import { switchAudio } from '../../game/action-audio.js'
import HomesteadJournal from '../homestead-journal.vue'
import StrategyNotebook from '../strategy-notebook.vue'
import RenConversation from '../ren-conversation.vue'
import AvatarCard from '../avatar-card/avatar-card.vue'
import SavePanel from '../save-panel/save-panel.vue'
import {
  state, fmtMoney, fmtHour, netWorth, wishInfo, deposit, withdraw, useItem, describe, save, clearSave, rel, stageName,
  fmtDate, fmtDay, age, isMinor, schoolName, lifeStageName, currentGoals, questDef, wearTitle, spotOf
} from '../../game/index.js'
import { TITLES } from '../../game/data/titles.js'
import { NPCS, NPC_MAP } from '../../game/data/npcs.js'
import { THEMES, settings, setTheme } from '../../game/themes.js'
import { LOCATION_MAP } from '../../game/data/locations.js'
import { ITEMS } from '../../game/data/world.js'
import { BACKGROUNDS, SKILL_NAMES, STAT_NAMES, DREAM_MAP } from '../../game/data/profile.js'

import { PHONE_APPS as APPS } from '../../game/data/phone-apps.js'
const AMOUNTS = [10000, 100000, 1000000]
const skillKeys = Object.keys(SKILL_NAMES)
const statKeys = Object.keys(STAT_NAMES)

const props = defineProps({
  initialApp: { type: String, default: 'msg' },
  hideApps: Boolean
})
const app = ref(props.initialApp)
const contactSection=ref('friends')
const currentApp = computed(() => APPS.find(a => a.id === app.value) || APPS[0])
if (app.value === 'msg') state.unread = 0

watch(
  () => props.initialApp,
  (value) => {
    app.value = value || 'msg'
    if (app.value === 'msg') state.unread = 0
  }
)

function openApp(id) {
  if (app.value !== id) playTabSwitch()
  app.value = id
  if (id === 'msg') state.unread = 0
}

const wish = computed(() => wishInfo())
const bgName = computed(() => {
  const b = BACKGROUNDS.filter((x) => x.id === state.profile.background)[0]
  return b ? b.icon + ' ' + b.name : ''
})
const plotCount = computed(() => Object.keys(state.plots).length)
const contacts = computed(() =>
  NPCS.filter((n) => rel(n.id)).map((n) => {
    const r = rel(n.id)
    const sp = spotOf(n)
    const where = LOCATION_MAP[sp.location].name + ' ' + sp.hours[0] + ':00-' + (sp.hours[1] % 24) + ':00'
    return { id: n.id, name: n.name, icon: n.icon, job: sp.job, aff: Math.round(r.aff), stage: stageName(r), where }
  })
)
const invite = computed(() => {
  const inv = state.invite
  if (!inv || inv.done || inv.day !== state.day) return ''
  return NPC_MAP[inv.npc].name + ' 约你今天 ' + inv.from + ':00 - ' + inv.to + ':00 在' + LOCATION_MAP[inv.loc].name + '见面'
})
const bagList = computed(() =>
  Object.keys(state.bag)
    .filter((id) => ITEMS[id] && state.bag[id] > 0)
    .map((id) => {
      const it = ITEMS[id]
      const tips = { food: describe(it.effects), ingredient: '回家用厨房做饭', gift: '当面送给朋友', ring: '对恋人求婚用' }
      const labels = { food: '吃', ingredient: '做饭用', gift: '送礼', ring: '求婚' }
      return { id, name: it.name, icon: it.icon, count: state.bag[id], tip: tips[it.kind], label: labels[it.kind] }
    })
)

const goals = computed(() => currentGoals())
const goalsDone = computed(() => goals.value.filter((g) => g.done).length)
const dreamText = computed(() => {
  const d = DREAM_MAP[state.profile.dream]
  if (!d) return '小梦想：还没写（小学的作文课上会决定）'
  return '小梦想：' + d.icon + ' ' + d.name
})
const questText = computed(() => {
  const q = state.courage.quest
  if (!q) return '手上没有勇气课题'
  const def = questDef(q.id)
  return '课题：' + (def ? def.text : '') + '（还剩 ' + Math.max(0, q.until - state.day) + ' 天）'
})
const titles = computed(() =>
  TITLES.map((t) => ({ id: t.id, name: t.name, icon: t.icon, desc: t.desc, owned: !!state.titles[t.id], worn: state.profile.title === t.id }))
)

function onWear(t) {
  if (!t.owned) return
  play('click')
  wearTitle(t.worn ? '' : t.id)
  save()
}

function onSave() {
  save()
  play('confirm')
  uni.showToast({ title: '已存档', icon: 'success' })
}

function onRestart() {
  play('question')
  uni.showModal({
    title: '重新开始？',
    content: '当前存档会被删除，无法恢复。',
    success(res) {
      if (res.confirm) {
        clearSave()
        uni.reLaunch({ url: '/pages/index/index' })
      }
    }
  })
}
</script>

<style>
.phone {
  padding: 20rpx;
}
.apps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
}
.app {
  position: relative;
  width: 15.5%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0;
  border-radius: 24rpx;
  background: var(--card);
}
.app.on {
  background: var(--ink);
  color: #fff;
}
.app-icon {
  font-size: 48rpx;
}
.app-name {
  font-size: max(var(--readable-min, 0px), 22rpx);
}
.dot-badge {
  position: absolute;
  top: 4rpx;
  right: 12rpx;
  background: var(--warn);
  color: #fff;
  font-size: max(var(--readable-min, 0px), 18rpx);
  border-radius: 999rpx;
  padding: 0 10rpx;
}
.big {
  display: block;
  font-size: 56rpx;
  font-weight: 800;
}
.amounts {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.amt {
  width: 31%;
  margin-bottom: 12rpx;
  padding: 14rpx 0;
  font-size: max(var(--readable-min, 0px), 22rpx);
  box-sizing: border-box;
}
.line {
  display: flex;
  justify-content: space-between;
  padding: 14rpx 0;
  border-bottom: 2rpx solid var(--line);
  font-size: max(var(--readable-min, 0px), 24rpx);
}
.line-main {
  flex: 1;
  margin-right: 12rpx;
}
.plus {
  color: var(--ok);
}
.minus {
  color: var(--warn);
}
.msg {
  display: flex;
  flex-direction: column;
}
.me-text {
  display: flex;
  flex-direction: column;
  margin-left: 24rpx;
}
.cand {
  display: flex;
  align-items: center;
  margin: 10rpx 0;
}
.skill-name {
  width: 100rpx;
  font-size: max(var(--readable-min, 0px), 24rpx);
}
.cand .track {
  flex: 1;
  height: 16rpx;
  background: var(--paper-deep);
  border-radius: 8rpx;
  overflow: hidden;
}
.cand .fill,
.card .fill {
  height: 100%;
  background: var(--accent);
}
.card .track {
  height: 12rpx;
  background: var(--paper-deep);
  border-radius: 6rpx;
  overflow: hidden;
}
.fill.pink {
  background: var(--accent2);
}
.pct {
  width: 80rpx;
  text-align: right;
  font-size: max(var(--readable-min, 0px), 24rpx);
}
.theme-opt.on {
  border-color: var(--accent);
  border-width: 5rpx;
}
.danger {
  color: var(--warn);
  margin-top: 16rpx;
}
.phone-app-heading { font-size: 23px; font-weight: 700; margin: 0 0 18px; color: var(--ink); }
.contact-sections{display:flex;gap:6px;margin-bottom:12px}.contact-sections button{flex:1;margin:0;padding:7px;font-size: max(var(--readable-min, 0px), 12px);line-height:1.4;color:var(--ink);background:var(--paper-deep)}.contact-sections .active{background:var(--hud);color:#fff2d4}
</style>
