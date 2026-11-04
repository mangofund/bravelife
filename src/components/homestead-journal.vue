<template><view class="homestead-journal"><home-goals /><text class="journal-title">自己的经营经历</text><text v-if="!state.homestead.experiences.length" class="journal-hint">还没有记录。用自己新收获的作物做一餐，或和认识的莲聊聊菜谱。</text><view v-for="e in state.homestead.experiences" :key="e.id" class="journal-entry"><text>{{e.title}}</text><text class="journal-hint">{{fmtDay(e.day)}} · {{realDate(e.at)}}</text><text>{{e.text}}</text></view><text class="journal-hint">这些是自己的经历，记录本身不会重复发放制作奖励。</text></view></template>
<script setup>
import {state} from '../game/engine/core.js'
import {fmtDay} from '../game/engine/calendar.js'
import HomeGoals from './home-goals.vue'
function realDate(at){const d=new Date(at);return '现实 '+d.getFullYear()+'/'+(d.getMonth()+1)+'/'+d.getDate()}
</script>
<style scoped>.homestead-journal{margin:8px 0 14px}.journal-title{font-weight:700;font-size: max(var(--readable-min, 0px), 14px)}.journal-entry{padding:12px 0;border-bottom:1px solid var(--line)}.journal-entry>text{display:block;font-size: max(var(--readable-min, 0px), 12px);line-height:1.8}.journal-entry>text:first-child{font-weight:700}.journal-hint{display:block;font-size: max(var(--readable-min, 0px), 10px)!important;color:var(--muted);line-height:1.7;margin:6px 0}</style>
