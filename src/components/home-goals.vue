<template><view v-if="compact" class="goal-compact" @click.stop="requestFunction('phone',{app:'life'})"><text>{{ info ? (info.done ? '✓ ' : '· ') + info.title : '给今天选一个生活目标' }}</text><text>查看 ›</text></view><view v-else class="goal-picker"><text class="goal-title">自己的生活目标</text><view class="goal-options"><button v-for="g in goals" :key="g.id" :class="{active:state.homestead.goal===g.id}" @click="setHomeGoal(g.id)">{{g.name}}</button><button @click="setHomeGoal('')">隐藏</button></view><text class="goal-hint">{{info ? info.text : '随时选择或隐藏；不会自动花钱、锁材料或领取奖励。'}}</text></view></template>
<script setup>
import {computed,ref,onMounted,onBeforeUnmount} from 'vue'
import {state} from '../game/engine/core.js'
import {homeGoalInfo,setHomeGoal} from '../game/engine/homestead.js'
import {requestFunction} from '../game/ui.js'
defineProps({compact:Boolean})
const clock=ref(0),info=computed(()=>{clock.value;return homeGoalInfo()})
const goals=[{id:'soup',name:'自产汤'},{id:'feed',name:'备口粮'},{id:'stove',name:'小厨房'}]
let timer
onMounted(()=>{timer=setInterval(()=>clock.value++,10000)})
onBeforeUnmount(()=>clearInterval(timer))
</script>
<style scoped>.goal-compact{display:flex;justify-content:space-between;flex-shrink:0;padding:3px 0;margin:0 0 4px;font-size: max(var(--readable-min, 0px), 10px);color:var(--muted)}.goal-picker{padding:10px 0 14px}.goal-title{font-weight:700;font-size: max(var(--readable-min, 0px), 14px)}.goal-options{display:flex;gap:4px;margin:10px 0}.goal-options button{flex:1;margin:0;padding:7px 3px;line-height:1.4;font-size: max(var(--readable-min, 0px), 11px);background:var(--paper-deep);color:var(--ink)}.goal-options .active{background:var(--hud);color:#fff1d4}.goal-hint{display:block;font-size: max(var(--readable-min, 0px), 11px);line-height:1.7;color:var(--muted)}@media(max-width:959px){.goal-compact{min-height:44px;align-items:center;box-sizing:border-box;gap:8px}}
</style>
