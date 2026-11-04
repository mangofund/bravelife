<template>
  <view class="shop-view">
    <scroll-view scroll-x class="category-scroll" :scroll-into-view="'shop-tab-' + category"><view class="shop-categories"><button v-for="c in categories" :id="'shop-tab-' + c.id" :key="c.id" :class="{ active: category === c.id }" @click="switchAudio(category, c.id, v => category = v)">{{ c.name }}</button></view></scroll-view>
    <text class="shop-hint">{{ hint }} · 余额 {{ fmtMoney(state.money) }}</text>
    <view v-for="g in goods" :key="g.id" class="shop-product" :class="{ focused: ui.shopProduct === g.id }">
      <view class="product-main"><text class="product-icon">{{ g.icon }}</text><view class="product-copy"><text>{{ g.name }}</text><text class="muted">{{ g.tip }}</text><text class="muted">已拥有 {{ owned(g) }} · {{ fmtMoney(g.price) }}</text></view><button :disabled="busy || state.money < g.price" @click="purchase(g)">{{ busy && pending === g.id ? '处理中' : confirming === g.id ? '确认' : '购买' }}</button></view>
      <view v-if="confirming === g.id" class="product-followup"><text>购买1件，共 {{ fmtMoney(g.price) }}</text><button @click="confirming = ''">取消</button></view>
      <view v-if="bought === g.id" class="product-followup"><text>已入库</text><button @click="usePurchase(g)">{{ g.kind === 'furniture' ? '去仓库' : g.category === 'garden' ? '去播种' : g.category === 'pet' ? '去喂养' : '去使用' }}</button></view>
      <text v-if="state.money < g.price" class="shop-shortage">还差 {{ fmtMoney(g.price - state.money) }}</text>
    </view>
  </view>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
import { state, describe, fmtMoney } from '../game/engine/core.js'
import { ITEMS, FURNITURE } from '../game/data/world.js'
import { SUPPLIES } from '../game/data/homestead.js'
import { ui, requestFunction } from '../game/ui.js'
import { play } from '../game/audio.js'
import { actionAudio, switchAudio } from '../game/action-audio.js'
import { useAction } from '../game/use-action.js'
import { buyShopProduct } from '../game/engine/shop.js'
const { busy, run } = useAction()
const category = computed({ get: () => ui.shopCategory, set: v => { ui.shopCategory = v; ui.shopProduct = '' } })
const categories = [{id:'food',name:'食物'},{id:'ingredient',name:'食材'},{id:'gift',name:'礼物'},{id:'furniture',name:'家具'},{id:'garden',name:'园艺'},{id:'pet',name:'宠物'}]
const confirming = ref(''), bought = ref('')
const pending = ref('')
watch(category, () => { confirming.value=''; bought.value='' })
const hint = computed(() => ({furniture:'送入家园仓库，摆放后生效',garden:'购买入库，播种扣种子不再扣现金',pet:'购买不自动喂养，猫狗各用对应口粮'})[category.value] || '购买后放入背包，使用或赠送时消耗')
function furnitureTip(g) { return g.kitchen ? '摆放后解锁料理' : g.bed ? '改善睡眠 ×'+g.bed : g.cleaner ? '减缓小屋整洁度下降' : g.use ? g.use.name : '装饰小屋' }
const goods = computed(() => {
  let list
  if(['garden','pet'].includes(category.value)) list=Object.entries(SUPPLIES).filter(([,g])=>g.category===category.value).map(([id,g])=>({...g,id,kind:'supply'}))
  else if(category.value==='furniture') list=Object.entries(FURNITURE).filter(([id,g])=>!g.courage&&id!=='cat').map(([id,g])=>({...g,id,kind:'furniture',tip:furnitureTip(g)}))
  else list=Object.entries(ITEMS).filter(([,g])=>category.value==='gift'?['gift','ring'].includes(g.kind):g.kind===category.value).map(([id,g])=>({...g,id,kind:'item',tip:g.kind==='ingredient'?'料理：'+describe(g.cook):['gift','ring'].includes(g.kind)?'用于关系互动':describe(g.effects)}))
  return list.sort((a,b)=>(b.id===ui.shopProduct?1:0)-(a.id===ui.shopProduct?1:0))
})
function owned(g){return g.kind==='item'?(state.bag[g.id]||0):g.kind==='supply'?((g.category==='garden'?state.garden.seeds:state.garden.feed)[g.target]||0):(state.furniture.inv[g.id]||0)+state.furniture.placed.filter(p=>p.fid===g.id).length}
function purchase(g){
  if(g.price>=50000&&confirming.value!==g.id){confirming.value=g.id;play('question');return}
  pending.value=g.id
  run(()=>actionAudio(()=>{const ok=buyShopProduct(g.kind,g.id);if(ok){bought.value=g.id;confirming.value=''}return ok}, 'confirm', {visibleFailure:true}))
}
function usePurchase(g){
  if(g.category==='garden'){ui.selectedSeed=g.target;requestFunction('home');return}
  if(g.category==='pet'){ui.homeTools.pet=g.target;requestFunction('pets');return}
  if(g.kind==='furniture'){ui.homeTools.inventory='furniture';requestFunction('inventory');return}
  if(ITEMS[g.id]?.kind==='ingredient'){ui.homeTools.food='cook';ui.homeTools.cooking='classic';requestFunction('life');return}
  requestFunction('phone',{app:'bag'})
}
</script>
<style scoped>
.category-scroll{width:100%;white-space:nowrap}.shop-categories{display:flex;gap:5px;min-width:max-content}.shop-categories button{flex-shrink:0;min-width:64px;margin:0;font-size:12px;line-height:1.5;padding:7px 12px;background:var(--paper-deep);color:var(--ink)}.shop-categories button.active{background:var(--hud);color:#fff0cd}.shop-hint{display:block;font-size:11px;color:var(--muted);margin:12px 0;line-height:1.6}.shop-product{padding:12px 3px;border-bottom:1px solid #b09a7055}.shop-product.focused{background:#b59a6622;border-radius:6px}.product-main{display:flex;align-items:center;gap:10px}.product-icon{font-size:28px}.product-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;font-size:14px}.product-copy .muted{font-size:10px;line-height:1.5}.shop-product button{flex-shrink:0;margin:0;padding:8px 12px;font-size:11px;line-height:1.5;background:var(--hud);color:#fff0cd}.shop-product button[disabled]{opacity:.45}.product-followup{display:flex;align-items:center;justify-content:space-between;font-size:11px;margin:8px 0 0 38px;color:var(--muted)}.product-followup button{padding:5px 12px}.shop-shortage{display:block;text-align:right;font-size:10px;color:var(--muted);margin-top:5px}
</style>
