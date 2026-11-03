<template><view class="warehouse"><view class="warehouse-tabs"><button v-for="t in tabs" :key="t.id" :class="{active:section===t.id}" @click="section=t.id">{{t.name}}</button></view><text v-if="section==='furniture' && !atHome" class="warehouse-hint">回家后可以摆放，仓库可随时查看。</text><text v-if="!goods.some(g=>g.count>0)" class="warehouse-hint">{{ section==='furniture'?'仓库里还没有家具，去商店挑一件吧。':'还没有库存，可以按自己的需要补货。' }}</text><view v-for="g in goods" :key="g.id" class="warehouse-row"><text>{{g.icon}}</text><view><text>{{g.name}} ×{{g.count}}</text><text class="warehouse-hint">{{g.tip}}</text></view><button v-if="section==='furniture'" :disabled="!atHome" @click="$emit('place',g.id)">摆放</button><view v-else class="warehouse-actions"><button @click="use(g)">去使用</button><button @click="requestFunction('shop',{category:g.category,product:g.id})">补货</button></view></view><button v-if="section==='furniture'" class="warehouse-shop" @click="requestFunction('shop',{category:'furniture'})">逛商店</button></view></template>
<script setup>
import {computed} from 'vue'
import {state} from '../game/engine/core.js'
import {ui,requestFunction} from '../game/ui.js'
import {FURNITURE} from '../game/data/world.js'
import {SUPPLIES} from '../game/data/homestead.js'
defineEmits(['place'])
const section=computed({get:()=>ui.homeTools.inventory,set:v=>ui.homeTools.inventory=v})
const tabs=[{id:'furniture',name:'家具'},{id:'seed',name:'种子'},{id:'feed',name:'口粮'}]
const atHome=computed(()=>state.location==='home')
const goods=computed(()=>section.value==='furniture'?Object.entries(state.furniture.inv).filter(([id,n])=>FURNITURE[id]&&n>0).map(([id,n])=>({id,...FURNITURE[id],count:n,tip:'摆放后才生效'})):Object.entries(SUPPLIES).filter(([,g])=>g.kind===section.value).map(([id,g])=>({id,...g,count:(section.value==='seed'?state.garden.seeds:state.garden.feed)[g.target]||0})))
function use(g){if(g.kind==='seed'){ui.selectedSeed=g.target;requestFunction('home')}else{ui.homeTools.pet=g.target;requestFunction('pets')}}
</script>
<style scoped>.warehouse-tabs{display:flex;gap:5px;margin-bottom:12px}.warehouse-tabs button{flex:1;margin:0;padding:7px;font-size:12px;line-height:1.4;background:var(--paper-deep);color:var(--ink)}.warehouse-tabs .active{background:var(--hud);color:#fff2d3}.warehouse-hint{display:block;font-size:10px;line-height:1.6;color:var(--muted);margin:5px 0}.warehouse-row{display:flex;align-items:center;gap:9px;padding:12px 0;border-bottom:1px solid var(--line);font-size:13px}.warehouse-row>text{font-size:26px}.warehouse-row>view:nth-child(2){flex:1;min-width:0}.warehouse-actions{display:flex;flex-direction:column;gap:5px}.warehouse-row button,.warehouse-shop{margin:0;padding:6px 9px;font-size:11px;line-height:1.4;background:var(--hud);color:#fff2d3}.warehouse-shop{margin-top:12px}</style>
