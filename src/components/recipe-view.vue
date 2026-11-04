<template><view class="recipe-view"><text class="recipe-note">制作后当餐吃 · 耗时为游戏时间 · 恢复为预计值</text><view v-for="r in recipes" :key="r.id" class="recipe-card"><view class="recipe-heading"><text>{{ r.icon }} {{ r.name }}</text><text>{{ fmtHours(r.hours) }}</text></view><text class="recipe-materials">{{ r.materials.map(m=>m.name+' '+m.count+'/'+m.need).join(' · ') }}</text><text class="recipe-effects">预计恢复 {{ describe(r.actual) }}{{ r.skill ? ' · 厨艺+'+r.skill : '' }}</text><text v-if="r.reason" class="recipe-reason">{{ r.reason }}</text><view class="recipe-buttons"><button :disabled="busy || !!r.reason" @click="run(()=>cookGardenRecipe(r.id))">{{ r.kitchen ? '制作并吃' : '切盘吃' }}</button><button v-if="r.reason && r.reason.includes('炉具')" @click="supplyKitchen">买炉具</button><button v-else-if="r.missing.length" @click="supply(r)">{{ r.missing.some(m=>!m.produce) ? '补货' : '备种' }}</button></view><text v-if="r.missing.some(m=>m.produce)" class="recipe-note">蔬果需从菜园收获，买种子不会立即得到食材。</text></view></view></template>
<script setup>
import { computed } from 'vue'
import { RECIPES } from '../game/data/homestead.js'
import { recipeInfo, cookGardenRecipe } from '../game/engine/homestead.js'
import { fmtHours, describe } from '../game/engine/core.js'
import { requestFunction } from '../game/ui.js'
import { useAction } from '../game/use-action.js'
const {busy,run}=useAction()
const recipes=computed(()=>Object.keys(RECIPES).map(recipeInfo))
function supply(r){const m=r.missing.find(m=>!m.produce)||r.missing[0];requestFunction('shop',{category:m.category,product:m.id})}
function supplyKitchen(){requestFunction('shop',{category:'furniture',product:'stove'})}
</script>
<style scoped>.recipe-note{display:block;font-size: max(var(--readable-min, 0px), 10px);line-height:1.5;color:var(--muted);margin:5px 0}.recipe-card{padding:12px 0;border-bottom:1px solid var(--line)}.recipe-heading{display:flex;justify-content:space-between;gap:6px;font-size: max(var(--readable-min, 0px), 14px);font-weight:700}.recipe-heading>text:last-child{font-size: max(var(--readable-min, 0px), 11px);font-weight:400}.recipe-materials,.recipe-effects,.recipe-reason{display:block;font-size: max(var(--readable-min, 0px), 11px);line-height:1.7;margin-top:5px}.recipe-reason{color:var(--muted)}.recipe-buttons{display:flex;gap:8px;margin-top:8px}.recipe-buttons button{margin:0;padding:7px 12px;font-size: max(var(--readable-min, 0px), 12px);line-height:1.4;color:#fff2d3;background:var(--hud)}.recipe-buttons button[disabled]{opacity:.4}</style>
