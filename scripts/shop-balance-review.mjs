// 审核稿的离线算表工具；不载入存档、不调用购买、不改线上数值。
import fs from 'node:fs'
import assert from 'node:assert/strict'
import { CROPS, HOUR } from '../src/game/data/garden.js'
import { ITEMS } from '../src/game/data/world.js'
import { initialGarden, advanceGarden, plant, ripe } from '../src/game/engine/garden-model.js'
const spec=JSON.parse(fs.readFileSync(new URL('../docs/design-data/shop-balance-v1.json',import.meta.url)))
const rounded=x=>Math.round(x*100)/100
function observedCycle(crop,visitHours){
  const g=initialGarden(),start=1700000000000
  advanceGarden(g,start);plant(g,0,crop,start)
  for(let t=visitHours;t<=480;t+=visitHours){
    advanceGarden(g,start+t*HOUR)
    if(ripe(g.plots[0]))return t
    g.plots[0].waterUntil=g.lastAt+24*HOUR
  }
  throw Error('未成熟')
}
const scenarios=[]
for(const visitHours of [12,24,48,72])for(const [crop,c] of Object.entries(CROPS)){
  assert.equal(spec.seeds[crop].price,c.seed)
  const cycleHours=observedCycle(crop,visitHours),cyclesPerDay=24/cycleHours
  const noTheft=4*(10*c.price-c.seed)*cyclesPerDay
  const maxTheft=4*(8*c.price-c.seed)*cyclesPerDay
  scenarios.push({visitHours,crop,cycleHours,fourPlotsNoTheftNetPerRealDay:rounded(noTheft),fourPlotsMaxTheftNetPerRealDay:rounded(maxTheft),fourPlotsDogNetPerRealDay:rounded(noTheft-spec.feed.dog.price),dogAdvantageOverMaxTheft:rounded(noTheft-spec.feed.dog.price-maxTheft)})
}
function addFeed(remainingHours,stock){
  const f=spec.feed.dog
  if(stock<1||Math.max(0,remainingHours)+f.hours>f.capHours)return {remainingHours,stock,ok:false}
  return {remainingHours:Math.max(0,remainingHours)+f.hours,stock:stock-1,ok:true}
}
assert.deepEqual(addFeed(48,2),{remainingHours:72,stock:1,ok:true})
assert.deepEqual(addFeed(48.01,2),{remainingHours:48.01,stock:2,ok:false})
assert.equal(addFeed(-1,1).remainingHours,24)
assert.equal(addFeed(0,0).ok,false)
const recipes=Object.entries(spec.recipes).map(([id,r])=>{
  const foregoneSale=Object.entries(r.produce).reduce((s,[k,n])=>s+CROPS[k].price*n,0)
  const cashIngredients=Object.entries(r.items).reduce((s,[k,n])=>s+ITEMS[k].price*n,0)
  const rawProduceHunger=Object.entries(r.produce).reduce((s,[k,n])=>s+CROPS[k].hunger*n,0)
  return {id,name:r.name,foregoneSale,cashIngredients,opportunityCost:foregoneSale+cashIngredients,adultHungerTimeCost:rounded(3*r.hours),lowSkillNetHunger:rounded(r.effects.hunger-3*r.hours),adultEnergyTimeCost:rounded(2.5*r.hours),adultMoodTimeCost:rounded(.6*r.hours),rawProduceHunger,lowSkillNetCookGainPerGameHour:r.cookGain/r.hours}
})
assert.equal(scenarios.find(s=>s.crop==='strawberry'&&s.visitHours===48).cycleHours,96)
const result={status:spec.status,assumptions:'稳态四格单作物；到访时浇水和及时重种；无盗窃或每批均被偷满两份；净收益扣种子，狗方案另扣100/现实日；不含领养、厨房及人物时间成本。料理为成年、厨艺0、属性未触顶、无事件时的理论边际值，不是完整游戏模拟。',scenarios,recipes,feed:{...spec.feed,sevenRealDayCostPerPet:700,twentyEightRealDayCostPerPet:2800},checks:'通过种子价格、真实成长规则、喂养容量及边界校验'}
fs.writeFileSync(new URL('../docs/design-data/shop-balance-report-v1.json',import.meta.url),JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(result,null,2))
