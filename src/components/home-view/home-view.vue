<template>
  <view class="home home-screen" :class="['scene-' + scene, { wide, 'tool-view': !!tool, 'fixed-homestead': fixedPanel }]">
    <view v-if="!tool" class="home-heading">
      <view><text class="home-eyebrow">{{ showingGarden ? 'MY GARDEN' : scene === 'room' ? 'MY LITTLE HOME' : 'MY EVERYDAY LIFE' }}</text><text class="home-title">{{ showingGarden ? '🌱 门前菜园' : currentScene.icon + ' ' + (scene === 'room' ? home.name : currentScene.name) }}</text></view>
      <view class="home-heading-right">
        <!-- #ifdef H5 || MP-WEIXIN -->
        <button v-if="scene === 'room' || scene === 'garden'" size="mini" :aria-pressed="threeD" @click="toggle3d">{{ threeD ? '切回 2D' : '试用 3D' }}</button>
        <!-- #endif --><text class="home-clean">✧ 整洁 {{ Math.round(state.clean) }}</text><button v-if="!atHome" size="mini" @click="travel('home')">回家</button><text v-else class="home-presence">在家 · 慢慢生活</text></view>
    </view>
    <view v-if="!fixedPanel && scene !== 'garden'" class="scene-tip"><text>{{ feedback || currentScene.tip }}</text><button v-if="scene !== 'room'" @click="switchScene('room')">回房间 ↗</button></view>
    <home-goals v-if="!tool && !showingGarden" compact />
    <view v-if="selected && scene === 'room' && !showingGarden" class="placement-note"><text>摆放 {{ FURNITURE[selected].name }} · 点击地板</text><button @click="selected = ''">完成</button></view>
    <view v-else-if="inspected && scene === 'room' && !showingGarden" class="placement-note"><text>{{ FURNITURE[inspected.fid].name }}</text><view class="inline-buttons"><button @click="storeInspected">收回仓库</button><button @click="inspected = null">取消</button></view></view>

    <view v-else-if="fixedPanel && !showingGarden" class="placement-note room-hint"><text>{{ feedback || '点击家具查看，点击空地移动。' }}</text></view>

    <view v-if="!tool" v-show="scene === 'room'" class="homestead" :class="{ arranging: !!selected && !fixedPanel }">
    <view v-if="!showingGarden" class="home-stage">
      <view class="home-sunlight" />
      <view class="room-model" :class="{ 'web-room-3d': webRoom3d }" :style="fillRoom ? null : { transform: 'scale(' + roomScale + ')' }"><iso-room :selected="selected" :fill-stage="fillRoom" :layout-key="selected || inspected?.fid || ''" :three-d="threeD && scene === 'room' && !showingGarden" @3d-failure="fail3d" @placed="onPlaced" @inspect="inspected = $event" /></view>
      <view class="scene-detail"><text>装饰 {{ decor }} · 睡眠 ×{{ bed }}</text><text>{{ kitchen ? '厨房已就绪' : '今天也可以叫份外卖' }}</text></view>
    </view>
      <view v-if="!fixedPanel || showingGarden" class="homestead-garden">
        <view class="garden-caption">
          <text v-if="!fixedPanel">🌱 门前菜园</text>
          <view>
            <button :class="{ active: gardenSection === 'grow' }" @click="switchAudio(gardenSection, 'grow', v => gardenSection = v)">种植</button>
            <button :class="{ active: gardenSection === 'basket' }" @click="switchAudio(gardenSection, 'basket', v => gardenSection = v)">收成</button>
          </view>
        </view>
        <garden-view class="homestead-garden-content" compact scenic embedded :fixed-panel="fixedPanel"
          :feedback="feedback" :section="gardenSection" :three-d="threeD && scene === 'room' && !garden3dFailed"
          @3d-failure="failGarden3d" />
      </view>
    </view>
    <view v-if="fixedPanel" class="homestead-switch" role="group" aria-label="家园场景">
      <button :class="{ active: !showingGarden }" :aria-pressed="!showingGarden" @click="selectPanel('room')">🏠 家里</button>
      <button :class="{ active: showingGarden }" :aria-pressed="showingGarden" @click="selectPanel('garden')">🌱 菜园</button>
    </view>

    <view v-if="scene !== 'room'" class="scene-area">
      <view v-if="currentScene.group === 'life'" class="scene-tabs life-tabs"><button v-for="s in lifeScenes" :key="s.id" :class="{ active: scene === s.id }" @click="switchScene(s.id)">{{ s.icon }} {{ s.short }}</button></view>
      <view v-if="scene === 'garden'" class="scene-tabs"><button :class="{ active: gardenSection === 'grow' }" @click="switchAudio(gardenSection, 'grow', v => gardenSection = v)">种植</button><button :class="{ active: gardenSection === 'basket' }" @click="switchAudio(gardenSection, 'basket', v => gardenSection = v)">收成篮</button></view>
      <view v-if="scene === 'food'" class="scene-tabs"><button :class="{ active: foodSection === 'delivery' }" @click="switchAudio(foodSection, 'delivery', v => foodSection = v)">叫外卖</button><button :class="{ active: foodSection === 'cook' }" @click="switchAudio(foodSection, 'cook', v => foodSection = v)">自己做</button></view>
      <view v-if="scene === 'pets'" class="scene-tabs"><button :class="{ active: petSection === 'dog' }" @click="switchAudio(petSection, 'dog', v => petSection = v)">🐕 小狗</button><button :class="{ active: petSection === 'cat' }" @click="switchAudio(petSection, 'cat', v => petSection = v)">🐈 小猫</button></view>
      <view class="scene-content" :class="{ 'garden-stage': scene === 'garden', 'pet-stage': scene === 'pets' }">
        <garden-view v-if="scene === 'garden' || scene === 'pets'" compact scenic :feedback="feedback" :section="scene === 'pets' ? 'pet-' + petSection : gardenSection" :three-d="threeD && scene === 'garden'" @3d-failure="fail3d" />
        <template v-if="scene === 'inventory'">
          <home-inventory @place="chooseFurniture" />
        </template>
        <template v-if="scene === 'food'">
          <text v-if="!atHome" class="local-tip">先回家，再做饭或叫外卖。</text>
          <template v-if="foodSection === 'cook'">
            <view class="scene-tabs"><button :class="{active:cookingSection==='garden'}" @click="switchAudio(cookingSection, 'garden', v => cookingSection = v)">菜园菜谱</button><button :class="{active:cookingSection==='classic'}" @click="switchAudio(cookingSection, 'classic', v => cookingSection = v)">家常料理</button></view>
            <recipe-view v-if="cookingSection==='garden'" />
            <template v-else>
            <text v-if="!kitchen" class="local-tip">还没有厨房设备，可以先叫份外卖。</text>
            <view v-if="!ingredients.length" class="scene-empty"><text class="empty-icon">🥬</text><text>还没有食材</text><text class="muted">到商店选购食材，再回来下厨吧。</text></view>
            <button v-for="g in visibleItems" :key="g.id" class="home-action" :disabled="!atHome || !kitchen" @click="act('cook', g.id)"><text class="action-glyph">🍳</text><view class="action-copy"><text>{{ g.name }} ×{{ g.count }}</text><text class="muted">1 小时 · 提升饱腹与厨艺</text></view><text>制作</text></button>
            </template>
          </template>
          <template v-else><button v-for="d in visibleItems" :key="d.id" class="home-action" :disabled="!atHome || state.money < d.price" @click="orderDelivery(d.id)"><text class="action-glyph">{{ d.icon }}</text><view class="action-copy"><text>{{ d.name }}</text><text class="muted">{{ fmtHours(d.hours) }} · {{ describe(d.effects) }}</text></view><text>{{ fmtMoney(d.price) }}</text></button></template>
        </template>
        <template v-if="scene === 'chores'">
          <view class="house-condition"><text>小屋整洁度</text><text class="condition-value">{{ Math.round(state.clean) }} <text class="muted">/ 100</text></text><view class="condition-track"><view :style="{ width: state.clean + '%' }" /></view></view>
          <button v-for="c in choreList" :key="c.id" class="home-action" :disabled="!atHome || state.money < c.cost" @click="doChores(c.id)"><text class="action-glyph">{{ c.icon }}</text><view class="action-copy"><text>{{ c.name }}</text><text class="muted">{{ fmtHours(c.hours) }} · 整洁 +{{ c.clean }}{{ c.effects.energy ? ' · 精力' + c.effects.energy : '' }}</text></view><text>{{ c.cost ? fmtMoney(c.cost) : '免费' }}</text></button>
        </template>
        <template v-if="scene === 'rest'"><button v-for="r in visibleItems" :key="r.id" class="home-action" :disabled="!atHome" @click="act(r.kind, r.arg)"><text class="action-glyph">{{ r.icon }}</text><view class="action-copy"><text>{{ r.name }}</text><text class="muted">{{ r.tip }}</text></view><text>使用</text></button></template>
      </view>
      <view v-if="pageCount > 1" class="scene-pagination"><button :disabled="page === 0" @click="page--">上一页</button><text>{{ page + 1 }} / {{ pageCount }}</text><button :disabled="page >= pageCount - 1" @click="page++">下一页</button></view>
    </view>

  </view>
</template>

<script setup>
import { switchAudio } from '../../game/action-audio.js'
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import HomeInventory from '../home-inventory.vue'
import HomeGoals from '../home-goals.vue'
import RecipeView from '../recipe-view.vue'
import IsoRoom from '../iso-room/iso-room.vue'
import GardenView from '../garden-view/garden-view.vue'
import { HOME_SCENES, HOME_NAV } from '../../game/data/home-scenes.js'
import { requestRoom, ui } from '../../game/ui.js'
import {
  state, fmtMoney, fmtHours, describe, travel, sleep, cook, useFurniture, orderDelivery, doChores,
  bestBed, kitchenLevel, decorScore, removeFurniture
} from '../../game/index.js'
import { FURNITURE, HOMES, ITEMS, DELIVERY, CHORES, DIRTY_LINE } from '../../game/data/world.js'

const props = defineProps({ wide: { type: Boolean, default: false }, tool: { type: String, default: '' } })
const emit = defineEmits(['place', 'tool'])
const toolScene = ref(props.tool)
const scene = computed({ get: () => props.tool ? toolScene.value : (ui.homeScene === 'garden' ? 'room' : ui.homeScene), set: value => { if(props.tool) toolScene.value = value; else ui.homeScene = value } })
const gardenSection = ref('grow')
const foodSection = computed({get:()=>ui.homeTools.food,set:v=>ui.homeTools.food=v})
const cookingSection = computed({get:()=>ui.homeTools.cooking,set:v=>ui.homeTools.cooking=v})
const petSection = computed({get:()=>ui.homeTools.pet,set:v=>ui.homeTools.pet=v})
const page = ref(0)
const inspected = ref(null)
const feedback = ref('')
let tipTimer = null
watch(() => ui.homeTip, tip => {
  clearTimeout(tipTimer)
  feedback.value = tip ? tip.text : ''
  tipTimer = setTimeout(() => { feedback.value = '' }, 3500)
})
const roomScale = ref(1)
const threeD = ref(false)
const homePanel = ref('room')
const garden3dFailed = ref(false)
const fixedPanel = computed(() => {
  // #ifdef MP-WEIXIN
  return threeD.value && !props.tool && scene.value === 'room'
  // #endif
  // #ifndef MP-WEIXIN
  return false
  // #endif
})
const webRoom3d = computed(() => {
  // #ifdef H5
  return threeD.value && scene.value === 'room'
  // #endif
  // #ifndef H5
  return false
  // #endif
})
const fillRoom = computed(() => fixedPanel.value || webRoom3d.value)
const showingGarden = computed(() => fixedPanel.value && homePanel.value === 'garden')
function selectPanel(id) {
  switchAudio(homePanel.value, id, value => {
    if (value === 'garden') gardenSection.value = 'grow'
    homePanel.value = value
  })
}
function toggle3d() {
  homePanel.value = 'room'
  garden3dFailed.value = false
  threeD.value = !threeD.value
}
function failGarden3d() {
  if (!fixedPanel.value) {
    fail3d()
    return
  }
  garden3dFailed.value = true
  uni.showToast({ title: '菜园 3D 暂不可用，已显示 2D 菜园', icon: 'none' })
}
function fail3d() {
  if (!threeD.value) return
  threeD.value = false
  uni.showToast({ title: '3D 暂不可用，已切回 2D', icon: 'none' })
}

const instance = getCurrentInstance()
const currentScene = computed(() => HOME_SCENES.find(s => s.id === scene.value) || HOME_SCENES[0])
const lifeScenes = HOME_SCENES.filter(s => s.group === 'life')
function switchScene(id) {
  if(!props.tool && ['inventory','food','pets'].includes(id)){emit('tool',id);return}
  if (id === 'garden') id = 'room'
  if (!HOME_SCENES.some(s => s.id === id)) return
  scene.value = id
  inspected.value = null
  page.value = 0
  if (id !== 'room') selected.value = ''
}
function chooseFurniture(id) { if(props.tool) { emit('place', id); return } scene.value = 'room'; selected.value = id; inspected.value = null }
function storeInspected() { if (inspected.value) removeFurniture(inspected.value.uid); inspected.value = null }
watch([scene, () => props.wide], () => { page.value = 0; measureRoom() })
watch(foodSection, () => { page.value = 0 })
function measureRoom() {
  if (fillRoom.value) return
  nextTick(() => uni.createSelectorQuery().in(instance.proxy).select('.home-stage').boundingClientRect().select('.iso').boundingClientRect().exec(rects => {
    const [area, room] = rects || []
    if (area && room && room.width && room.height) roomScale.value = Math.max(0.1, Math.min(props.wide ? 2.25 : 1.15, (area.width - 24) / (room.width / roomScale.value), (area.height - 24) / (room.height / roomScale.value)))
  }))
}
watch(() => [ui.width, props.wide, state.home], measureRoom)
function onHomeKey(e) { if (e.key === 'Escape') { switchScene('room'); selected.value = ''; inspected.value = null } }
onMounted(() => { if(!props.tool) ui.homeActive = true; measureRoom();
  // #ifdef H5
  window.addEventListener('resize', measureRoom)
  window.addEventListener('keydown', onHomeKey)
  // #endif
})
onBeforeUnmount(() => {
  if(!props.tool) { ui.homeActive = false; ui.homeTip = null }
  clearTimeout(tipTimer)
  // #ifdef H5
  window.removeEventListener('resize', measureRoom)
  window.removeEventListener('keydown', onHomeKey)
  // #endif
})

const selected = computed({ get:()=>ui.selectedFurniture, set:v=>{ui.selectedFurniture=v} })
watch(selected, value => {
  if (value) homePanel.value = 'room'
  measureRoom()
})
watch(fixedPanel, measureRoom)
const choreList = Object.keys(CHORES).map((id) => Object.assign({ id }, CHORES[id]))
const inventoryPageSize = computed(() => props.wide ? 9 : 6)
const home = computed(() => HOMES[state.home])
const atHome = computed(() => state.location === 'home')
const decor = computed(() => decorScore())
const bed = computed(() => bestBed())
const kitchen = computed(() => kitchenLevel())

const invList = computed(() =>
  Object.keys(state.furniture.inv)
    .filter((id) => state.furniture.inv[id] > 0)
    .map((id) => ({ id, name: FURNITURE[id].name, icon: FURNITURE[id].icon, count: state.furniture.inv[id] }))
)

const uses = computed(() => {
  const seen = {}
  const list = []
  state.furniture.placed.forEach((p) => {
    const f = FURNITURE[p.fid]
    if (f.use && !seen[p.fid]) {
      seen[p.fid] = true
      list.push({ fid: p.fid, name: f.use.name, icon: f.use.icon, hours: f.use.hours, tip: f.use.stream ? '赚打赏，魅力和创意越高越多' : describe(f.use.effects, f.use.skills) })
    }
  })
  return list
})

const ingredients = computed(() =>
  Object.keys(state.bag)
    .filter((id) => ITEMS[id] && ITEMS[id].kind === 'ingredient' && state.bag[id] > 0)
    .map((id) => ({ id, name: ITEMS[id].name, count: state.bag[id] }))
)

// 先让主人公在房间里走到家具旁，再执行行动
function act(kind, arg) {
  if (!atHome.value) return
  if(!props.tool) switchScene('room')
  const run = () => {
    if (kind === 'sleep') sleep(arg)
    else if (kind === 'cook') cook(arg)
    else useFurniture(arg)
  }
  if(props.tool) run()
  else requestRoom(kind, kind === 'use' ? arg : '', run)
}

function onPlaced(fid) {
  if (!state.furniture.inv[fid]) selected.value = ''
}

const restActions = computed(() => [
  { id: 'full', kind: 'sleep', arg: true, name: '好好睡一觉', icon: '🌙', tip: '晚上睡到7点，白天睡8小时' },
  { id: 'nap', kind: 'sleep', arg: false, name: '小睡片刻', icon: '☁️', tip: '2小时 · 恢复精力' },
  ...uses.value.map(u => ({ id: u.fid, kind: 'use', arg: u.fid, name: u.name, icon: u.icon, tip: fmtHours(u.hours) + ' · ' + u.tip }))
])
const pageItems = computed(() => {
  if (scene.value === 'inventory') return []
  if (scene.value === 'food') return foodSection.value === 'delivery' ? DELIVERY : cookingSection.value === 'classic' ? ingredients.value : []
  if (scene.value === 'rest') return restActions.value
  return []
})
const pageSize = computed(() => scene.value === 'inventory' ? inventoryPageSize.value : props.wide ? 4 : 2)
const pageCount = computed(() => Math.max(1, Math.ceil(pageItems.value.length / pageSize.value)))
const visibleItems = computed(() => pageItems.value.slice(Math.min(page.value, pageCount.value - 1) * pageSize.value, (Math.min(page.value, pageCount.value - 1) + 1) * pageSize.value))
watch(pageCount, n => { page.value = Math.min(page.value, n - 1) })
</script>
<style>
.home.home-screen { height: 100%; width: 100%; min-height: 0; box-sizing: border-box; padding: 10px 14px; display: flex; flex-direction: column; overflow: hidden; position: relative; color: var(--ink); background: radial-gradient(ellipse at 75% 15%, #fff9e6, transparent 55%), linear-gradient(160deg, var(--paper), var(--paper-deep)); }
.home-heading { display:flex; align-items:center; justify-content:space-between; gap:8px; flex-shrink:0; }.home-eyebrow,.home-title,.home-clean,.home-presence {display:block}.home-eyebrow{font-size: max(var(--readable-min, 0px), 9px);letter-spacing:2px;color:var(--muted);margin-bottom:3px}.home-title{font-size:19px;font-weight:800}.home-heading-right{text-align:right;font-size: max(var(--readable-min, 0px), 10px);line-height:1.6}.home-presence{color:var(--muted)}.home-heading-right button{margin:0;font-size: max(var(--readable-min, 0px), 11px);line-height:1.7}
.scene-tip{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--muted);font-size: max(var(--readable-min, 0px), 11px);line-height:1.5;min-height:24px;margin:6px 0;flex-shrink:0}.scene-tip button{background:transparent;color:var(--muted);font-size: max(var(--readable-min, 0px), 10px);line-height:1.4;padding:4px 0;margin:0;white-space:nowrap}.scene-tip button::after{border:0}
.home-stage{flex:1;min-height:0;position:relative;display:flex;align-items:center;justify-content:center;isolation:isolate}.home-sunlight{position:absolute;inset:8%;background:radial-gradient(ellipse,#ffe7ad70,transparent 70%);pointer-events:none}.room-model{flex-shrink:0;width:690rpx;transform-origin:center center}.scene-detail{position:absolute;bottom:10px;left:0;right:0;display:flex;justify-content:center;gap:10px;color:var(--muted);font-size: max(var(--readable-min, 0px), 10px);pointer-events:none}
.home-dock{flex-shrink:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:6px;background:var(--card);border:1px solid var(--line);border-radius:18px;margin-top:8px}.home-shortcut{min-width:0;width:100%;margin:0;padding:6px 0;line-height:1.3;background:transparent;color:var(--muted);display:flex;flex-direction:column;align-items:center;border-radius:12px}.home-shortcut.active{background:var(--paper-deep);color:var(--ink)}.shortcut-icon{font-size:23px}.shortcut-name{font-size: max(var(--readable-min, 0px), 11px);font-weight:700;margin-top:3px}.home-shortcut::after,.scene-tabs button::after,.inventory-slot::after,.home-action::after{border:0}
.scene-area{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}.scene-content{flex:1;min-height:0;overflow:hidden;padding:8px 0;box-sizing:border-box}.scene-tabs{display:flex;gap:6px;flex-shrink:0;margin:3px 0 7px}.scene-tabs button{flex:1;margin:0;padding:8px 2px;line-height:1.3;font-size: max(var(--readable-min, 0px), 12px);background:var(--card);color:var(--muted);border-radius:10px}.scene-tabs button.active{background:var(--hud);color:#fff4df}.life-tabs button{font-size: max(var(--readable-min, 0px), 11px);padding:7px 0}
.scene-pagination{display:flex;align-items:center;justify-content:center;gap:15px;flex-shrink:0;font-size: max(var(--readable-min, 0px), 11px);padding:4px 0}.scene-pagination button{margin:0;font-size: max(var(--readable-min, 0px), 11px);padding:5px 12px;line-height:1.5;background:var(--card);color:var(--ink)}
.inventory-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.inventory-slot{margin:0;padding:14px 3px;line-height:1.4;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:14px;display:flex;flex-direction:column;align-items:center;font-size: max(var(--readable-min, 0px), 12px)}.inventory-icon{font-size:32px;line-height:1.3}.inventory-slot .muted{font-size: max(var(--readable-min, 0px), 10px);margin-top:5px}.scene-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;font-size:15px}.scene-empty .empty-icon{font-size:45px}.scene-empty .muted{font-size: max(var(--readable-min, 0px), 11px);text-align:center}
.home-action{width:100%;margin:8px 0;padding:13px 10px;display:flex;align-items:center;gap:10px;text-align:left;line-height:1.5;color:var(--ink);background:var(--card);border:1px solid #b9a58670;border-radius:15px;font-size: max(var(--readable-min, 0px), 11px)}.home-action[disabled]{opacity:.5}.action-glyph{font-size:25px}.action-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.action-copy>text:first-child{font-weight:700;font-size: max(var(--readable-min, 0px), 14px)}.action-copy .muted{font-size: max(var(--readable-min, 0px), 10px)}.local-tip{display:block;font-size: max(var(--readable-min, 0px), 11px);color:var(--muted);margin:4px 0}
.house-condition{padding:14px;margin:0 0 10px;background:var(--card);border-radius:16px;font-size: max(var(--readable-min, 0px), 12px)}.condition-value{display:block;font-size:27px;margin:5px 0}.condition-value .muted{font-size: max(var(--readable-min, 0px), 12px)}.condition-track{height:5px;overflow:hidden;background:var(--paper-deep);border-radius:5px}.condition-track>view{height:100%;background:var(--ok)}
.placement-note{display:flex;align-items:center;justify-content:space-between;gap:5px;flex-shrink:0;padding:5px 8px;background:var(--card);border-radius:10px;font-size: max(var(--readable-min, 0px), 11px)}.placement-note button{font-size: max(var(--readable-min, 0px), 11px);line-height:1.5;padding:5px 8px;margin:0}.inline-buttons{display:flex;gap:5px}
.home.home-screen.wide{padding:16px 24px;background:radial-gradient(ellipse at 50% 45%,#f8eed8,transparent 65%),var(--paper)}.wide .home-title{font-family:serif;font-size:24px;letter-spacing:3px}.wide .home-heading{border-bottom:1px solid #b09a7066;padding-bottom:10px}.wide .home-eyebrow{display:none}.wide .scene-tabs button,.wide .inventory-slot,.wide .home-action,.wide .house-condition{border-radius:4px}.wide .scene-tip{font-size: max(var(--readable-min, 0px), 12px);margin:12px 0}.wide .home-dock{display:none}.wide .home-shortcut{flex-direction:row;justify-content:center;gap:10px;padding:9px}.wide .shortcut-icon{font-size:26px}.wide .shortcut-name{font-size: max(var(--readable-min, 0px), 13px);margin-top:0}.wide .scene-area{width:100%;max-width:1200px;align-self:center}.wide .scene-content:not(.garden-stage){padding:12px 0}.wide .scene-tabs{max-width:600px;width:100%;align-self:center}.wide .home-action{padding:16px}.wide .inventory-slot{padding:18px 5px}.wide .inventory-icon{font-size:40px}.wide .scene-detail{font-size: max(var(--readable-min, 0px), 12px)}
@media(max-height:650px){.home-eyebrow{display:none}.home-title{font-size:16px}.home.home-screen{padding-top:7px;padding-bottom:7px}.scene-tip{font-size: max(var(--readable-min, 0px), 10px);margin:3px 0}.home-dock{padding:4px;margin-top:5px}.home-shortcut{padding:4px}.shortcut-icon{font-size:20px}.scene-tabs{margin-bottom:4px}.scene-tabs button{padding:6px 1px}.home-action{padding:10px;margin:6px 0}.house-condition{padding:10px}.inventory-slot{padding:9px 2px}.inventory-icon{font-size:26px}}
@media(max-height:650px){
  .home-action{padding:8px;margin:5px 0}.action-copy{gap:2px}.action-copy>text:first-child{font-size: max(var(--readable-min, 0px), 12px);line-height:1.3}.action-copy .muted{line-height:1.3}.action-glyph{font-size:22px}
  .house-condition{padding:8px;margin-bottom:6px}.condition-value{font-size:20px;line-height:1.1;margin:3px 0}
}
.homestead { flex:1; min-height:0; display:flex; flex-direction:column; gap:8px; overflow:hidden; }
.homestead .home-stage { flex: .8; min-height:0; }
.homestead-garden { flex:1.2; min-height:0; display:flex; flex-direction:column; }
.garden-caption { display:flex; align-items:center; justify-content:space-between; flex-shrink:0; font-size: max(var(--readable-min, 0px), 12px); font-weight:700; margin-bottom:4px; }
.garden-caption>view { display:flex; gap:4px; }.garden-caption button { margin:0; padding:3px 10px; font-size: max(var(--readable-min, 0px), 10px); line-height:1.3; color:var(--muted); border-radius:5px; }.garden-caption button.active { background:var(--hud); color:#fff4df; }
.homestead-garden>.garden { flex:1; height:0; min-height:0; }
.homestead .scene-detail { display:none; }.homestead.arranging .homestead-garden { display:none; }
.wide .homestead { flex-direction:row; gap:24px; }.wide .homestead .home-stage { flex:1.4; }.wide .homestead-garden { flex:1; padding:10px 0; }.wide .garden-caption { font-size:15px; margin-bottom:10px; }
.home-dock { grid-template-columns:repeat(3,minmax(0,1fr)); }
@media(max-height:650px){.homestead {gap:4px;}.homestead .home-stage {flex:.55}.homestead-garden{flex:1.45}.garden-caption{font-size: max(var(--readable-min, 0px), 10px);margin-bottom:2px}}
@media(max-height:650px) and (max-width:600px){.homestead .home-stage{flex:.8}.homestead-garden{flex:1.2}}
.home.home-screen.tool-view{height:auto;min-height:100%;padding:6px 10px;background:transparent}.tool-view .scene-tip{font-size: max(var(--readable-min, 0px), 10px);margin-top:0}.tool-view .scene-tip button{display:none}
.tool-view .scene-area,.tool-view .scene-content{flex:none;overflow:visible}.tool-view .scene-empty{min-height:120px}
.tool-view .garden.scenic .pet{padding:12px;margin:8px 0}.tool-view .garden.scenic .pet .act-name{font-size:18px;margin-bottom:6px}.tool-view .garden.scenic .pet .block{font-size: max(var(--readable-min, 0px), 11px);line-height:1.5}.tool-view .garden.scenic .pet button{margin-top:8px;padding:6px 9px}
@media (max-width: 959px) {
  .home.home-screen { overflow-y: auto; }
  .home.home-screen .homestead { flex: none; min-height: 480px; overflow: visible; }
  .home.home-screen .homestead .home-stage { flex: none; min-height: 160px; }
  .home.home-screen .homestead-garden { flex: none; min-height: 310px; }
  .home.home-screen .homestead-garden > .garden { flex: none; height: auto; min-height: 260px; }
  .home.home-screen .scene-content { overflow-y: auto; }
}

/* Native WebGL must stay inside a non-scrolling, untransformed viewport. */
.home.home-screen.fixed-homestead { overflow: hidden; padding: 6px 12px; }
.home.home-screen.fixed-homestead .homestead {
  flex: 1; min-height: 0; overflow: hidden; margin-top: 4px;
}
.home.home-screen.fixed-homestead .home-stage,
.home.home-screen.fixed-homestead .homestead-garden {
  flex: 1; min-height: 0; overflow: hidden;
}
.home-stage .web-room-3d { position: absolute; inset: 0; width: 100%; }
.fixed-homestead .room-model { width: 100%; height: 100%; }
.home.home-screen.fixed-homestead .homestead-garden-content {
  display: block; flex: 1; height: 0; min-height: 0;
}
.fixed-homestead .garden-caption > view { margin-left: auto; }
.fixed-homestead .placement-note { box-sizing: border-box; min-height: 36px; }
.fixed-homestead .room-hint { color: var(--muted); }
.homestead-switch {
  display: flex; flex-shrink: 0; gap: 8px; padding-top: 5px;
}
.homestead-switch button {
  flex: 1; min-width: 0; min-height: 40px; margin: 0; padding: 6px 8px;
  line-height: 1.4; font-size: 14px; border-radius: 10px;
  background: var(--card); color: var(--ink);
}
.homestead-switch button.active { background: var(--hud); color: #fff4df; }
</style>
