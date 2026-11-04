<template>
  <view class="garden" @click.stop :class="{ card: !compact, compact, scenic, embedded, 'fixed-panel': fixedPanel }">
    <view v-if="!compact" class="row between"><text class="act-name">🌱 我的菜园</text><text class="muted">{{ readyCount }} / 4 格成熟</text></view>
    <text v-if="!compact" class="muted block">按现实时间生长，离线也会长大。缺水生长变慢，成熟后不会腐烂。</text>
    <text v-if="!atHome" class="notice">回家后可以播种、收菜和照料宠物。</text>
    <block v-if="section === 'all' || section === 'grow'">
    <view class="seeds">
      <button v-for="c in crops" :key="c.id" size="mini" :class="{ chosen: selected === c.id }" @click="selected = c.id">{{ c.icon }} {{ c.name }} ×{{ state.garden.seeds[c.id] || 0 }}</button><button v-if="embedded" class="seed-restock" @click="requestFunction('shop',{category:'garden',product:'seed_'+selected})">补货</button>
    </view>
    <view v-if="!embedded" class="seed-supply"><text>播种消耗1份种子 · 按现实时间生长</text><button @click="requestFunction('shop',{category:'garden',product:'seed_'+selected})">补货</button></view>
    <text class="muted block">{{ scenic ? (feedback || plotHint) : selectedCrop.name + '正常生长约' + selectedCrop.hours + '小时，每格收获10份。点击空地播种。' }}</text>
    <view class="plots" :class="{ 'plots-3d': threeD }">
      <!-- #ifdef H5 || MP-WEIXIN -->
      <scene-stage v-if="threeD && !sceneCovered && !sceneFailed" kind="garden" :model="gardenModel" :anchors="plotAnchors"
        @ready="threeReady = true" @failure="fail3d" @pick="onPlotTap" @projected="plotProjection = $event" />
      <template v-if="threeD && !sceneCovered && threeReady">
        <button v-for="(p, i) in plots" :key="i" class="plot-label" :style="plotProjection[i]"
          :aria-label="plotLabel(p, i)" @click.stop="onPlotTap(i)">{{ p ? p.name : '播种' }}</button>
      </template>
      <view v-if="threeD && sceneFailed" class="scene-unavailable">
        <text>菜园 3D 暂不可用</text><button size="mini" @tap.stop="sceneFailed = false">重试</button>
      </view>
      <!-- #endif -->
      <!-- #ifndef H5 || MP-WEIXIN -->
      <template v-if="!threeD">
      <pet-residents environment="garden" :points="petPoints" />
      <button v-for="(p, i) in plots" :key="i" class="plot" :aria-label="plotLabel(p, i)" @click="onPlotTap(i)">
        <text class="crop-icon">{{ p ? p.icon : '🌾' }}</text>
        <text>{{ p ? p.name : '空地 · 播种' }}</text>
        <text v-if="!scenic" class="muted">{{ p ? p.stage : '第 ' + (i + 1) + ' 格' }}</text>
        <text v-if="p && !scenic" class="muted">{{ p.water }}</text>
      </button>
      </template>
      <!-- #endif -->
    </view>
    <view class="garden-actions">
      <button size="mini" :disabled="!atHome || !readyCount" @click="act(() => reap(), readyCount > 0 ? 'harvest' : null)">收获成熟作物</button>
      <button size="mini" :disabled="!atHome || !growingCount" @click="act(() => waterGarden(), null)">浇水 · 免费</button>
    </view>
    </block>
    <block v-if="section === 'all' || section === 'basket'">
    <view v-if="!scenic" class="section-title">🧺 收成篮</view>
    <text v-if="!basket.length" class="muted">收获后，可以自己吃，也可以出售。</text>
    <view v-for="c in visibleBasket" :key="c.id" class="basket-row">
      <text>{{ c.icon }} {{ c.name }} ×{{ c.count }}</text>
      <view class="garden-actions">
        <button size="mini" :disabled="!atHome" @click="act(() => useProduce(c.id))">吃一份 · 饱腹 +{{ c.hunger }}</button>
        <button size="mini" :disabled="!atHome" @click="act(() => useProduce(c.id, true))">全部出售 · {{ c.price * c.count }}円</button>
      </view>
    </view>
    <view v-if="scenic && basket.length > 1" class="basket-pages"><button :disabled="basketIndex === 0" @click="basketIndex--">上一种</button><text>{{ basketIndex + 1 }} / {{ basket.length }}</text><button :disabled="basketIndex >= basket.length - 1" @click="basketIndex++">下一种</button></view>
    </block>
    <block v-if="section === 'all' || section === 'pets' || section === 'pet-dog' || section === 'pet-cat'">
    <view v-if="!scenic" class="section-title">🐾 家里的伙伴</view>
    <view v-for="p in visiblePets" :key="p.id" class="pet">
      <text class="act-name">{{ p.icon }} {{ p.name }}</text>
      <template v-if="p.owned">
        <text class="block">{{ p.status }}</text>
        <text class="muted block">{{ p.food }} · 体力 {{ p.energy }}</text>
        <button size="mini" :disabled="busy || !atHome || !p.canFeed || !p.stock" @click="act(() => feed(p.id), 'petFeed')">追加24小时 · 库存{{ p.stock }}</button>
        <text class="muted block">{{ p.canFeed ? '喂后可维持约' + p.after + '小时' : '最多提前备72小时，暂时无需添粮' }}</text><button size="mini" @click="requestFunction('shop',{category:'pet',product:'feed_'+p.id})">买口粮</button>
        <button v-if="p.id === 'cat'" size="mini" :disabled="!atHome" @click="act(() => cuddleCat())">陪陪小猫</button>
      </template>
      <template v-else>
        <text class="muted block">{{ p.id === 'dog' ? '饱腹时在园看守，饿了回房睡觉，睡觉体力消耗极小。' : '在家陪伴你，喂饱后每日首次陪伴可恢复心情。' }}</text>
        <text v-if="confirming === p.id" class="muted block">含一天口粮；以后每份100日元，可追加24现实小时。</text>
        <button size="mini" :disabled="!atHome || state.money < p.adoption" @click="confirmAdopt(p.id)">{{ confirming === p.id ? '确认领养 · ' : '领养安置 · ' }}{{ p.adoption }}円</button>
        <button v-if="confirming === p.id" size="mini" @click="confirming = ''">暂不领养</button>
      </template>
    </view>
    </block>
    <text v-if="!compact" class="muted block">当前为个人菜园。圈子串门与联网偷菜尚未开放。</text>
  </view>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
// #ifdef H5 || MP-WEIXIN
import SceneStage from '../scene-stage/scene-stage.vue'
// #endif
// #ifndef H5 || MP-WEIXIN
import PetResidents from '../pet-actor/pet-residents.vue'
// #endif
import { ui, requestFunction } from '../../game/ui.js'
import { play } from '../../game/audio.js'
import { actionAudio } from '../../game/action-audio.js'
import { useAction } from '../../game/use-action.js'
import { state, save } from '../../game/engine/core.js'
import { CROPS, PETS, HOUR } from '../../game/data/garden.js'
import { syncGarden, sow, reap, waterGarden, useProduce, adopt, feed, cuddleCat, ripe } from '../../game/engine/garden.js'
const props = defineProps({ section: { type: String, default: 'all' }, compact: Boolean, scenic: Boolean, embedded: Boolean, fixedPanel: Boolean, threeD: Boolean, sceneCovered: Boolean, feedback: { type: String, default: '' } })
const threeReady = ref(false)
const sceneFailed = ref(false)
watch(() => props.sceneCovered, () => { threeReady.value = false })
watch(() => [props.threeD, props.section], () => { threeReady.value = false; sceneFailed.value = false })
function plotLabel(plot, index) {
  return plot ? plot.name + '，' + plot.stage : '第' + (index + 1) + '格，播种'
}
const petPoints = [
  {id:'a',x:0,y:0,left:'18%',top:'94%',z:12},
  {id:'b',x:1,y:0,left:'50%',top:'94%',z:12},
  {id:'c',x:2,y:0,left:'82%',top:'94%',z:12}
]
const confirming = ref('')
const selected = computed({get:()=>ui.selectedSeed || 'radish',set:v=>ui.selectedSeed=v})
const {busy,run}=useAction()
function act(fn, event = 'confirm'){return run(()=>actionAudio(()=>{const ok=fn();refresh();return ok}, event, { visibleFailure: true }))}
const inspectIndex = ref(-1)
const basketIndex = ref(0)
function onPlotTap(index) {
  inspectIndex.value = index
  if (!state.garden.plots[index]) act(() => sow(index, selected.value), 'plant')
  refresh()
}
const now = ref(0)
const atHome = computed(() => state.location === 'home')
const crops = Object.keys(CROPS).map(id => ({ id, ...CROPS[id] }))
const selectedCrop = computed(() => CROPS[selected.value])
function refresh() { now.value = syncGarden() }
function duration(ms) { return ms <= 0 ? '已用完' : ms < HOUR ? Math.ceil(ms / 60000) + ' 分钟' : Math.ceil(ms / HOUR) + ' 小时' }
const plots = computed(() => {
  now.value
  return state.garden.plots.map(p => {
    if (!p) return null
    const c = CROPS[p.crop], ratio = p.progress / (c.hours * HOUR)
    const remaining = Math.max(0, c.hours * HOUR - p.progress)
    const watered = Math.max(0, p.waterUntil - now.value)
    const eta = Math.min(remaining, watered) + Math.max(0, remaining - watered) * 2
    return { name: c.name, icon: ratio < 0.5 ? '🌱' : c.icon,
      stage: ripe(p) ? '成熟了，可以收获' : (ratio < 0.25 ? '幼苗' : '生长中') + ' · 还需约 ' + duration(eta),
      water: ripe(p) ? '收成会一直保留' : p.waterUntil > now.value ? '水分充足 · ' + duration(p.waterUntil - now.value) : '缺水 · 生长速度减半' }
  })
})
// #ifdef H5 || MP-WEIXIN
const gardenModel = computed(() => ({
  plots: state.garden.plots.map(p => p && ({
    crop: p.crop,
    phase: ripe(p) ? 2 : p.progress < CROPS[p.crop].hours * HOUR * .25 ? 0 : 1,
    wet: p.waterUntil > now.value
  }))
}))
const plotAnchors = [[.77, .08, 1.25], [2.42, .08, 1.25], [.77, .08, 2.9], [2.42, .08, 2.9]]
const plotProjection = ref([])
function fail3d() {
  threeReady.value = false
  sceneFailed.value = true
}
// #endif
const plotHint = computed(() => { const p = plots.value[inspectIndex.value]; return p ? p.name + ' · ' + p.stage + ' · ' + p.water : '左右滑动旋转 · 点击菜畦播种或查看。' })
const readyCount = computed(() => { now.value; return state.garden.plots.filter(ripe).length })
const growingCount = computed(() => { now.value; return state.garden.plots.filter(p => p && !ripe(p)).length })
const basket = computed(() => crops.filter(c => state.garden.produce[c.id] > 0).map(c => ({ ...c, count: state.garden.produce[c.id] })))
const visibleBasket = computed(() => props.scenic ? basket.value.slice(basketIndex.value, basketIndex.value + 1) : basket.value)
watch(() => basket.value.length, n => { basketIndex.value = Math.min(basketIndex.value, Math.max(0, n - 1)) })
const pets = computed(() => Object.keys(PETS).map(id => {
  const p = state.garden.pets[id], fed = p && p.fedUntil > now.value
  return { id, ...PETS[id], owned: !!p, energy: p ? Math.round(p.energy) : 0,
    status: id === 'dog' ? (fed ? '在菜园看守 · 禁止偷菜' : '肚子饿了，回房睡觉 · 体力消耗极小') : (fed ? '在家等你陪伴' : '饿了，正在休息'),
    food: fed ? '口粮与饮水还够 ' + duration(p.fedUntil - now.value) : '需要添粮与饮水',
    stock: state.garden.feed[id] || 0, after: p ? Math.ceil(Math.max(0,p.fedUntil-now.value)/HOUR+24) : 24,
    canFeed: p && Math.max(0,p.fedUntil-now.value) <= 48 * HOUR }
}))
const visiblePets = computed(() => pets.value.filter(p => !props.section.startsWith('pet-') || p.id === props.section.slice(4)))
function confirmAdopt(id) {
  if (confirming.value !== id) { confirming.value = id; play('question'); return }
  act(() => adopt(id))
  confirming.value = ''
  refresh()
}
let timer
onMounted(() => { refresh(); save(); timer = setInterval(refresh, 10000) })
onBeforeUnmount(() => { clearInterval(timer); save() })
</script>

<style scoped>
.garden { margin-top: 24rpx; }
.seeds, .garden-actions { display: flex; flex-wrap: wrap; gap: 10rpx; margin: 14rpx 0; }
.seeds button, .garden-actions button, .pet button { margin: 0; font-size: max(var(--readable-min, 0px), 23rpx); }
.chosen { background: var(--accent); color: var(--card); }
.plots { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14rpx; margin-top: 18rpx; }
.plot { width: 100%; min-width: 0; margin: 0; padding: 20rpx 8rpx; background: var(--paper-deep); border: 2rpx dashed var(--line); border-radius: 20rpx; display: flex; flex-direction: column; align-items: center; font-size: max(var(--readable-min, 0px), 26rpx); line-height: 1.6; }
.plot[disabled] { color: var(--ink); background: var(--paper-deep); opacity: 1; }
.plot .muted { font-size: max(var(--readable-min, 0px), 21rpx); }
.crop-icon { font-size: 52rpx; }
.basket-row, .pet { padding: 18rpx 0; border-bottom: 1rpx solid var(--line); }
.pet button { margin-top: 14rpx; margin-right: 10rpx; }
.garden.compact { margin: 0; }
.compact .seeds { gap: 6px; margin-top: 0; }
.compact .seeds button { flex: 1; padding: 9px 2px; font-size: max(var(--readable-min, 0px), 11px); line-height: 1.3; border-radius: 10px; }
.compact .muted { font-size: max(var(--readable-min, 0px), 11px); line-height: 1.5; }
.compact .plots { gap: 9px; margin-top: 12px; }
.compact .plot { padding: 12px 4px; border-radius: 15px; font-size: max(var(--readable-min, 0px), 12px); }
.compact .crop-icon { font-size: 32px; }
.compact .plot .muted { font-size: max(var(--readable-min, 0px), 10px); }
.compact .garden-actions button { flex: 1; padding: 10px 4px; font-size: max(var(--readable-min, 0px), 11px); line-height: 1.3; border-radius: 10px; }
.compact .section-title { margin-top: 6px; font-size: 15px; }
.compact .pet { padding: 12px; margin: 10px 0; background: var(--paper); border: 1px solid #b9a58655; border-radius: 16px; }
.compact .pet .act-name { font-size: 16px; }
.compact .pet .block { font-size: max(var(--readable-min, 0px), 12px); line-height: 1.6; }
.compact .pet button { font-size: max(var(--readable-min, 0px), 11px); padding: 8px; line-height: 1.4; border-radius: 10px; }
@media (max-height: 650px) {
  .compact .plot { padding: 8px 4px; line-height: 1.3; }
  .compact .crop-icon { font-size: 24px; line-height: 1.1; }
  .compact .plot .muted { font-size: max(var(--readable-min, 0px), 9px); line-height: 1.3; }
  .compact .seeds button { padding: 7px 2px; font-size: max(var(--readable-min, 0px), 10px); }
  .compact .plots { margin-top: 8px; }
  .compact .garden-actions { margin: 10px 0; }
}
/* 独立菜园占满当前场景，操作固定在画面内。 */
.garden.scenic { height: 100%; min-height: 0; display: flex; flex-direction: column; }
.scenic .seeds { flex-shrink: 0; }
.scenic .plots { flex: 1; min-height: 0; padding: 12px; background: #d2c19e; border: 3px solid #af9976; border-radius: 20px; box-shadow: inset 0 3px 0 #91795222; }
.scenic .plot { padding: 6px 4px; min-height: 0; justify-content: center; background: #eee0b9; border-color: #b49a6b; }
.scenic .crop-icon { font-size: 30px; line-height: 1.1; }
.scenic > .muted.block { font-size: max(var(--readable-min, 0px), 10px); line-height: 1.4; min-height: 28px; }
.scenic .garden-actions { flex-shrink: 0; margin-bottom: 0; }
.scenic .pet { margin: auto 0; padding: 22px 16px; }
.scenic .pet .act-name { font-size: 26px; display: block; margin-bottom: 12px; }
.scenic .pet .block { line-height: 1.8; }
.scenic .pet button { margin-top: 18px; }
@media(max-height:650px) { .scenic .plot { flex-direction: row; gap: 5px; padding: 4px; }.scenic .crop-icon { font-size: 22px; line-height: 1; }.scenic .plots { padding: 7px; gap: 7px; }.scenic .seeds { margin-bottom: 7px; }.scenic .pet { padding: 14px; }.scenic .pet .act-name { font-size: 23px; margin-bottom: 7px; } }
.basket-pages { display:flex; align-items:center; justify-content:center; gap:12px; margin-top:12px; font-size: max(var(--readable-min, 0px), 11px); }
.basket-pages button { margin:0; padding:5px 10px; line-height:1.5; font-size: max(var(--readable-min, 0px), 11px); }
.scenic .basket-row { margin:auto 0; padding:18px 12px; border:1px solid var(--line); border-radius:16px; background:var(--card); }
.embedded .seeds { margin:0 0 5px; gap:4px; }.embedded .seeds button { padding:5px 2px; font-size: max(var(--readable-min, 0px), 10px); }
.embedded > .muted.block { min-height:16px; font-size: max(var(--readable-min, 0px), 9px); line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.embedded .plots { margin-top:3px; padding:5px; gap:5px; border-width:2px; border-radius:12px; }.embedded .plot { padding:3px; flex-direction:row; gap:5px; font-size: max(var(--readable-min, 0px), 10px); }.embedded .crop-icon { font-size:22px; line-height:1; }
.embedded .garden-actions { margin:5px 0 0; gap:4px; }.embedded .garden-actions button { padding:6px 3px; font-size: max(var(--readable-min, 0px), 10px); }
@media(max-height:650px){.embedded .crop-icon {font-size:18px}}
@media(min-width:960px){.embedded .plot{flex-direction:column;gap:10px;font-size: max(var(--readable-min, 0px), 12px)}.embedded .crop-icon{font-size:38px}.embedded .seeds button{padding:8px;font-size: max(var(--readable-min, 0px), 11px)}}
@media(max-height:650px) and (max-width:600px){.embedded .plots{grid-template-columns:repeat(4,minmax(0,1fr))}.embedded .plot{flex-direction:column;gap:0;padding:2px;font-size: max(var(--readable-min, 0px), 9px);line-height:1}.embedded .crop-icon{font-size:16px;line-height:1}}
.seed-supply{display:flex;align-items:center;justify-content:space-between;gap:4px;font-size: max(var(--readable-min, 0px), 10px);color:var(--muted);margin:3px 0}.seed-supply button{margin:0;padding:4px 10px;font-size: max(var(--readable-min, 0px), 10px);line-height:1.3;color:var(--ink)}
.embedded .seed-restock{flex:.55;min-width:38px}.embedded .plots{min-height:46px}
@media(max-width:959px){
  .garden.embedded .plots{grid-template-columns:repeat(2,minmax(0,1fr));min-height:170px}
  .garden.embedded .plot{min-height:72px;flex-direction:column;gap:5px;line-height:1.4;padding:8px}
  .garden.embedded .crop-icon{font-size:24px}
}
.garden .plots{position:relative;padding-bottom:36px}
.garden .plots .pet-resident{pointer-events:none}
.garden .plots.plots-3d { display: block; min-height: 175px; padding: 0; background: #f5ecd9; }
.plot-label {
  position: absolute;
  z-index: 13;
  transform: translate(-50%, -12%);
  margin: 0;
  padding: 5px 9px;
  min-height: 28px;
  border-radius: 10px;
  border: 1px solid #bba477;
  background: #fff1d2;
  color: #4b3a27;
  font-size: 12px;
  line-height: 1.3;
}

.garden.scenic.fixed-panel { height: 100%; min-height: 0; margin: 0; }
.garden.fixed-panel .plots {
  flex: 1; min-height: 80px; margin-top: 3px; padding: 0; overflow: hidden;
}
.garden.fixed-panel .plot { min-height: 0; }
.garden.fixed-panel .garden-actions { margin-bottom: 0; }
</style>
