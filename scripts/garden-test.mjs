import assert from 'node:assert/strict'
import { initialGarden, normalizeGarden, advanceGarden, plant, harvest, ripe, dogGuards, steal } from '../src/game/engine/garden-model.js'
import { HOUR } from '../src/game/data/garden.js'
let checks = 0
function check(label, run) { run(); checks++; console.log('ok', label) }
const start = 1700000000000
const g = initialGarden()
advanceGarden(g, start)
check('播种并拒绝重复播种', () => { assert.equal(plant(g,0,'radish',start),true); assert.equal(plant(g,0,'tomato',start),false) })
check('拒绝非法地块和种子', () => { assert.equal(plant(g,-1,'radish',start),false); assert.equal(plant(g,4,'radish',start),false); assert.equal(plant(g,1,'bogus',start),false) })
check('未成熟不能收获', () => assert.equal(harvest(g,0),0))
advanceGarden(g, start + 12*HOUR)
check('离线十二小时成熟', () => assert.ok(ripe(g.plots[0])))
g.pets.dog = { fedUntil:start+24*HOUR, energy:100, lastCuddle:0 }
check('狗在园完全挡住多名访客', () => { for(let i=0;i<8;i++) assert.equal(steal(g,0,'v'+i,false,g.lastAt),false); assert.equal(g.plots[0].stolen,0) })
advanceGarden(g,start+24*HOUR)
check('饥饿边界离园', () => assert.equal(dogGuards(g,g.lastAt),false))
const energy = g.pets.dog.energy
advanceGarden(g,start+48*HOUR)
check('睡眠一天仅消耗0.48体力', () => assert.ok(Math.abs(energy-g.pets.dog.energy-.48)<1e-8))
check('主人在场即使狗睡觉也不能偷', () => assert.equal(steal(g,0,'v1',true,g.lastAt),false))
check('狗睡觉且主人不在才可偷，同一人不可重试', () => { assert.equal(steal(g,0,'v1',false,g.lastAt),'radish'); assert.equal(steal(g,0,'v1',false,g.lastAt),false) })
check('全体访客最多两份，主人保留八份', () => { assert.equal(steal(g,0,'v2',false,g.lastAt),'radish'); assert.equal(steal(g,0,'v3',false,g.lastAt),false); assert.equal(harvest(g,0),8); assert.equal(g.produce.radish,8) })
check('重复收获不增加库存', () => { assert.equal(harvest(g,0),0); assert.equal(g.produce.radish,8) })
g.pets.dog.fedUntil=g.lastAt+48*HOUR
check('喂饱后重新看园', () => assert.ok(dogGuards(g,g.lastAt)))
plant(g,1,'strawberry',g.lastAt)
const plantedAt=g.lastAt
advanceGarden(g,plantedAt+48*HOUR)
check('缺水后半速，48小时仅长36小时', () => { assert.equal(g.plots[1].progress,36*HOUR); assert.equal(ripe(g.plots[1]),false) })
advanceGarden(g,plantedAt+72*HOUR)
check('缺水不死亡，最终仍能成熟', () => assert.ok(ripe(g.plots[1])))
advanceGarden(g,plantedAt+720*HOUR)
check('成熟不会腐烂', () => assert.ok(ripe(g.plots[1])))
const last=g.lastAt, progress=g.plots[1].progress
advanceGarden(g,start)
check('时钟回拨不倒退或重复成长', () => { assert.equal(g.lastAt,last); assert.equal(g.plots[1].progress,progress) })
check('保存后恢复不丢批次、访客、宠物', () => assert.deepEqual(normalizeGarden(JSON.parse(JSON.stringify(g))),normalizeGarden(g)))
check('旧存档与畸形新字段有默认值', () => { assert.deepEqual(normalizeGarden(null),initialGarden()); const x=normalizeGarden({plots:[{crop:'invalid'}],pets:{dog:{energy:-3}},produce:{radish:-5}}); assert.equal(x.plots[0],null); assert.equal(x.produce.radish,0); assert.equal(x.pets.dog.energy,100) })

// 通过真实行动入口验证扣款、旧本地存档和云端共用 resetState 入口。
const store={}
globalThis.uni={getStorageSync:k=>store[k]||'',setStorageSync:(k,v)=>store[k]=v,showToast:()=>{}}
const core=await import('../src/game/engine/core.js')
const actions=await import('../src/game/engine/garden.js')
const {buyShopProduct:buy}=await import('../src/game/engine/shop.js')
core.resetState({...core.initialState(),started:true,money:10000})
const oldNow=Date.now
let clock=start
Date.now=()=>clock
try {
 check('买种扣钱、播种扣库存',()=>{ buy('supply','seed_radish'); assert.ok(actions.sow(0,'radish')); assert.equal(core.state.money,9950); assert.equal(actions.sow(0,'radish'),false); assert.equal(core.state.money,9950) })
 check('在外面不能操作自家菜园',()=>{core.state.location='park'; assert.equal(actions.sow(1,'radish'),false);core.state.location='home'})
 check('没有种子不会种植',()=>{const money=core.state.money;core.state.money=0;assert.equal(actions.sow(1,'radish'),false);assert.equal(core.state.garden.plots[1],null);core.state.money=money})
 check('领养与喂养不会重复收费',()=>{assert.ok(actions.adopt('dog'));const money=core.state.money;assert.equal(actions.adopt('dog'),false);assert.equal(core.state.money,money);clock+=HOUR;buy('supply','feed_dog');buy('supply','feed_dog');assert.ok(actions.feed('dog'));assert.ok(actions.feed('dog'));const fed=core.state.money;assert.equal(actions.feed('dog'),false);assert.equal(core.state.money,fed)})
 check('猫的心情奖励每天只发一次',()=>{actions.adopt('cat');core.state.stats.mood=50;actions.cuddleCat();actions.cuddleCat();assert.equal(core.state.stats.mood,54)})
 check('收获出售使用真实账本，不能重复卖',()=>{clock+=12*HOUR;actions.reap();assert.equal(core.state.garden.produce.radish,10);const m=core.state.money;actions.useProduce('radish',true);assert.equal(core.state.money,m+150);assert.equal(actions.useProduce('radish',true),false)})
 check('旧本地存档自动增加新菜园且保留金钱',()=>{const old={...core.initialState(),started:true,money:123};delete old.garden;store[core.SAVE_KEY]=JSON.stringify(old);assert.ok(core.load());assert.equal(core.state.money,123);assert.equal(core.state.garden.plots.length,4)})
 check('云恢复使用的resetState也补齐部分菜园字段',()=>{core.resetState({...core.initialState(),garden:{produce:{radish:3}}});assert.equal(core.state.garden.produce.radish,3);assert.equal(core.state.garden.plots.length,4);assert.equal(core.state.garden.pets.dog,null)})
} finally {Date.now=oldNow}
console.log(checks+' checks passed')
