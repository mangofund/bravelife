<template>
  <view v-for="pet in residents" :key="pet.kind" class="pet-resident" :style="styleFor(pet)" :data-pet="pet.kind" :data-action="pet.action">
    <pet-actor :kind="pet.kind" :action="pet.action" :facing="pet.facing" :size="environment === 'room' ? 60 : 54" />
  </view>
</template>
<script setup>
import { computed, reactive, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import PetActor from './pet-actor.vue'
import { state } from '../../game/engine/core.js'
import { ui } from '../../game/ui.js'
import { PET_ROUTINES, petHabitat, petResting, nextPetSpot } from '../../game/pet-behavior.js'
const props=defineProps({environment:{type:String,required:true},points:{type:Array,required:true}})
const now=ref(Date.now()),turn=ref(0),positions=reactive({cat:null,dog:null}),facings=reactive({cat:1,dog:1})
const residents=computed(()=>['dog','cat'].flatMap(kind=>{
 const pet=state.garden.pets[kind]
 if(!pet||petHabitat(kind,pet,now.value)!==props.environment||!props.points.length)return []
 const spot=props.points.find(p=>p.id===positions[kind])||props.points[kind==='cat'?0:Math.min(1,props.points.length-1)]
 const action=petResting(pet,now.value)?'sleep':PET_ROUTINES[kind][(turn.value+(kind==='cat'?2:0))%PET_ROUTINES[kind].length]
 return [{kind,spot,action,facing:facings[kind]}]
}))
function styleFor(pet){return {left:pet.spot.left,top:pet.spot.top,zIndex:pet.spot.z||8,transitionDuration:pet.action==='run'?'2.4s':'0s'}}
function step(){
 if(!ui.gameVisible)return
 now.value=Date.now();turn.value++
 for(const pet of residents.value){
  if(pet.action!=='run'){positions[pet.kind]=pet.spot.id;continue}
  const next=nextPetSpot(props.points,pet.spot.id,turn.value+(pet.kind==='cat'?1:0))
  if(!next)continue
  // Isometric facing uses the rendered horizontal coordinate, not grid x.
  const delta=parseFloat(next.left)-parseFloat(pet.spot.left)
  if(delta)facings[pet.kind]=delta<0?-1:1
  positions[pet.kind]=next.id
 }
}
watch(()=>props.points,()=>{for(const kind of ['cat','dog'])if(!props.points.some(p=>p.id===positions[kind]))positions[kind]=null})
let timer
onMounted(()=>{timer=setInterval(step,2600)})
onBeforeUnmount(()=>clearInterval(timer))
</script>
<style>
.pet-resident{position:absolute;transform:translate(-50%,-88%);transition-property:left,top;transition-timing-function:linear;pointer-events:none}
</style>
