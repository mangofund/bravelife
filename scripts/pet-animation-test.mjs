import fs from 'node:fs'
import assert from 'node:assert/strict'
import { decodePetSVGA, drawPetFrame } from '../src/game/animation/svga-player.js'
import { PET_ROUTINES, PET_CLIPS, petHabitat, nextPetSpot, petMealAction, petMealPending } from '../src/game/pet-behavior.js'
import { guidePages } from '../src/game/guide-pages.js'
import { SCENE_GUIDES } from '../src/game/data/scene-guides.js'
let draws=0
const ctx=new Proxy({}, {get:(_,key)=>(...args)=>{for(const v of args)if(typeof v==='number')assert(Number.isFinite(v),key);if(key==='draw')draws++}})
for(const kind of ['cat','dog'])for(const action of [...new Set([...PET_ROUTINES[kind], 'greet', 'call', 'eat', 'toilet', 'play'].map(action => PET_CLIPS[action] || action))]){
 const buf=fs.readFileSync(`src/static/pets/${kind}-${action}.svga`)
 const movie=decodePetSVGA(buf)
 assert.equal(movie.params.fps,12);assert.equal(movie.params.viewBoxWidth,128)
 assert(movie.sprites[0].imageKey.endsWith('.vector'))
 for(let i=0;i<24;i++){assert(movie.sprites[0].frames[i].shapes.length>=8);drawPetFrame(ctx,movie,i,64)}
 const encoded=movie.sprites[0].frames.map(f=>JSON.stringify(f.shapes))
 assert(new Set(encoded).size>4,`${kind}/${action} must actually animate`)
}
assert.equal(draws,480)
assert.equal(petHabitat('dog',{fedUntil:200,energy:50},100),'garden')
assert.equal(petHabitat('dog',{fedUntil:80,energy:50},100),'room')
assert.equal(petHabitat('dog',{fedUntil:200,energy:5},100),'room')
assert.equal(petHabitat('cat',{fedUntil:200,energy:50},100),'room')
const points=[{id:'a',x:0,y:0},{id:'b',x:1,y:0},{id:'c',x:2,y:0},{id:'isolated',x:8,y:8}]
assert.equal(petHabitat('cat',{fedUntil:200,energy:50},100,PET_ROUTINES.cat.length),'garden')
assert.equal(petHabitat('dog',{fedUntil:200,energy:50},100,PET_ROUTINES.dog.length),'room')
assert.equal(nextPetSpot(points,'a',0).id,'b')
assert.equal(nextPetSpot(points,'b',0,'a').id,'c')
assert.equal(nextPetSpot(points,'a',0,null,p=>p.id==='c').id,'b')
assert.equal(nextPetSpot(points,'a',0,null,p=>p.id==='isolated').id,'a')
assert.equal(nextPetSpot(points,'isolated',0).id,'isolated')
assert.equal(nextPetSpot([],'a'),null)
const meal = { lastMealAt: 100 }
const firstCare = { meal: 0, stage: 0, activities: [] }
const secondCare = { meal: 0, stage: 0, activities: [] }
assert.equal(petMealAction(meal, firstCare, 110, () => 0), 'eat')
assert.equal(petMealAction(meal, secondCare, 110, () => .99), 'eat')
assert.notDeepEqual(firstCare.activities, secondCare.activities)
assert.deepEqual([...new Set(firstCare.activities)].sort(), ['eat', 'play', 'sleep', 'toilet'])
firstCare.stage++
assert.equal(petMealAction(meal, firstCare, 110), firstCare.activities[1])
firstCare.stage = firstCare.activities.length
assert.equal(petMealPending(meal, firstCare, 110), false)
assert.equal(petMealAction({ lastMealAt: 120 }, firstCare, 120), 'eat')
for(const g of Object.values(SCENE_GUIDES)){const pages=guidePages(g);assert(pages.length>0);assert(pages.every(p=>Array.from(p).length<=30));assert.equal(pages.join(''),g.text)}
console.log('PASS: 20 real SVGA clips / 480 drawable moving frames, pet habitat/rest rules, adjacent movement, all hint pages bounded and lossless')
