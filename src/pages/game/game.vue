<template>
  <view v-if="ready" class="game theme-root" @click="closePopup" :class="['theme-' + settings.theme, wide ? 'wide' : 'narrow', { 'at-home-screen': tab === 'home' }]">
    <!-- PC：固定边框里的大场景，信息和指令参与布局，不覆盖画面。 -->
    <block v-if="wide">
      <view class="desktop-topbar">
        <view class="desktop-player"><avatar-card :profile="state.profile" :size="64" /><view><text class="desktop-name">{{ state.profile.name }}</text><text class="desktop-meta">{{ age() }} 岁 · {{ desktopLocation }}</text></view></view>
        <view class="desktop-resources"><view class="desktop-funds"><text class="resource-label">持有资金</text><text class="resource-value">{{ fmtMoney(state.money) }}</text></view><view v-for="r in desktopNeeds" :key="r.key" class="desktop-need"><view class="need-heading"><text>{{ r.name }}</text><text :class="{ critical: r.value < 25 }">{{ r.value }}</text></view><view class="need-track"><view :style="{ width: r.value + '%', background: r.value < 25 ? '#d66c55' : r.color }" /></view></view></view>
        <view class="desktop-date"><text class="desktop-hour">{{ fmtHour(state.hour) }}</text><text>{{ fmtDate(state.day) }} {{ weatherInfo().icon }}</text><text class="desktop-edition">萌宠陪伴版 · 11.04</text></view>
      </view>
      <view class="scene-layer">
        <view class="guided-scene">
        <view v-if="sheet" class="location-scene"><location-sheet docked :loc-id="sheet" @close="closeSheetByUser" @gohome="goHome" @go="onGo" /></view>
        <city-map v-else-if="tab === 'map'" @open="onOpen" @arrive-home="goHome" />
        <home-view v-else-if="tab === 'home'" wide @tool="openHomeTool" />
        <scroll-view v-else-if="tab === 'status'" scroll-y class="desktop-record"><view class="record-title">人物志 <text>经历、能力与人生目标</text></view><view class="record-grid"><game-hud /><side-status /></view></scroll-view>
        <scroll-view v-else scroll-y class="phone-scene"><phone-view :key="phoneApp" :initial-app="phoneApp" hide-apps /></scroll-view>
        </view>
      </view>
      <view class="desktop-commandbar">
        <view class="desktop-objective"><text class="objective-label">近况</text><guide-bar compact :style="{ background: 'transparent' }" /></view>
        <view class="desktop-commandrow"><view class="command-seal"><text>勇敢人生</text><text>生活指令</text></view><view class="desktop-commands"><view v-for="c in desktopCommands" :key="c.id" class="desktop-command-shell" @click.stop><button :id="'command-' + c.id" class="desktop-command" :class="{ active: commandActive(c) || (c.id === 'contacts' && socialMenu) }" :aria-label="c.name" :aria-expanded="c.id === 'contacts' ? socialMenu : undefined" @click="runCommand(c)"><text class="command-icon">{{ c.icon }}</text><text>{{ c.name }}</text><text v-if="c.id === 'contacts'" class="menu-caret">{{ socialMenu ? '▾' : '▴' }}</text></button><view v-if="c.id === 'contacts' && socialMenu" class="relation-flyout social-quick-menu"><button v-for="a in PHONE_APPS" :key="a.id" :class="{ active: popup === 'phone' && phoneApp === a.id }" @click="openPhone(a.id)"><text>{{ a.icon }}</text><text>{{ a.name }}</text><text v-if="a.id === 'msg' && state.unread" class="menu-unread">{{ state.unread }}</text></button></view><view v-if="c.id === 'room' && homeMenu" class="relation-flyout home-quick-menu"><button @click="closePopupByUser">🏠 家园</button><button @click="openHomeTool('inventory')">📦 仓库</button><button @click="openHomeTool('food')">🍱 生活</button><button @click="openHomeTool('pets')">🐾 宠物</button></view></view></view><view class="desktop-time"><button aria-label="暂停或继续" @click="togglePause">{{ settings.speed ? '暂停' : '继续' }}</button><view class="time-speeds"><button v-for="v in SPEEDS.filter(x => x > 0)" :key="v" :class="{ active: settings.speed === v }" @click="setSpeed(v)">{{ v }}×</button></view></view></view>
      </view>
    </block>

    <!-- 手机：竖屏单栏 + 底部标签 -->
    <block v-else>
      <view class="top">
        <game-hud :compact="!wide && tab === 'home'" />
        <guide-bar :compact="!wide && tab === 'home'" />
      </view>
      <view class="content">
        <view class="guided-scene">
        <location-sheet v-if="sheet" docked :loc-id="sheet" @close="closeSheetByUser" @gohome="goHome" @go="onGo" />
        <city-map v-else-if="tab === 'map'" @open="onOpen" @arrive-home="goHome" />
        <home-view v-else-if="tab === 'home'" :scene-covered="homeCanvasCovered" @tool="openHomeTool" />
        <scroll-view v-else scroll-y class="pane"><phone-view :key="phoneApp" :initial-app="phoneApp" hide-apps /></scroll-view>
        </view>
      </view>
      <view class="tabs" :class="{ 'popup-nav': !!popup || socialMenu || homeMenu }" @click.stop>
        <view v-if="socialMenu" class="relation-flyout social-quick-menu mobile-relation-flyout"><button v-for="a in PHONE_APPS" :key="a.id" :class="{ active: popup === 'phone' && phoneApp === a.id }" @click="openPhone(a.id)"><text>{{ a.icon }}</text><text>{{ a.name }}</text><text v-if="a.id === 'msg' && state.unread" class="menu-unread">{{ state.unread }}</text></button></view>
        <view v-if="homeMenu" class="relation-flyout home-quick-menu mobile-relation-flyout"><button @click="closePopupByUser">🏠 家园</button><button @click="openHomeTool('inventory')">📦 仓库</button><button @click="openHomeTool('food')">🍱 生活</button><button @click="openHomeTool('pets')">🐾 宠物</button></view>
        <view v-for="t in TABS" :key="t.id" :id="'mobile-' + t.id" class="tab" :class="{ on: popup === t.id || (t.id === 'phone' && socialMenu) || (tab === t.id && !popup) }" @click="switchTab(t.id)">
          <text class="tab-icon">{{ t.icon }}</text>
          <text class="tab-name">{{ t.name }}</text>
          <text v-if="t.id === 'phone' && state.unread" class="tab-dot" />
        </view>
      </view>
    </block>

    <view v-if="menuOpen" class="function-backdrop" @click.stop="closePopupByUser" />
    <view v-if="popup" class="function-popup" :style="popupStyle" role="dialog" aria-modal="true" :aria-label="popupTitle" @click.stop>
      <view class="function-popup-head"><button v-if="returnPopup" aria-label="返回原功能" @click="restorePopup">‹ 返回</button><text>{{ popupTitle }}</text><button aria-label="关闭浮层" @click="closePopupByUser">✕</button></view>
      <scroll-view scroll-y class="function-popup-body">
        <phone-view v-if="popup === 'phone'" :key="phoneApp" :initial-app="phoneApp" hide-apps />
        <shop-view v-else-if="popup === 'shop'" />
        <view v-else-if="popup === 'status'" class="popup-record"><game-hud /><side-status /></view>
        <home-view v-else :key="popup" :tool="popup === 'inventory' ? 'inventory' : popup === 'pets' ? 'pets' : 'food'" @place="placeFromWarehouse" />
      </scroll-view>
      <text class="function-popup-tip">{{ ui.homeTip ? ui.homeTip.text : '点击窗口外收起' }}</text>
    </view>
    <scene-guide :scene="mainGuide" :visible="ready && !menuOpen && !sheet && !state.pendingEvent && !state.pendingStory && !ui.reading && !ui.selectedFurniture" />
    <!-- #ifdef H5 -->
    <view v-if="authorPreview" class="author-preview" @click.stop>
      <template v-if="!preview">
        <input v-if="showPreviewGoals" v-model="earnAmount" inputmode="numeric" aria-label="今日净赚日元" placeholder="今日净赚 ¥" />
        <button v-if="showPreviewGoals" :disabled="authorStarting" @click="startPreview(true)">按目标代玩</button>
        <button v-if="showPreviewGoals" :disabled="authorStarting" @click="startPreview(false)">自由试玩</button>
        <button v-else @click="showPreviewGoals = true">代玩</button>
      </template>
      <template v-else>
        <text role="status">{{ previewMessage }}</text>
        <button v-if="previewPaused && previewSteps.length" @click="advancePreview(false)">单步</button>
        <button v-if="previewSteps.length" @click="togglePreview">{{ previewPaused ? '继续' : '暂停' }}</button>
        <button v-if="!previewManual" @click="takePreviewControl">接管</button>
        <button v-if="previewTrace.length" @click="downloadPreviewTrace">导出试玩记录</button>
        <button @click="stopPreview">退出演示</button>
      </template>
    </view>
    <view v-if="preview && !previewManual" class="author-preview-shield" />
    <!-- #endif -->
    <event-modal />
    <story-modal />
    <inner-os />
  </view>
</template>

<script setup>
import { ref, computed, watch, nextTick, getCurrentInstance } from 'vue'
import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app'
import SceneGuide from '../../components/scene-guide/scene-guide.vue'
import GameHud from '../../components/game-hud/game-hud.vue'
import GuideBar from '../../components/guide-bar/guide-bar.vue'
import CityMap from '../../components/city-map/city-map.vue'
import HomeView from '../../components/home-view/home-view.vue'
import PhoneView from '../../components/phone-view/phone-view.vue'
import LocationSheet from '../../components/location-sheet/location-sheet.vue'
import EventModal from '../../components/event-modal/event-modal.vue'
import SideStatus from '../../components/side-status/side-status.vue'
import StoryModal from '../../components/story-modal/story-modal.vue'
import InnerOs from '../../components/inner-os/inner-os.vue'
import ShopView from '../../components/shop-view.vue'
import AvatarCard from '../../components/avatar-card/avatar-card.vue'
import { PHONE_APPS } from '../../game/data/phone-apps.js'
import { HOME_NAV } from '../../game/data/home-scenes.js'
import { LOCATION_MAP } from '../../game/data/locations.js'
import { state, load, tickClock, save, fmtMoney, fmtHour, fmtDate, age, weatherInfo } from '../../game/index.js'
import { settings, setSpeed, SPEEDS } from '../../game/themes.js'
import { ui, requestWalk, requestNudge } from '../../game/ui.js'
import { play, playTabSwitch } from '../../game/audio.js'
import { autoCloudSave } from '../../game/account.js'
// #ifdef H5
import { api, getToken } from '../../game/api.js'
import { beginRehearsal, endRehearsal, dailyUsed } from '../../game/engine/core.js'
import { freePreviewMode, previewArrival } from '../../game/free-preview.js'
import { NPCS } from '../../game/data/npcs.js'
import { planEarnings } from '../../game/earn-preview.js'
import { applyJob, doAction, locVisible, npcsAt, sleep, spotOf, talk, travel, useItem, wait, work } from '../../game/index.js'
// #endif

const TABS = [
  { id: 'map', name: '地图', icon: '🗺️' },
  { id: 'home', name: '家园', icon: '🏠' },
  { id: 'shop', name: '商店', icon: '🛍️' },
  { id: 'life', name: '生活', icon: '☕' },
  { id: 'status', name: '人物', icon: '🪪' },
  { id: 'phone', name: '关系', icon: '👥' }
]

const preview = ref(false)
const previewManual = ref(false)
const ready = ref(false)
const tab = ref('map')
const sheet = ref('')
const phoneApp = ref('contacts')
const socialMenu = ref(false)
const homeMenu = ref(false)
const popup = ref('')
const popupStyle = ref({})
const returnPopup=ref(null)
const menuOpen = computed(() => !!popup.value || socialMenu.value || homeMenu.value)
const homeCanvasCovered = computed(() => {
  // #ifdef MP-WEIXIN
  // A native WebGL surface can paint above ordinary popup views.
  return !ui.gameVisible || menuOpen.value || !!state.pendingEvent || !!state.pendingStory || ui.reading
  // #endif
  // #ifndef MP-WEIXIN
  return false
  // #endif
})
const mainGuide = computed(() => tab.value === 'home' ? ui.homeScene : 'map')
const instance = getCurrentInstance()
const popupTitle = computed(() => popup.value === 'phone' ? (PHONE_APPS.find(a=>a.id===phoneApp.value)?.name || '关系') : ({shop:'商店',status:'人物',inventory:'家园仓库',life:'生活',pets:'宠物'})[popup.value] || '生活')
watch(popup, value => { ui.popupActive = !!value })
watch(() => ui.width, () => closePopup())
function closePopupByUser(){
  if(popup.value || socialMenu.value || homeMenu.value || ui.homeTip) play('closePanel')
  closePopup()
}
function closePopup(){ returnPopup.value=null; popup.value=''; socialMenu.value=false; homeMenu.value=false; ui.homeTip=null }
function showPopup(kind, anchor){
  ui.homeTip=null
  popup.value=kind
  const info=uni.getSystemInfoSync(), w=info.windowWidth, h=info.windowHeight
  const width=Math.min(560,w-24)
  const position=rect=>{
    const top=rect?.top || h-85
    const height=Math.max(130,Math.min(w>=960?460:380,top-20))
    const left=Math.max(12,Math.min(w-width-12,(rect?.left || w/2)+(rect?.width || 0)/2-width/2))
    popupStyle.value={left:left+'px',bottom:(h-top+7)+'px',width:width+'px',height:height+'px'}
  }
  position(null)
  nextTick(()=>uni.createSelectorQuery().in(instance.proxy).select(anchor).boundingClientRect(rect=>position(rect)).exec())
}
function openHomeTool(id){
  const target=id==='inventory'?'inventory':id==='pets'?'pets':'life'
  if(popup.value!==target) play('openPanel')
  returnPopup.value=null
  socialMenu.value=false
  const key=id==='inventory'?'inventory':id==='pets'?'pets':'life'
  showPopup(key,homeMenu.value?'.home-quick-menu':wide.value?'#command-room':'#mobile-home')
}
function placeFromWarehouse(id){closePopup();ui.homeScene='room';ui.selectedFurniture=id;tab.value='home';sheet.value=''}
const wide = computed(() => ui.layout === 'wide')

function popupAnchor(kind){
  const id=kind==='inventory'||kind==='pets'?'room':kind==='phone'?'contacts':kind
  if(wide.value)return '#command-'+id
  return '#mobile-'+(id==='room'?'home':id==='contacts'?'phone':id)
}
function restorePopup(){
  if(returnPopup.value) play('closePanel')
  const previous=returnPopup.value
  if(!previous)return
  returnPopup.value=null
  if(previous.kind==='home'){closePopup();tab.value='home';sheet.value='';ui.homeScene='room';return}
  if(previous.app)phoneApp.value=previous.app
  showPopup(previous.kind,popupAnchor(previous.kind))
}
watch(()=>ui.functionRequest,req=>{
  if(!req)return
  if(req.kind==='home'||req.kind==='map'){
    closePopup();sheet.value=req.location||'';tab.value=req.kind;ui.homeScene='room';return
  }
  if(req.kind==='shop'){
    if(popup.value!=='shop')returnPopup.value=popup.value?{kind:popup.value,app:phoneApp.value}:{kind:'home'}
    if(req.category)ui.shopCategory=req.category
    ui.shopProduct=req.product||''
  }else returnPopup.value=null
  if(req.kind==='phone')phoneApp.value=req.app||'life'
  socialMenu.value=false;homeMenu.value=false
  showPopup(req.kind,popupAnchor(req.kind))
})


const desktopLocation = computed(() => LOCATION_MAP[state.location]?.name || '东京')
const desktopNeeds = computed(() => [
  { key: 'hunger', name: '饱腹', color: '#d9b875' },
  { key: 'energy', name: '精力', color: '#88b4cc' },
  { key: 'mood', name: '心情', color: '#c9989f' },
  { key: 'health', name: '健康', color: '#97ad88' }
].map(r => ({ ...r, value: Math.round(state.stats[r.key]) })))
const desktopCommands = [
  {id:'map',name:'地图',icon:'舆'}, {id:'room',name:'家园',icon:'居'},
  {id:'shop',name:'商店',icon:'市'}, {id:'life',name:'生活',icon:'食'},
  {id:'contacts',name:'关系',icon:'缘'}, {id:'status',name:'人物',icon:'志'}
]
function commandActive(c){
  if(c.id==='map')return tab.value==='map'&&!popup.value
  if(c.id==='room')return tab.value==='home'&&!popup.value
  if(c.id==='contacts')return popup.value==='phone'
  return popup.value===c.id
}
function runCommand(c){
  navigationAudio(c.id==='contacts'?'phone':c.id==='room'?'home':c.id)
  returnPopup.value=null
  if(c.id==='contacts'){popup.value='';homeMenu.value=false;socialMenu.value=!socialMenu.value;return}
  if(c.id==='room'){popup.value='';socialMenu.value=false;homeMenu.value=!homeMenu.value;tab.value='home';ui.homeScene='room';return}
  socialMenu.value=false;homeMenu.value=false
  if(c.id==='map'){closePopup();tab.value='map';sheet.value='';return}
  showPopup(c.id,'#command-'+c.id)
}

onLoad(() => {
  // 刷新页面或直接打开时从存档恢复
  if (!state.started && !load()) {
    uni.reLaunch({ url: '/pages/index/index' })
    return
  }
  ready.value = true
})

// 实时时钟：现实每秒走 settings.speed 分钟；弹出随机事件、播放剧情或切到后台时暂停
let clock = null
let seconds = 0
function startClock() {
  if (clock) return
  clock = setInterval(() => {
    // 登录后每 60 秒把进度同步到云端自动存档
    seconds += 1
    if (seconds % 60 === 0) autoCloudSave()
    if (!ready.value || preview.value || !settings.speed || state.pendingEvent || state.pendingStory || ui.reading) return
    tickClock(settings.speed)
  }, 1000)
}
function stopClock() {
  if (clock) clearInterval(clock)
  clock = null
}

// 电脑键盘快捷键（只在网页版生效）
let lastSpeed = 1
function onKey(e) {
  if (preview.value && !previewManual.value) return
  const tag = e.target && e.target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (popup.value && e.key !== 'Escape') return
  if (e.key === ' ') {
    e.preventDefault()
    if (settings.speed) {
      lastSpeed = settings.speed
      setSpeed(0)
    } else setSpeed(lastSpeed || 1)
  } else if (e.key === '1') tab.value = 'map'
  else if (e.key === '2') tab.value = 'home'
  else if (e.key === '3') { socialMenu.value=true; homeMenu.value=false }
  else if (e.key === 'Escape') { sheet.value = ''; closePopup() }
  else if (e.key.indexOf('Arrow') === 0 && tab.value === 'map' && !sheet.value) {
    e.preventDefault()
    const d = { ArrowUp: [0, -3], ArrowDown: [0, 3], ArrowLeft: [-4, 0], ArrowRight: [4, 0] }[e.key]
    if (d) requestNudge(d[0], d[1])
  }
}

onShow(() => {
  ui.gameVisible = true
  startClock()
  // #ifdef H5
  const token = getToken()
  const visit = ++previewVisit
  if (token) api('GET', '/api/me/preview').then(() => {
    if (previewVisit === visit && getToken() === token) authorPreview.value = true
  }).catch(() => {})
  window.addEventListener('keydown', onKey)
  // #endif
})
function teardown() {
  // #ifdef H5
  previewVisit++
  authorPreview.value = false
  stopPreview()
  // #endif
  ui.gameVisible = false
  closePopup()
  ui.popupActive=false
  save()
  stopClock()
  // #ifdef H5
  window.removeEventListener('keydown', onKey)
  // #endif
}
onHide(teardown)
onUnload(teardown)

function closeSheetByUser() {
  if(sheet.value) play('closePanel')
  sheet.value = ''
}
function onOpen(id) {
  if (id === 'home' && state.location === 'home') {
    tab.value = 'home'
    return
  }
  sheet.value = id
}

function openPhone(app) {
  if(popup.value !== 'phone') play('openPanel')
  else if(phoneApp.value !== app) playTabSwitch()
  returnPopup.value=null
  phoneApp.value=app
  homeMenu.value=false
  showPopup('phone','.social-quick-menu')
}

function focusCurrentLocation() {
  tab.value = 'map'
  requestNudge(0, 0)
}

function togglePause() {
  play('toggle')
  if (settings.speed) {
    lastSpeed = settings.speed
    setSpeed(0)
  } else setSpeed(lastSpeed || 1)
}

function navigationAudio(id){
  if(id==='phone' || id==='home') {
    const open=id==='phone'?socialMenu.value:homeMenu.value
    play(open?'closePanel':'openPanel')
  } else if(['shop','life','status'].includes(id)) {
    if(popup.value!==id) play('openPanel')
  } else if(tab.value!==id) playTabSwitch()
  else if(popup.value || socialMenu.value || homeMenu.value) play('closePanel')
}
function switchTab(id){
  navigationAudio(id)
  returnPopup.value=null
  if(id==='phone'){popup.value='';homeMenu.value=false;socialMenu.value=!socialMenu.value;return}
  if(id==='home'){popup.value='';socialMenu.value=false;homeMenu.value=!homeMenu.value;sheet.value='';tab.value='home';ui.homeScene='room';return}
  if(['shop','life','status'].includes(id)){socialMenu.value=false;homeMenu.value=false;showPopup(id,'#mobile-'+id);return}
  closePopup();sheet.value='';tab.value=id
}

function goHome() {
  ui.homeScene = 'room'
  sheet.value = ''
  tab.value = 'home'
}

// #ifdef H5
const authorPreview = ref(false)
const authorStarting = ref(false)
const previewPaused = ref(false)
const previewMessage = ref('')
const previewSteps = ref([])
const previewTrace = ref([])
const showPreviewGoals = ref(false)
const earnAmount = ref('5000')
let earnGoal = null
let previewOpeningBalance = 0
let previewVisit = 0
let previewTimer
let previewNavigation
let previewGardenTried = false
let previewActivities = new Set()
let previewActivityDay = 0
let previewContact = ''
let previewContactDay = 0

function stopPreview() {
  clearTimeout(previewTimer)
  previewSteps.value = []
  earnGoal = null
  showPreviewGoals.value = false
  if (!preview.value) return
  endRehearsal()
  preview.value = false
  closePopup()
  Object.assign(ui, previewNavigation.ui)
  tab.value = previewNavigation.tab
  sheet.value = previewNavigation.sheet
  previewNavigation = null
}

function clickPreviewControl(id) {
  return clickPreviewElement(document.getElementById(id))
}

function clickPreviewElement(button) {
  if (!button || button.disabled || !button.getClientRects().length) return false
  button.scrollIntoView({ block: 'nearest' })
  button.click()
  return true
}

function previewSnapshot() {
  return { location: state.location, day: state.day, hour: state.hour, money: state.money, stats: { ...state.stats } }
}

function downloadPreviewTrace() {
  const data = { schema: 2, exportedAt: new Date().toISOString(), goal: earnGoal, steps: previewTrace.value }
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'bravelife-playtest-' + Date.now() + '.json'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function advancePreview(automatic) {
  const step = previewSteps.value[0]
  if (!step) return
  let [label, action, verify] = step
  const before = previewSnapshot()
  const previousTxn = state.txns[0]
  const previousRelations = Object.fromEntries(Object.entries(state.social).map(([id, rel]) => [id, rel.aff]))
  let ok = false
  try {
    const outcome = action()
    if (outcome?.label) label = outcome.label
    ok = outcome !== false && outcome?.ok !== false && (!verify || verify())
  } catch (error) {
    console.error('Author preview step failed', error)
  }
  const ledgerStart = previousTxn ? state.txns.indexOf(previousTxn) : -1
  const transactions = state.txns.slice(0, ledgerStart < 0 ? state.txns.length : ledgerStart).map(row => ({ ...row }))
  const relationships = Object.entries(state.social)
    .filter(([id, rel]) => previousRelations[id] !== rel.aff)
    .map(([id, rel]) => ({ id, before: previousRelations[id] ?? null, after: rel.aff }))
  previewTrace.value = [...previewTrace.value.slice(-199), { label, ok, before, after: previewSnapshot(), transactions, relationships }]
  if (!ok) {
    previewMessage.value = '演示停在「' + label + '」。请检查当前界面，或接管后亲自操作。'
    previewPaused.value = true
    previewSteps.value = []
    return
  }
  previewSteps.value = previewSteps.value.slice(1)
  previewMessage.value = label
  if (!previewSteps.value.length) previewSteps.value = planPreview()
  if (automatic && previewSteps.value.length) previewTimer = setTimeout(() => advancePreview(true), 1600)
}

function togglePreview() {
  clearTimeout(previewTimer)
  previewPaused.value = !previewPaused.value
  if (!previewPaused.value) advancePreview(true)
}

function takePreviewControl() {
  clearTimeout(previewTimer)
  previewSteps.value = []
  previewManual.value = true
  previewMessage.value = '已接管演示副本，退出后恢复原进度。'
}

function openPreviewGarden() {
  return document.getElementById('home-garden-panel')?.getAttribute('aria-pressed') === 'true' ||
    clickPreviewControl('home-garden-panel')
}

function previewTravel(destination, reason) {
  const name = LOCATION_MAP[destination].name
  const mode = freePreviewMode(destination)
  return [[(mode?.name || '免费出行') + '前往' + name + ' · ' + reason, () => {
    closePopup()
    tab.value = 'map'
    sheet.value = destination
    if (!mode || !travel(destination, mode.id)) return false
    if (destination === 'home') goHome()
    return true
  }, () => state.location === destination]]
}

function planEarningsStep(route = planEarnings(earnGoal)) {
  if (!route.next) {
    previewMessage.value = route.message
    return []
  }
  const step = route.next
  const summary = '预计 ' + fmtHour(route.end) + ' 完成 · 余下路线净赚 ' + fmtMoney(route.net)
  previewMessage.value = summary
  switch (step.type) {
    case 'nap': return [['小睡两小时恢复精力 · ' + summary, () => { goHome(); return sleep(false) }]]
    case 'wait': return [['等到可办理入职或开班 · ' + summary, () => wait(step.hours)]]
    case 'travel': return [[step.label + '前往' + LOCATION_MAP[step.destination].name + ' · ' + summary, () => {
      closePopup()
      tab.value = 'map'
      sheet.value = step.destination
      return travel(step.destination, step.mode)
    }]]
    case 'apply': return [['申请' + route.jobName + ' · ' + summary, () => applyJob(step.career)]]
    case 'work': return [['开始上班 · ' + summary, work]]
  }
}

function playPreviewScene() {
  const story = document.querySelector('.st-mask')
  const event = story ? null : document.querySelector('.ev-mask')
  const title = (story?.querySelector('.st-title') || event?.querySelector('.ev-title'))?.textContent.trim() || '当前情节'
  const choices = Array.from((story || event)?.querySelectorAll('[data-preview-cost]') || [])
  if (!choices.length) return {
    ok: clickPreviewElement(story?.querySelector('.st-btn, .st-scene')),
    label: title + ' · 继续阅读'
  }
  if (choices.some(choice => choice.dataset.previewAuthor === 'yes')) {
    return { ok: false, label: title + ' · 人生方向请作者接管选择' }
  }
  const budget = earnGoal ? 0 : Math.max(0, state.money - previewOpeningBalance)
  const choice = choices.sort((a, b) => Number(a.dataset.previewCost) - Number(b.dataset.previewCost))[0]
  const cost = Number(choice.dataset.previewCost)
  if (cost > budget) return { ok: false, label: title + ' · 可选分支超出预算，请作者接管' }
  return {
    ok: clickPreviewElement(choice),
    label: title + ' · ' + choice.textContent.trim() + ' · 选预计支出最低的分支（¥' + cost + '）'
  }
}

function previewRelationship() {
  if (previewContactDay === state.day) return null
  const candidates = NPCS.flatMap(npc => {
    if (dailyUsed('talk:' + npc.id)) return []
    const destination = spotOf(npc).location
    const arrival = previewArrival(destination)
    if (!arrival || arrival.hunger < 55 || !npcsAt(destination, arrival.hour).some(n => n.id === npc.id)) return []
    return [{ npc, destination, arrival }]
  })
  candidates.sort((a, b) => Number(b.npc.id === previewContact) - Number(a.npc.id === previewContact) ||
    a.arrival.hours - b.arrival.hours)
  const next = candidates[0]
  if (!next) return null
  const { npc, destination } = next
  if (destination !== state.location) return previewTravel(destination, '到达时' + npc.name + '在场')
  return [[(state.social[npc.id] ? '回访' : '认识') + npc.name, () => {
    if (!talk(npc.id)) return false
    previewContact = npc.id
    previewContactDay = state.day
    return true
  }]]
}

function planPreview() {
  if (earnGoal && (state.day !== earnGoal.day || state.money >= earnGoal.balance)) return planEarningsStep()
  if (state.pendingStory || state.pendingEvent || ui.reading) {
    return [['继续当前剧情或事件', playPreviewScene]]
  }

  if (earnGoal) return planEarningsStep()

  const current = state.location
  const { energy, hunger, mood } = state.stats
  if (energy < 35) {
    if (current !== 'home') return previewTravel('home', '精力偏低，先回家休息')
    return [['在家睡一觉，恢复精力', () => { closePopup(); goHome(); return sleep(true) }]]
  }

  const spendable = Math.max(0, state.money - previewOpeningBalance)
  if (hunger < (current === 'konbini' ? 62 : 55)) {
    if (state.bag.onigiri > 0) return [['吃背包里的饭团，节省开支', () => useItem('onigiri')]]
    if (spendable >= 150 && locVisible('konbini')) {
      if (current !== 'konbini') return previewTravel('konbini', '饱腹偏低，免费前往便利店')
      const meal = spendable >= 600 ? 'bento' : 'onigiri'
      return [[meal === 'bento' ? '用试玩盈余买便当' : '用试玩盈余买饭团',
        () => doAction('konbini', meal)]]
    }
  }

  if (state.job && hunger >= 20) {
    const route = planEarnings({ day: state.day, balance: state.money + 1 }, { freeTravel: true })
    if (route.next) return planEarningsStep(route)
  }

  if (hunger < 20) {
    previewMessage.value = '饱腹太低，背包无饭团且试玩盈余不足。可接管或改用按目标代玩。'
    return []
  }

  const canGarden = state.garden.plots.every(Boolean) || state.garden.seeds.radish > 0 || spendable >= 50
  if (current === 'home' && !previewGardenTried && canGarden) {
    previewGardenTried = true
    return planPreviewGarden()
  }

  const relationship = previewRelationship()
  if (relationship) return relationship
  if (previewActivityDay !== state.day) {
    previewActivityDay = state.day
    previewActivities.clear()
  }
  const destinations = mood < 55 ? ['park', 'library'] : ['library', 'park']
  const destination = destinations.find(id => {
    if (previewActivities.has(id)) return false
    const arrival = previewArrival(id)
    return arrival && arrival.hunger >= 55
  })
  const activities = { library: ['novel', '读小说，提升心情和创意'], park: ['walk', '在公园散步，恢复心情'] }
  if (destination === current) {
    const activity = activities[current]
    return [[activity[1], () => {
      if (!doAction(current, activity[0])) return false
      previewActivities.add(current)
      return true
    }]]
  }
  if (destination) return previewTravel(destination, '预计到达时仍营业，且状态足以体验')
  if (current !== 'home') return previewTravel('home', '附近的目标地点已关门')
  return [['在家小睡，等下一段营业时间', () => { closePopup(); goHome(); return sleep(false) }]]
}

function planPreviewGarden() {
  const plot = state.garden.plots.findIndex(p => !p)
  if (plot < 0) {
    return [
      ['菜园已种满，先看看作物', () => { closePopup(); goHome() }],
      ['打开菜园面板', openPreviewGarden],
      ['收获成熟作物，或给生长中的作物浇水', () =>
        clickPreviewControl('garden-harvest') || clickPreviewControl('garden-water')]
    ]
  }
  const seeds = state.garden.seeds.radish || 0
  const steps = []
  if (!seeds) steps.push(
    ['打开商店', () => showPopup('shop', popupAnchor('shop'))],
    ['到园艺区选萝卜种子', () => clickPreviewControl('shop-tab-garden')],
    ['买一份种子', () => clickPreviewControl('shop-buy-seed_radish'), () => state.garden.seeds.radish === 1]
  )
  steps.push(
    ['回家查看菜园', () => { closePopup(); goHome() }],
    ['打开菜园面板', openPreviewGarden],
    ['选择萝卜种子', () => clickPreviewControl('garden-seed-radish')],
    ['点击空地播种', () => clickPreviewControl('garden-plot-' + plot), () => !!state.garden.plots[plot]]
  )
  if (state.garden.pets.dog && state.garden.feed.dog && state.garden.pets.dog.fedUntil <= Date.now()) {
    const food = state.garden.feed.dog
    steps.push(
      ['打开小狗照料面板', () => { ui.homeTools.pet = 'dog'; openHomeTool('pets') }],
      ['小狗饿了，喂一份库存狗粮', () => clickPreviewControl('garden-feed-dog'), () => state.garden.feed.dog === food - 1]
    )
  }
  return steps
}

async function startPreview(targeted) {
  if (authorStarting.value || preview.value) return
  const input = String(earnAmount.value).trim()
  const amount = Number(input)
  if (targeted && (!/^\d+$/.test(input) || amount <= 0 || !Number.isSafeInteger(state.money + amount))) {
    uni.showToast({ title: '请输入有效的正整数日元金额', icon: 'none' })
    return
  }
  const visit = previewVisit
  const token = getToken()
  authorStarting.value = true
  try {
    await api('POST', '/api/me/preview')
    if (visit !== previewVisit || token !== getToken()) return
    if (!beginRehearsal()) return
    previewNavigation = { tab: tab.value, sheet: sheet.value, ui: {
      homeScene: ui.homeScene, selectedSeed: ui.selectedSeed, shopCategory: ui.shopCategory,
      shopProduct: ui.shopProduct, selectedFurniture: ui.selectedFurniture, homeTools: { ...ui.homeTools }
    } }
    previewOpeningBalance = state.money
    earnGoal = targeted ? { day: state.day, startBalance: state.money, balance: state.money + amount } : null
    previewTrace.value = []
    previewGardenTried = false
    previewActivities.clear()
    previewActivityDay = 0
    previewContact = ''
    previewContactDay = 0
    previewManual.value = false
    previewPaused.value = false
    preview.value = true
    previewSteps.value = planPreview()
    advancePreview(true)
  } catch (e) {
    if (visit === previewVisit) {
      stopPreview()
      if (e.status === 401 || e.status === 404) authorPreview.value = false
      uni.showToast({ title: '无法启动代玩', icon: 'none' })
    }
  } finally {
    authorStarting.value = false
  }
}
// #endif

// 地点面板点「前往」：关掉面板，切到地图，主人公走过去
function onGo(id, mode) {
  sheet.value = ''
  tab.value = 'map'
  // 等地图组件挂载后再发走路请求
  setTimeout(() => requestWalk(id, mode), 50)
}
</script>

<style>
.game {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.top {
  flex-shrink: 0;
  z-index: 20;
}
.content {
  flex: 1;
  height: 0;
  position: relative;
  z-index: 1;
}
.pane {
  height: 100%;
}
.tabs {
  flex-shrink: 0;
  z-index: 30;
  display: flex;
  background: var(--card);
  border-top: var(--bw) solid var(--line);
  padding-bottom: env(safe-area-inset-bottom);
}
.tab {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx 0 10rpx;
  color: var(--muted);
}
.tab.on {
  color: var(--accent);
}
.tab.on .tab-icon {
  transform: rotate(-6deg) scale(1.12);
}
.tab-icon {
  font-size: 44rpx;
}
.tab-name {
  font-size: max(var(--readable-min, 0px), 22rpx);
  font-weight: 700;
  font-family: var(--title-font);
}
.tab-dot {
  position: absolute;
  top: 12rpx;
  right: 38%;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--warn);
}
.narrow {
  max-width: 480px;
  margin: 0 auto;
}

/* PC采用上下固定边框与弹性场景；没有覆盖场景的侧栏。 */
.game.wide { --hud: #26364a; --line: #b09a70; --accent: #934b3f; display:flex; flex-direction:column; background:#1e2b3b; color:var(--ink); overflow:hidden; }
.desktop-topbar { flex-shrink:0; min-height:72px; display:grid; grid-template-columns:180px minmax(0,1fr) 160px; gap:24px; align-items:center; padding:10px 20px; box-sizing:border-box; background:linear-gradient(#304057,#1e2b3c); border-bottom:2px solid #ad9261; color:#eee1c2; box-shadow:inset 0 0 0 1px #73809444; }
.desktop-player{display:flex;align-items:center;gap:12px;min-width:0}.desktop-player>view{min-width:0}.desktop-name{display:block;font-size:17px;font-weight:700;letter-spacing:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desktop-meta{display:block;margin-top:5px;font-size: max(var(--readable-min, 0px), 11px);color:#b9bec4}
.desktop-resources{display:flex;align-items:center;justify-content:center;gap:22px;min-width:0}.desktop-funds{min-width:125px}.resource-label{display:block;font-size: max(var(--readable-min, 0px), 10px);letter-spacing:2px;color:#b9bec4}.resource-value{display:block;margin-top:5px;font-size:19px;color:#e7c982;font-variant-numeric:tabular-nums;white-space:nowrap}.desktop-need{width:85px;min-width:55px}.need-heading{display:flex;justify-content:space-between;font-size: max(var(--readable-min, 0px), 11px);color:#e0d8c5;margin-bottom:8px}.need-track{height:5px;background:#142131;border:1px solid #65718277}.need-track>view{height:100%}.need-heading .critical{color:#f29b80}
.desktop-date{text-align:right;color:#c5c6c4;font-size: max(var(--readable-min, 0px), 10px)}.desktop-date>text{display:block}.desktop-hour{font-size:24px;color:#f4e7c8;font-variant-numeric:tabular-nums;letter-spacing:2px;line-height:1.2}.desktop-edition{font-size: max(var(--readable-min, 0px), 9px);color:#a5acb5;margin-top:3px}
.scene-layer{position:relative;flex:1;height:0;min-height:0;width:100%;overflow:hidden;box-sizing:border-box;border-left:6px solid #233248;border-right:6px solid #233248;background:var(--paper)}
.desktop-commandbar{flex-shrink:0;background:linear-gradient(#2c3b4e,#1c2838);border-top:2px solid #ae925f;color:#e9ddbd;box-shadow:inset 0 0 0 1px #74809433}.desktop-objective{display:flex;align-items:center;min-height:28px;padding:0 16px;border-bottom:1px solid #8e7b553f}.objective-label{flex-shrink:0;padding-right:14px;font-family:serif;font-size: max(var(--readable-min, 0px), 11px);letter-spacing:3px;color:#d3b67c}.desktop-objective>view{flex:1;min-width:0}.desktop-commandrow{display:flex;align-items:stretch;gap:14px;padding:9px 18px;min-height:58px;box-sizing:border-box}.command-seal{width:92px;flex-shrink:0;display:flex;flex-direction:column;justify-content:center;gap:5px;border-right:1px solid #8c795655;color:#d2b77f}.command-seal>text:first-child{font-family:serif;font-size:16px;letter-spacing:2px}.command-seal>text:last-child{font-size: max(var(--readable-min, 0px), 9px);letter-spacing:4px;color:#9ba5b0}
.desktop-commands{display:flex;flex:1;min-width:0;gap:6px;justify-content:center}.desktop-command{position:relative;flex:1;max-width:108px;min-width:0;margin:0;padding:5px 3px;line-height:1.4;display:flex;align-items:center;justify-content:center;gap:6px;background:#35465a;color:#e4d8b9;border:1px solid #8c7955;border-radius:3px;font-size: max(var(--readable-min, 0px), 12px);box-shadow:inset 0 0 0 1px #14203188}.desktop-command::after,.desktop-time button::after{border:0}.desktop-command:hover{background:#43556c;color:#fff4d6}.desktop-command.active{background:linear-gradient(#a47e47,#76532f);color:#fff1c9;border-color:#d6b77b}.command-icon{font-family:serif;font-size:18px;color:#ddc696}.command-badge{position:absolute;right:3px;top:1px;font-size: max(var(--readable-min, 0px), 9px);color:#ffd0b3}.desktop-time{display:flex;gap:8px;align-items:center;border-left:1px solid #8c795655;padding-left:14px;flex-shrink:0}.desktop-time button{margin:0;padding:5px 10px;background:#172536;border:1px solid #8c7955;border-radius:3px;color:#c6c9cb;font-size: max(var(--readable-min, 0px), 11px);line-height:1.4}.time-speeds{display:flex;gap:3px}.time-speeds button{padding:5px 8px}.time-speeds button.active{background:#a78b54;color:#172536;border-color:#d4ba80}
.game{height:100dvh}.location-scene,.phone-scene,.desktop-record{height:100%;min-height:0;background:var(--paper);box-sizing:border-box;padding:18px 24px}.record-title{font-family:serif;font-size:25px;font-weight:700;letter-spacing:4px;margin-bottom:18px}.record-title>text{font-family:sans-serif;font-size: max(var(--readable-min, 0px), 12px);color:var(--muted);letter-spacing:1px;margin-left:20px}.record-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:1200px;margin:0 auto}
@media(max-width:1200px){.desktop-topbar{grid-template-columns:145px minmax(0,1fr) 135px;gap:14px;padding-left:14px;padding-right:14px}.desktop-resources{gap:12px}.desktop-funds{min-width:110px}.resource-value{font-size:16px}.desktop-need{width:70px}.command-seal{display:none}.desktop-commandrow{gap:8px;padding-left:10px;padding-right:10px}.desktop-command{gap:4px;font-size: max(var(--readable-min, 0px), 11px)}.desktop-time{padding-left:8px}.desktop-time button{padding:5px 6px}}
.desktop-command-shell { flex:1; max-width:150px; min-width:0; position:relative; display:flex; }
.desktop-command-shell>.desktop-command { max-width:none; width:100%; height:100%; box-sizing:border-box; }
.desktop-commandrow { position:relative; z-index:20; }.menu-caret { font-size: max(var(--readable-min, 0px), 10px); }
.relation-flyout { position:absolute; bottom:calc(100% + 9px); right:0; width:340px; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:5px; padding:9px; box-sizing:border-box; border:1px solid #b49b6d; border-radius:6px; background:#26364a; box-shadow:0 5px 20px #14213144; z-index:60; }
.relation-flyout button { position:relative; margin:0; padding:10px 2px; background:#35465a; color:#eee1c2; font-size: max(var(--readable-min, 0px), 12px); line-height:1.4; display:flex; flex-direction:column; align-items:center; gap:4px; border-radius:4px; }.relation-flyout button::after { border:0; }.relation-flyout button.active { background:#8c6d43; color:#fff2cf; }.menu-unread { position:absolute; right:5px; top:2px; color:#ffbe9a; font-size: max(var(--readable-min, 0px), 10px); }
.tabs { position:relative; }.mobile-relation-flyout { right:12px; left:12px; width:auto; bottom:calc(100% + 7px); }.mobile-relation-flyout button { padding:8px 2px; font-size: max(var(--readable-min, 0px), 11px); }
.desktop-commandbar{position:relative;z-index:80}.tabs.popup-nav{z-index:80}
.function-backdrop{position:fixed;inset:0;z-index:70;background:transparent;pointer-events:auto}
.function-popup{position:fixed;z-index:90;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;border:1px solid #b29a6a;border-radius:10px;background:#f8f1de;box-shadow:0 10px 30px #18243544;pointer-events:auto;color:var(--ink)}
.function-popup-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #b29a6a66;flex-shrink:0;font-size:17px;font-weight:700}.function-popup-head button{margin:0;padding:2px 10px;font-size:15px;line-height:1.6;background:transparent;color:var(--ink)}.function-popup-head button::after{border:0}
.function-popup-body{flex:1;height:0;min-height:0}.function-popup-tip{display:block;flex-shrink:0;padding:7px 12px;border-top:1px solid #b29a6a44;font-size: max(var(--readable-min, 0px), 10px);color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.popup-record{padding:10px}.function-popup .phone{padding:12px}.function-popup .shop-view{padding:10px}

/* Keep scene actors below menus and their input backdrop. */
.content, .scene-layer { display: flex; flex-direction: column; }
.guided-scene { isolation: isolate; flex: 1; height: 0; min-height: 0; position: relative; overflow: hidden; }
@media (max-width: 959px) {
  .function-popup { max-height: calc(100dvh - 100px); }
  .game .function-popup-head { padding: 6px 12px; }
}
.author-preview { position:fixed; top:12px; right:12px; z-index:10002; display:flex; align-items:center; flex-wrap:wrap; gap:6px; max-width:min(92vw, 480px); padding:8px; background:#1d1b33; color:#fff4df; border-radius:8px; }
.author-preview button { margin:0; font-size:13px; }
.author-preview-shield { position:fixed; inset:0; z-index:10001; }
</style>
