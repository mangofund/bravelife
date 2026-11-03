<template><view class="ren-conversation"><text class="ren-title">🧑‍🍳 莲的菜谱打算</text><template v-if="!ren"><text>每个人都有自己的安排。认识莲后，可以主动聊聊菜谱。</text><button v-if="state.social.ren" :disabled="busy" @click="run(()=>openRenConversation())">聊聊菜谱</button><button v-else @click="requestFunction('map',{location:'ramen'})">去认识莲</button></template><template v-else><text>他的目标：{{ren.goal}}</text><text class="ren-hint">{{ren.reason}}</text><template v-if="ren.status==='open'"><text>可以说说自己做过的菜，也可以只谈口味或拒绝。</text><view class="ren-actions"><button v-if="hasOwnMeal" :disabled="busy" @click="run(()=>respondRen('experience'))">分享经历</button><button :disabled="busy" @click="run(()=>respondRen('taste'))">谈谈口味</button><button :disabled="busy" @click="run(()=>respondRen('later'))">改天再聊</button><button :disabled="busy" @click="run(()=>respondRen('decline'))">暂不参与</button></view></template><template v-else><text>{{ren.outcome}}</text><text class="ren-hint">影响来源：{{ren.source.startsWith('homegrown:')?'你主动分享了自产料理的经历':ren.source}}。不扣材料，不额外发奖励。</text></template></template></view></template>
<script setup>
import {computed} from 'vue'
import {state} from '../game/engine/core.js'
import {openRenConversation,respondRen} from '../game/engine/homestead.js'
import {requestFunction} from '../game/ui.js'
import {useAction} from '../game/use-action.js'
const {busy,run}=useAction(),ren=computed(()=>state.homestead.ren),hasOwnMeal=computed(()=>state.homestead.experiences.some(e=>e.id.startsWith('homegrown:')))
</script>
<style scoped>.ren-conversation{margin:12px 0;padding:12px;background:var(--card);border:1px solid var(--line);border-radius:7px}.ren-title{font-weight:700;font-size:14px}.ren-conversation>text{display:block;margin:6px 0;font-size:12px;line-height:1.7}.ren-hint{color:var(--muted);font-size:10px!important}.ren-conversation button{margin:8px 0 0;padding:7px 10px;background:var(--hud);color:#fff2d4;font-size:11px;line-height:1.4}.ren-actions{display:flex;gap:6px;flex-wrap:wrap}</style>
