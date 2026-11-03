import assert from 'node:assert/strict'
const store={};let saveFails=false
const realError=console.error
console.error=(...args)=>{if(!saveFails)realError(...args)}
globalThis.uni={getStorageSync:k=>store[k]||'',setStorageSync:(k,v)=>{if(saveFails)throw Error('disk full');store[k]=v},showToast:()=>{}}
const core=await import('../src/game/engine/core.js')
const garden=await import('../src/game/engine/garden.js')
const { buyShopProduct:buy }=await import('../src/game/engine/shop.js')
const { HOUR }=await import('../src/game/data/garden.js')
const model=await import('../src/game/engine/garden-model.js')
const oldNow=Date.now;let now=1700000000000;Date.now=()=>now
let checks=0
function check(name,fn){fn();checks++;console.log('ok',name)}
function fresh(){core.resetState({...core.initialState(),started:true,money:10000,profile:{name:'测试',startAge:18,birth:{m:4,d:1},birthYear:2008}})}
fresh()
check('旧存档迁移不把旧收成冒充自产，库存补空',()=>{const old={...core.initialState(),money:345,garden:{produce:{radish:8},pets:{dog:{fedUntil:now+12*HOUR,energy:20}}}};delete old.homestead;core.resetState(old);assert.equal(core.state.money,345);assert.equal(core.state.garden.produce.radish,8);assert.equal(core.state.garden.ownProduce.radish,0);assert.equal(core.state.garden.seeds.radish,0);assert.equal(core.state.garden.pets.dog.fedUntil,now+12*HOUR);assert.equal(core.state.homestead.experiences.length,0)})
fresh()
check('种子购买只扣一次现金，播种只扣库存',()=>{assert.ok(buy('supply','seed_radish','buy-1'));assert.equal(core.state.money,9950);assert.equal(buy('supply','seed_radish','buy-1'),false);assert.equal(core.state.garden.seeds.radish,1);assert.ok(garden.sow(0,'radish','sow-1'));assert.equal(core.state.money,9950);assert.equal(core.state.garden.seeds.radish,0);assert.equal(garden.sow(0,'radish','sow-1'),false)})
check('不能自动现金播种、不能覆盖已有地块',()=>{assert.equal(garden.sow(1,'radish'),false);buy('supply','seed_radish');assert.equal(garden.sow(0,'radish'),false);assert.equal(core.state.garden.seeds.radish,1)})
check('外出和非法地块不消耗种子',()=>{core.state.location='park';assert.equal(garden.sow(1,'radish'),false);core.state.location='home';assert.equal(garden.sow(-1,'radish'),false);assert.equal(core.state.garden.seeds.radish,1)})
check('新收获记录自己的来源',()=>{now+=12*HOUR;assert.ok(garden.reap());assert.equal(core.state.garden.produce.radish,10);assert.equal(core.state.garden.ownProduce.radish,10)})
check('领养赠粮保留，按份叠加不覆盖',()=>{garden.adopt('dog');buy('supply','feed_dog');buy('supply','feed_dog');const m=core.state.money;assert.ok(garden.feed('dog'));assert.equal(core.state.garden.pets.dog.fedUntil,now+48*HOUR);assert.ok(garden.feed('dog'));assert.equal(core.state.garden.pets.dog.fedUntil,now+72*HOUR);assert.equal(core.state.money,m)})
check('口粮上限与缺粮不能扣库存',()=>{buy('supply','feed_dog');assert.equal(garden.feed('dog'),false);assert.equal(core.state.garden.feed.dog,1);core.state.garden.pets.dog.fedUntil=now+48*HOUR+1;assert.equal(garden.feed('dog'),false);core.state.garden.pets.dog.fedUntil=now+48*HOUR;assert.ok(garden.feed('dog'));assert.equal(core.state.garden.feed.dog,0);assert.equal(garden.feed('dog'),false)})
check('狗饥饿睡觉低耗，喂回后绝对守园',()=>{now+=73*HOUR;garden.syncGarden();assert.equal(model.dogGuards(core.state.garden,now),false);const e=core.state.garden.pets.dog.energy;now+=HOUR;garden.syncGarden();assert.ok(Math.abs(core.state.garden.pets.dog.energy-e+.02)<1e-8);buy('supply','feed_dog');assert.ok(garden.feed('dog'));assert.ok(model.dogGuards(core.state.garden,now))})
check('猫狗分粮、旧首日不重复赠送',()=>{garden.adopt('cat');buy('supply','feed_dog');assert.equal(garden.feed('cat'),false);const t=core.state.garden.pets.cat.fedUntil;core.resetState(JSON.parse(JSON.stringify(core.state)));assert.equal(core.state.garden.pets.cat.fedUntil,t);assert.equal(core.state.garden.feed.cat,0)})
check('回拨现实时间不能刷饱腹',()=>{const t=core.state.garden.pets.dog.fedUntil;now-=72*HOUR;buy('supply','feed_dog');assert.ok(garden.feed('dog'));assert.equal(core.state.garden.pets.dog.fedUntil,t+24*HOUR);assert.ok(core.state.garden.pets.dog.fedUntil-core.state.garden.lastAt<=72*HOUR)})
check('保存失败回滚购买及请求ID，可原请求重试',()=>{const before=JSON.stringify(core.state);saveFails=true;assert.equal(buy('supply','seed_tomato','retry-buy'),false);saveFails=false;assert.equal(JSON.stringify(core.state),before);assert.ok(buy('supply','seed_tomato','retry-buy'));assert.ok(core.load());assert.equal(buy('supply','seed_tomato','retry-buy'),false)})
check('保存失败回滚播种与库存',()=>{const before=JSON.stringify(core.state);saveFails=true;assert.equal(garden.sow(2,'tomato'),false);saveFails=false;assert.equal(JSON.stringify(core.state),before)})
const h=await import('../src/game/engine/homestead.js')
fresh()
core.state.furniture.placed=[{uid:1,fid:'stove',x:0,y:0}]
Object.assign(core.state.stats,{hunger:40,energy:80,mood:50,health:80})
check('配方缺鱼时不预扣番茄',()=>{core.state.garden.produce.tomato=3;const before=JSON.stringify(core.state);assert.equal(h.cookGardenRecipe('tomato_fish_soup'),false);assert.equal(JSON.stringify(core.state),before)})
check('新配方恢复与耗时符合数值，未知来源不冒充自产',()=>{core.state.garden.produce.radish=10;const hour=core.state.hour;assert.ok(h.cookGardenRecipe('radish_soup','meal-1'));assert.equal(core.state.garden.produce.radish,5);assert.equal(core.state.hour,hour+.5);assert.equal(core.state.stats.hunger,63.5);assert.equal(core.state.skills.cook,.5);assert.equal(core.state.homestead.experiences.length,0);assert.equal(h.cookGardenRecipe('radish_soup','meal-1'),false)})
check('自产经历只记录一次，不额外发属性或金钱',()=>{core.state.garden.produce.radish=10;core.state.garden.ownProduce.radish=10;const money=core.state.money;assert.ok(h.cookGardenRecipe('radish_soup'));assert.equal(core.state.homestead.experiences.length,1);assert.ok(h.cookGardenRecipe('radish_soup'));assert.equal(core.state.homestead.experiences.length,1);assert.equal(core.state.money,money)})
check('果盘无需厨房，不增加厨艺和料理次数',()=>{core.state.furniture.placed=[];core.state.garden.produce.strawberry=8;const skill=core.state.skills.cook,cooks=core.state.counters.cooks,meals=core.state.counters.meals;assert.ok(h.cookGardenRecipe('strawberry_plate'));assert.equal(core.state.skills.cook,skill);assert.equal(core.state.counters.cooks,cooks);assert.equal(core.state.counters.meals,meals+1);core.state.garden.produce.radish=5;assert.equal(h.cookGardenRecipe('radish_soup'),false)})
check('满属性预览不会承诺溢出恢复，果盘没有厨艺加成',()=>{core.state.stats.hunger=100;core.state.stats.mood=100;core.state.skills.cook=100;const info=h.recipeInfo('strawberry_plate');assert.equal(info.effects.hunger,14);assert.equal(info.actual.hunger,.8);assert.equal(info.skill,0)})
check('制作保存失败回滚材料、游戏时间、技能和首次经历',()=>{core.state.furniture.placed=[{uid:1,fid:'stove',x:0,y:0}];core.state.garden.produce.tomato=3;core.state.garden.ownProduce.tomato=3;core.state.bag.fish=1;const before=JSON.stringify(core.state);saveFails=true;assert.equal(h.cookGardenRecipe('tomato_fish_soup'),false);saveFails=false;assert.equal(JSON.stringify(core.state),before)})
check('生活目标只存提示，不扣钱也不锁材料',()=>{const m=core.state.money,n=core.state.garden.produce.tomato;assert.ok(h.setHomeGoal('stove'));assert.ok(h.homeGoalInfo().done);assert.equal(core.state.money,m);assert.equal(core.state.garden.produce.tomato,n)})
check('策略可复制编辑，保存来源且不执行操作',()=>{const m=core.state.money;assert.ok(h.copyStrategy('daily-garden'));let d=core.state.homestead.drafts[0];assert.ok(h.saveStrategy(d.id,{title:'自己的种植安排',result:'这次晚收，下一次留足做汤材料。'}));assert.equal(core.state.homestead.drafts[0].title,'自己的种植安排');assert.equal(core.state.money,m);assert.ok(core.state.homestead.drafts[0].source);assert.ok(h.copyStrategy(d.id));assert.notEqual(core.state.homestead.drafts[0].id,d.id)})
check('不认识莲时没有凭空的私人主线影响',()=>assert.equal(h.openRenConversation(),false))
check('NPC主线基于自己的安排，回应不扣材料或额外发钱',()=>{core.state.social.ren={aff:1,status:'none'};core.state.hour=20;const m=core.state.money,n=core.state.garden.produce.tomato;assert.ok(h.openRenConversation());assert.equal(core.state.homestead.ren.goal,'先做好今晚的家常汤底');assert.ok(h.respondRen('experience'));assert.ok(core.state.homestead.ren.outcome.includes('收工后'));assert.equal(core.state.money,m);assert.equal(core.state.garden.produce.tomato,n);assert.equal(h.respondRen('experience'),false)})
check('刷新恢复不会重抽NPC结果或复制经历',()=>{const r=JSON.stringify(core.state.homestead.ren),n=core.state.homestead.experiences.length;core.save();core.load();assert.equal(JSON.stringify(core.state.homestead.ren),r);assert.equal(core.state.homestead.experiences.length,n);assert.equal(h.openRenConversation(),false)})
check('分享导入只包含手记字段，不携带资产或私人人生',()=>{const id=core.state.homestead.drafts[0].id;const text=h.strategyShareText(id),data=JSON.parse(text);assert.equal(data.money,undefined);assert.equal(data.experiences,undefined);const m=core.state.money;assert.ok(h.importStrategy(text));assert.equal(core.state.money,m);assert.ok(core.state.homestead.drafts[0].source.startsWith('外部手记：'));assert.equal(h.importStrategy('{bad'),false);assert.equal(h.importStrategy(JSON.stringify({format:'other',title:'x'})),false)})
check('草稿删除只影响自己的手记，非法修改不清空标题',()=>{const d=core.state.homestead.drafts[0];assert.equal(h.saveStrategy(d.id,{title:'  '}),false);assert.ok(core.state.homestead.drafts.some(x=>x.id===d.id));assert.ok(h.removeStrategy(d.id));assert.equal(core.state.homestead.drafts.some(x=>x.id===d.id),false)})
const {readFileSync}=await import('node:fs')
const approved=JSON.parse(readFileSync(new URL('../docs/design-data/shop-balance-v1.json',import.meta.url)))
const data=await import('../src/game/data/homestead.js')
check('实际配置与已确认数值逐项一致',()=>{for(const [id,r] of Object.entries(approved.recipes)){const live=data.RECIPES[id];for(const key of ['produce','items','hours','effects','cookGain'])assert.deepEqual(live[key],r[key]);assert.equal(Number(live.kitchen),r.kitchen)}for(const [id,v] of Object.entries(approved.seeds))assert.equal(data.SUPPLIES['seed_'+id].price,v.price);for(const [id,v] of Object.entries(approved.feed))for(const key of ['price','hours','capHours'])assert.equal(data.SUPPLIES['feed_'+id][key],v[key])})
check('NPC允许拒绝，不要求自产料理、不改职业或好感',()=>{fresh();core.state.social.ren={aff:20,status:'none'};assert.ok(h.openRenConversation());assert.ok(h.respondRen('decline'));assert.equal(core.state.social.ren.aff,20);assert.equal(core.state.homestead.ren.status,'declined');assert.equal(core.state.homestead.experiences.length,1)})
check('行动结算检查身体状态，不能靠制作跳过精力耗尽',()=>{core.state.garden.produce.strawberry=4;core.state.stats.energy=.1;assert.ok(h.cookGardenRecipe('strawberry_plate'));assert.ok(core.state.stats.energy>0)})
Date.now=oldNow
console.error=realError
console.log(checks+' checks passed')
