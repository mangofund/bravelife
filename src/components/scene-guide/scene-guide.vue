<template>
  <view v-if="guide && ui.gameVisible" class="scene-guide-float" :style="position" @click.stop>
    <view v-if="expanded" class="scene-guide-bubble" role="dialog" aria-label="操作提示">
      <text class="scene-guide-text">{{ pages[page] }}</text>
      <view class="scene-guide-footer"><text>{{ page + 1 }}/{{ pages.length }}</text><button :aria-label="page < pages.length - 1 ? '知道了，下一页' : '知道了，收起提示'" @click="advance">知道了</button></view>
    </view>
    <button v-else class="scene-guide-reopen" aria-label="重新查看操作提示" @click="reopen">💡</button>
    <view v-if="!anchored" class="scene-guide-companion"><hero-doll :profile="state.profile" :size="78" /></view>
  </view>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import HeroDoll from '../hero-doll/hero-doll.vue'
import { SCENE_GUIDES } from '../../game/data/scene-guides.js'
import { guidePages } from '../../game/guide-pages.js'
import { ui } from '../../game/ui.js'
import { state } from '../../game/engine/core.js'
const props=defineProps({scene:{type:String,required:true},floatingPanel:Boolean})
const expanded=ref(true),page=ref(0)
const guide=computed(()=>SCENE_GUIDES[props.scene]||(props.scene.startsWith('location:')?SCENE_GUIDES.location:null))
const pages=computed(()=>guidePages(guide.value))
const anchor=computed(()=>props.floatingPanel?null:ui.guideAnchors[props.scene==='map'?'map':'room'])
const anchored=computed(()=>!!anchor.value && anchor.value.top>120 && anchor.value.top<ui.height-70)
const position=computed(()=>{
 const width=176,rect=anchored.value?anchor.value:null
 const x=rect?rect.left+rect.width/2:ui.width-108
 const y=rect?rect.top+Math.min(20,rect.height*.2):ui.height-160
 return {left:Math.max(8,Math.min(ui.width-width-8,x-width/2))+'px',top:Math.max(12,Math.min(ui.height-238,y-(expanded.value?132:54)))+'px'}
})
const storageKey=()=> 'bravelife:scene-guide:v2:'+props.scene
watch(()=>props.scene,()=>{page.value=0;try{expanded.value=!uni.getStorageSync(storageKey())}catch{expanded.value=true}},{immediate:true})
function advance(){if(page.value<pages.value.length-1){page.value++;return}expanded.value=false;try{uni.setStorageSync(storageKey(),true)}catch{}}
function reopen(){page.value=0;expanded.value=true}
</script>
<style>
.scene-guide-float{position:fixed;z-index:110;width:176px;pointer-events:auto;color:var(--ink);transition:left .25s linear,top .25s linear}
.scene-guide-bubble{position:relative;width:176px;box-sizing:border-box;padding:9px 10px 5px;border:1px solid var(--line);border-radius:12px;background:var(--card);box-shadow:0 3px 12px #30251b26}
.scene-guide-bubble::after{content:'';position:absolute;bottom:-6px;left:calc(50% - 6px);width:10px;height:10px;transform:rotate(45deg);background:var(--card);border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
.scene-guide-title{display:block;font-size:14px;font-weight:700;line-height:1.4;margin-bottom:4px}
.scene-guide-text{display:block;font-size:14px;line-height:1.5;min-height:42px}
.scene-guide-footer{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--muted)}
.theme-root .scene-guide-footer button{margin:0;background:transparent;color:var(--ink);min-width:64px;min-height:44px;padding:5px 2px;line-height:1.4;font-size:14px;border:0}
.scene-guide-footer button::after{border:0}
.theme-root .scene-guide-reopen{margin:0 auto;min-width:44px;min-height:44px;width:44px;padding:0;border-radius:50%;font-size:20px;background:var(--card);line-height:44px}
.scene-guide-companion{position:absolute;top:calc(100% + 8px);left:calc(50% - 20px);pointer-events:none}
</style>
