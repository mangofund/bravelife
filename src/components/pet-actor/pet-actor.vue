<template>
  <view class="pet-actor" :style="{width:size+'px',height:size*112/128+'px',transform:'scaleX('+facing+')'}" role="img" :aria-label="label">
    <canvas :id="canvasId" :canvas-id="canvasId" :style="{width:size+'px',height:size*112/128+'px'}" />
    <text v-if="failed" class="pet-load-fallback">{{ kind === 'cat' ? '🐈' : '🐕' }}</text>
  </view>
</template>
<script setup>
import { ref, watch, onMounted, onBeforeUnmount, getCurrentInstance, nextTick, computed } from 'vue'
import { loadPetSVGA, drawPetFrame } from '../../game/animation/svga-player.js'
import { ui } from '../../game/ui.js'
const props=defineProps({kind:{type:String,required:true},action:{type:String,default:'idle'},facing:{type:Number,default:1},size:{type:Number,default:64}})
const labels={idle:'悠闲摇尾',run:'小跑',jump:'蹦跳',groom:'舔爪洗脸',sniff:'低头嗅闻',sleep:'蜷身休息'}
const label=computed(()=>(props.kind==='cat'?'小猫':'小狗')+' · '+labels[props.action])
const instance=getCurrentInstance(),canvasId='pet-'+instance.uid
const failed=ref(false)
let ctx,movie,timer,frame=0,request=0,disposed=false
function stop(){clearInterval(timer);timer=null}
function start(){stop();if(!ctx||!movie||!ui.gameVisible)return;drawPetFrame(ctx,movie,frame,props.size);timer=setInterval(()=>{frame=(frame+1)%movie.params.frames;drawPetFrame(ctx,movie,frame,props.size)},1000/movie.params.fps)}
async function load(){const token=++request;stop();try{const data=await loadPetSVGA(props.kind,props.action);if(disposed||token!==request)return;movie=data;frame=0;failed.value=false;start()}catch{if(!disposed&&token===request)failed.value=true}}
watch(()=>[props.kind,props.action],()=>{if(ctx)load()})
watch(()=>ui.gameVisible,visible=>visible?start():stop())
onMounted(async()=>{await nextTick();if(disposed)return;ctx=uni.createCanvasContext(canvasId,instance.proxy);load()})
onBeforeUnmount(()=>{disposed=true;request++;stop();ctx=null;movie=null})
</script>
<style>
.pet-actor{position:relative;pointer-events:none;transform-origin:center center}.pet-actor canvas{display:block}.pet-load-fallback{position:absolute;inset:0;font-size:38px;text-align:center}
</style>
