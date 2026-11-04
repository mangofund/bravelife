import fs from 'node:fs'
import assert from 'node:assert/strict'
const base=new URL('../', import.meta.url).pathname
let stored=false, calls=[]
globalThis.uni={getStorageSync:()=>stored,setStorageSync:(key,v)=>{assert.equal(key,'bravelife_sound_muted_v1');stored=v},createInnerAudioContext:()=>({src:'',volume:1,seek(){},play(){calls.push({src:this.src,volume:this.volume})}})}
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64')
const audioUrl=url(fs.readFileSync(base+'src/game/audio.js','utf8'))
const audio=await import(audioUrl)
globalThis.audioTestState={courage:{value:0,questsDone:0},tutorial:{step:0},life:{goals:{}},social:{ren:{aff:10,status:'none'}}}
let helper=fs.readFileSync(base+'src/game/action-audio.js','utf8').replace("'./engine/core.js'",JSON.stringify(url('export const state=globalThis.audioTestState'))).replace("'./audio.js'",JSON.stringify(audioUrl))
const {actionAudio,switchAudio}=await import(url(helper)),s=globalThis.audioTestState
const check=(event,fn)=>{calls=[];fn();assert.equal(calls.length,event?1:0);if(event)assert.equal(calls[0].src,'/static/audio/'+audio.SOUND_MAP[event])}
check('plant',()=>actionAudio(()=>true,'plant'))
check('petFeed',()=>actionAudio(()=>true,'petFeed'))
check('harvest',()=>actionAudio(()=>true,'harvest'))
check('error',()=>actionAudio(()=>false,'plant',{visibleFailure:true}));assert.equal(calls[0].volume,.5)
check(null,()=>actionAudio(()=>false,'confirm'))
check(null,()=>actionAudio(()=>true,null))
check('courage',()=>actionAudio(()=>{s.courage.value++;return true}))
check('confirm',()=>actionAudio(()=>{s.courage.value--;return true}))
check('affection',()=>actionAudio(()=>{s.social.ren.aff++;return true}))
check('confirm',()=>actionAudio(()=>{s.social.ren.aff--;return true}))
check('keyMoment',()=>actionAudio(()=>{s.social.ren.status='dating';return true},'dialogue',{keyMoment:true}))
check('dialogue',()=>actionAudio(()=>true,'dialogue',{keyMoment:true}))
check('taskComplete',()=>actionAudio(()=>{s.courage.questsDone++;s.courage.value++;return true}))
s.job={career:'ramen',level:0}
check('keyMoment',()=>actionAudio(()=>{s.job.level++;return true},'confirm',{keyMoment:true}))
check('confirm',()=>actionAudio(()=>true,'confirm',{keyMoment:true}))
check('taskComplete',()=>actionAudio(()=>{s.tutorial.step++;return true}))
check('taskComplete',()=>actionAudio(()=>{s.life.goals.first=1;return true}))
check(null,()=>switchAudio('a','a',()=>assert.fail()))
calls=[];for(let i=0;i<7;i++)switchAudio('a','b',()=>{});assert.deepEqual(calls.map(c=>c.src),[...audio.TAB_SWITCH_VARIANTS,audio.TAB_SWITCH_VARIANTS[0]].map(f=>'/static/audio/'+f))
audio.setMuted(true);check(null,()=>audio.play('click'));check(null,()=>audio.playTabSwitch());assert.equal(stored,true)
const reloaded=await import(audioUrl+'#refresh');assert.equal(reloaded.isMuted(),true)
audio.setMuted(false);check('toggle',()=>audio.play('toggle'))
for(const event of audio.SOUND_TBD)check(null,()=>audio.play(event))
console.log('PASS: action success/failure, real deltas, rare relationship milestone, completion priority, single playback, tab rotation, mute persistence, error volume, all TBD silent')
