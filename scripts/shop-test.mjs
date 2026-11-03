import assert from 'node:assert/strict'
const store={}
globalThis.uni={getStorageSync:k=>store[k]||'',setStorageSync:(k,v)=>store[k]=v,showToast:()=>{}}
const core=await import('../src/game/engine/core.js')
const {buyShopProduct:buy}=await import('../src/game/engine/shop.js')
const {ITEMS,FURNITURE}=await import('../src/game/data/world.js')
let checks=0
function check(label,run){run();checks++;console.log('ok',label)}
core.resetState({...core.initialState(),started:true,money:100000,location:'park'})
check('外出可购物，食物准确扣款进入背包',()=>{const n=core.state.bag.onigiri||0;assert.equal(buy('item','onigiri'),true);assert.equal(core.state.money,99850);assert.equal(core.state.bag.onigiri,n+1)})
check('家具送入仓库，不自动摆放',()=>{const n=core.state.furniture.placed.length;assert.equal(buy('furniture','plant'),true);assert.equal(core.state.money,96850);assert.equal(core.state.furniture.inv.plant,1);assert.equal(core.state.furniture.placed.length,n)})
check('非法商品及特殊纪念品不扣款',()=>{const m=core.state.money;for(const [k,id] of [['other','onigiri'],['item','bogus'],['item','toString'],['furniture','old_ticket'],['furniture','cat']])assert.equal(buy(k,id),false);assert.equal(core.state.money,m)})
check('不足资金不增库存、不扣款',()=>{core.state.money=149;const n=core.state.bag.onigiri;assert.equal(buy('item','onigiri'),false);assert.equal(core.state.money,149);assert.equal(core.state.bag.onigiri,n)})
check('恰好足够资金可买一次',()=>{core.state.money=150;const n=core.state.bag.onigiri;assert.equal(buy('item','onigiri'),true);assert.equal(core.state.money,0);assert.equal(buy('item','onigiri'),false);assert.equal(core.state.bag.onigiri,n+1)})
check('所有上架商品可按原价购买并保存',()=>{for(const [k,goods] of [['item',ITEMS],['furniture',FURNITURE]])for(const [id,g] of Object.entries(goods)){if(g.courage||id==='cat')continue;core.state.money=g.price;assert.equal(buy(k,id),true);assert.equal(core.state.money,0)}assert.ok(Object.keys(store).length)})
console.log(checks+' checks passed')
