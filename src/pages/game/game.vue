<template>
  <view v-if="ready" class="game theme-root" @click="closePopup" :class="['theme-' + settings.theme, wide ? 'wide' : 'narrow', { 'at-home-screen': tab === 'home' }]">
    <!-- PC：固定边框里的大场景，信息和指令参与布局，不覆盖画面。 -->
    <block v-if="wide">
      <view class="desktop-topbar">
        <view class="desktop-player"><avatar-card :profile="state.profile" :size="64" /><view><text class="desktop-name">{{ state.profile.name }}</text><text class="desktop-meta">{{ age() }} 岁 · {{ desktopLocation }}</text></view></view>
        <view class="desktop-resources"><view class="desktop-funds"><text class="resource-label">持有资金</text><text class="resource-value">{{ fmtMoney(state.money) }}</text></view><view v-for="r in desktopNeeds" :key="r.key" class="desktop-need"><view class="need-heading"><text>{{ r.name }}</text><text :class="{ critical: r.value < 25 }">{{ r.value }}</text></view><view class="need-track"><view :style="{ width: r.value + '%', background: r.value < 25 ? '#d66c55' : r.color }" /></view></view></view>
        <view class="desktop-date"><text class="desktop-hour">{{ fmtHour(state.hour) }}</text><text>{{ fmtDate(state.day) }} {{ weatherInfo().icon }}</text><text class="desktop-edition">生活经营版 · 11.03</text></view>
      </view>
      <view class="scene-layer">
        <view v-if="sheet" class="location-scene"><location-sheet docked :loc-id="sheet" @close="sheet = ''" @gohome="goHome" @go="onGo" /></view>
        <city-map v-else-if="tab === 'map'" @open="onOpen" @arrive-home="tab = 'home'" />
        <home-view v-else-if="tab === 'home'" wide @tool="openHomeTool" />
        <scroll-view v-else-if="tab === 'status'" scroll-y class="desktop-record"><view class="record-title">人物志 <text>经历、能力与人生目标</text></view><view class="record-grid"><game-hud /><side-status /></view></scroll-view>
        <scroll-view v-else scroll-y class="phone-scene"><phone-view :key="phoneApp" :initial-app="phoneApp" hide-apps /></scroll-view>
      </view>
      <view class="desktop-commandbar">
        <view class="desktop-objective"><text class="objective-label">近况</text><guide-bar compact :style="{ background: 'transparent' }" /></view>
        <view class="desktop-commandrow"><view class="command-seal"><text>勇敢人生</text><text>生活指令</text></view><view class="desktop-commands"><view v-for="c in desktopCommands" :key="c.id" class="desktop-command-shell" @click.stop><button :id="'command-' + c.id" class="desktop-command" :class="{ active: commandActive(c) || (c.id === 'contacts' && socialMenu) }" :aria-label="c.name" :aria-expanded="c.id === 'contacts' ? socialMenu : undefined" @click="runCommand(c)"><text class="command-icon">{{ c.icon }}</text><text>{{ c.name }}</text><text v-if="c.id === 'contacts'" class="menu-caret">{{ socialMenu ? '▾' : '▴' }}</text></button><view v-if="c.id === 'contacts' && socialMenu" class="relation-flyout social-quick-menu"><button v-for="a in PHONE_APPS" :key="a.id" :class="{ active: popup === 'phone' && phoneApp === a.id }" @click="openPhone(a.id)"><text>{{ a.icon }}</text><text>{{ a.name }}</text><text v-if="a.id === 'msg' && state.unread" class="menu-unread">{{ state.unread }}</text></button></view><view v-if="c.id === 'room' && homeMenu" class="relation-flyout home-quick-menu"><button @click="closePopup">🏠 家园</button><button @click="openHomeTool('inventory')">📦 仓库</button><button @click="openHomeTool('food')">🍱 生活</button><button @click="openHomeTool('pets')">🐾 宠物</button></view></view></view><view class="desktop-time"><button aria-label="暂停或继续" @click="togglePause">{{ settings.speed ? '暂停' : '继续' }}</button><view class="time-speeds"><button v-for="v in SPEEDS.filter(x => x > 0)" :key="v" :class="{ active: settings.speed === v }" @click="setSpeed(v)">{{ v }}×</button></view></view></view>
      </view>
    </block>

    <!-- 手机：竖屏单栏 + 底部标签 -->
    <block v-else>
      <view class="top">
        <game-hud :compact="!wide && tab === 'home'" />
        <guide-bar :compact="!wide && tab === 'home'" />
      </view>
      <view class="content">
        <location-sheet v-if="sheet" docked :loc-id="sheet" @close="sheet = ''" @gohome="goHome" @go="onGo" />
        <city-map v-else-if="tab === 'map'" @open="onOpen" @arrive-home="tab = 'home'" />
        <home-view v-else-if="tab === 'home'" @tool="openHomeTool" />
        <scroll-view v-else scroll-y class="pane"><phone-view :key="phoneApp" :initial-app="phoneApp" hide-apps /></scroll-view>
      </view>
      <view class="tabs" :class="{ 'popup-nav': !!popup || socialMenu || homeMenu }" @click.stop>
        <view v-if="socialMenu" class="relation-flyout social-quick-menu mobile-relation-flyout"><button v-for="a in PHONE_APPS" :key="a.id" :class="{ active: popup === 'phone' && phoneApp === a.id }" @click="openPhone(a.id)"><text>{{ a.icon }}</text><text>{{ a.name }}</text><text v-if="a.id === 'msg' && state.unread" class="menu-unread">{{ state.unread }}</text></button></view>
        <view v-if="homeMenu" class="relation-flyout home-quick-menu mobile-relation-flyout"><button @click="closePopup">🏠 家园</button><button @click="openHomeTool('inventory')">📦 仓库</button><button @click="openHomeTool('food')">🍱 生活</button><button @click="openHomeTool('pets')">🐾 宠物</button></view>
        <view v-for="t in TABS" :key="t.id" :id="'mobile-' + t.id" class="tab" :class="{ on: popup === t.id || (t.id === 'phone' && socialMenu) || (tab === t.id && !popup) }" @click="switchTab(t.id)">
          <text class="tab-icon">{{ t.icon }}</text>
          <text class="tab-name">{{ t.name }}</text>
          <text v-if="t.id === 'phone' && state.unread" class="tab-dot" />
        </view>
      </view>
    </block>

    <view v-if="popup" class="function-backdrop" @click.stop="closePopup" />
    <view v-if="popup" class="function-popup" :style="popupStyle" role="dialog" aria-modal="true" :aria-label="popupTitle" @click.stop>
      <view class="function-popup-head"><button v-if="returnPopup" aria-label="返回原功能" @click="restorePopup">‹ 返回</button><text>{{ popupTitle }}</text><button aria-label="关闭浮层" @click="closePopup">✕</button></view>
      <scroll-view scroll-y class="function-popup-body">
        <phone-view v-if="popup === 'phone'" :key="phoneApp" :initial-app="phoneApp" hide-apps />
        <shop-view v-else-if="popup === 'shop'" />
        <view v-else-if="popup === 'status'" class="popup-record"><game-hud /><side-status /></view>
        <home-view v-else :key="popup" :tool="popup === 'inventory' ? 'inventory' : popup === 'pets' ? 'pets' : 'food'" @place="placeFromWarehouse" />
      </scroll-view>
      <text class="function-popup-tip">{{ ui.homeTip ? ui.homeTip.text : '点击窗口外收起' }}</text>
    </view>
    <event-modal />
    <story-modal />
    <inner-os />
  </view>
</template>

<script setup>
import { ref, computed, watch, nextTick, getCurrentInstance } from 'vue'
import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app'
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
import { autoCloudSave } from '../../game/account.js'

const TABS = [
  { id: 'map', name: '地图', icon: '🗺️' },
  { id: 'home', name: '家园', icon: '🏠' },
  { id: 'shop', name: '商店', icon: '🛍️' },
  { id: 'life', name: '生活', icon: '☕' },
  { id: 'status', name: '人物', icon: '🪪' },
  { id: 'phone', name: '关系', icon: '👥' }
]

const ready = ref(false)
const tab = ref('map')
const sheet = ref('')
const phoneApp = ref('contacts')
const socialMenu = ref(false)
const homeMenu = ref(false)
const popup = ref('')
const popupStyle = ref({})
const returnPopup=ref(null)
const instance = getCurrentInstance()
const popupTitle = computed(() => popup.value === 'phone' ? (PHONE_APPS.find(a=>a.id===phoneApp.value)?.name || '关系') : ({shop:'商店',status:'人物',inventory:'家园仓库',life:'生活',pets:'宠物'})[popup.value] || '生活')
watch(popup, value => { ui.popupActive = !!value })
watch(() => ui.width, () => closePopup())
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
    if (!ready.value || !settings.speed || state.pendingEvent || state.pendingStory || ui.reading) return
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
  startClock()
  // #ifdef H5
  window.addEventListener('keydown', onKey)
  // #endif
})
function teardown() {
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

function onOpen(id) {
  if (id === 'home' && state.location === 'home') {
    tab.value = 'home'
    return
  }
  sheet.value = id
}

function openPhone(app) {
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
  if (settings.speed) {
    lastSpeed = settings.speed
    setSpeed(0)
  } else setSpeed(lastSpeed || 1)
}

function switchTab(id){
  returnPopup.value=null
  if(id==='phone'){popup.value='';homeMenu.value=false;socialMenu.value=!socialMenu.value;return}
  if(id==='home'){popup.value='';socialMenu.value=false;homeMenu.value=!homeMenu.value;sheet.value='';tab.value='home';ui.homeScene='room';return}
  if(['shop','life','status'].includes(id)){socialMenu.value=false;homeMenu.value=false;showPopup(id,'#mobile-'+id);return}
  closePopup();sheet.value='';tab.value=id
}

function goHome() {
  sheet.value = ''
  tab.value = 'home'
}

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
  font-size: 22rpx;
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
.desktop-player{display:flex;align-items:center;gap:12px;min-width:0}.desktop-player>view{min-width:0}.desktop-name{display:block;font-size:17px;font-weight:700;letter-spacing:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.desktop-meta{display:block;margin-top:5px;font-size:11px;color:#b9bec4}
.desktop-resources{display:flex;align-items:center;justify-content:center;gap:22px;min-width:0}.desktop-funds{min-width:125px}.resource-label{display:block;font-size:10px;letter-spacing:2px;color:#b9bec4}.resource-value{display:block;margin-top:5px;font-size:19px;color:#e7c982;font-variant-numeric:tabular-nums;white-space:nowrap}.desktop-need{width:85px;min-width:55px}.need-heading{display:flex;justify-content:space-between;font-size:11px;color:#e0d8c5;margin-bottom:8px}.need-track{height:5px;background:#142131;border:1px solid #65718277}.need-track>view{height:100%}.need-heading .critical{color:#f29b80}
.desktop-date{text-align:right;color:#c5c6c4;font-size:10px}.desktop-date>text{display:block}.desktop-hour{font-size:24px;color:#f4e7c8;font-variant-numeric:tabular-nums;letter-spacing:2px;line-height:1.2}.desktop-edition{font-size:9px;color:#a5acb5;margin-top:3px}
.scene-layer{position:relative;flex:1;height:0;min-height:0;width:100%;overflow:hidden;box-sizing:border-box;border-left:6px solid #233248;border-right:6px solid #233248;background:var(--paper)}
.desktop-commandbar{flex-shrink:0;background:linear-gradient(#2c3b4e,#1c2838);border-top:2px solid #ae925f;color:#e9ddbd;box-shadow:inset 0 0 0 1px #74809433}.desktop-objective{display:flex;align-items:center;min-height:28px;padding:0 16px;border-bottom:1px solid #8e7b553f}.objective-label{flex-shrink:0;padding-right:14px;font-family:serif;font-size:11px;letter-spacing:3px;color:#d3b67c}.desktop-objective>view{flex:1;min-width:0}.desktop-commandrow{display:flex;align-items:stretch;gap:14px;padding:9px 18px;min-height:58px;box-sizing:border-box}.command-seal{width:92px;flex-shrink:0;display:flex;flex-direction:column;justify-content:center;gap:5px;border-right:1px solid #8c795655;color:#d2b77f}.command-seal>text:first-child{font-family:serif;font-size:16px;letter-spacing:2px}.command-seal>text:last-child{font-size:9px;letter-spacing:4px;color:#9ba5b0}
.desktop-commands{display:flex;flex:1;min-width:0;gap:6px;justify-content:center}.desktop-command{position:relative;flex:1;max-width:108px;min-width:0;margin:0;padding:5px 3px;line-height:1.4;display:flex;align-items:center;justify-content:center;gap:6px;background:#35465a;color:#e4d8b9;border:1px solid #8c7955;border-radius:3px;font-size:12px;box-shadow:inset 0 0 0 1px #14203188}.desktop-command::after,.desktop-time button::after{border:0}.desktop-command:hover{background:#43556c;color:#fff4d6}.desktop-command.active{background:linear-gradient(#a47e47,#76532f);color:#fff1c9;border-color:#d6b77b}.command-icon{font-family:serif;font-size:18px;color:#ddc696}.command-badge{position:absolute;right:3px;top:1px;font-size:9px;color:#ffd0b3}.desktop-time{display:flex;gap:8px;align-items:center;border-left:1px solid #8c795655;padding-left:14px;flex-shrink:0}.desktop-time button{margin:0;padding:5px 10px;background:#172536;border:1px solid #8c7955;border-radius:3px;color:#c6c9cb;font-size:11px;line-height:1.4}.time-speeds{display:flex;gap:3px}.time-speeds button{padding:5px 8px}.time-speeds button.active{background:#a78b54;color:#172536;border-color:#d4ba80}
.game{height:100dvh}.location-scene,.phone-scene,.desktop-record{height:100%;min-height:0;background:var(--paper);box-sizing:border-box;padding:18px 24px}.record-title{font-family:serif;font-size:25px;font-weight:700;letter-spacing:4px;margin-bottom:18px}.record-title>text{font-family:sans-serif;font-size:12px;color:var(--muted);letter-spacing:1px;margin-left:20px}.record-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:1200px;margin:0 auto}
@media(max-width:1200px){.desktop-topbar{grid-template-columns:145px minmax(0,1fr) 135px;gap:14px;padding-left:14px;padding-right:14px}.desktop-resources{gap:12px}.desktop-funds{min-width:110px}.resource-value{font-size:16px}.desktop-need{width:70px}.command-seal{display:none}.desktop-commandrow{gap:8px;padding-left:10px;padding-right:10px}.desktop-command{gap:4px;font-size:11px}.desktop-time{padding-left:8px}.desktop-time button{padding:5px 6px}}
.desktop-command-shell { flex:1; max-width:150px; min-width:0; position:relative; display:flex; }
.desktop-command-shell>.desktop-command { max-width:none; width:100%; height:100%; box-sizing:border-box; }
.desktop-commandrow { position:relative; z-index:20; }.menu-caret { font-size:10px; }
.relation-flyout { position:absolute; bottom:calc(100% + 9px); right:0; width:340px; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:5px; padding:9px; box-sizing:border-box; border:1px solid #b49b6d; border-radius:6px; background:#26364a; box-shadow:0 5px 20px #14213144; z-index:60; }
.relation-flyout button { position:relative; margin:0; padding:10px 2px; background:#35465a; color:#eee1c2; font-size:12px; line-height:1.4; display:flex; flex-direction:column; align-items:center; gap:4px; border-radius:4px; }.relation-flyout button::after { border:0; }.relation-flyout button.active { background:#8c6d43; color:#fff2cf; }.menu-unread { position:absolute; right:5px; top:2px; color:#ffbe9a; font-size:10px; }
.tabs { position:relative; }.mobile-relation-flyout { right:12px; left:12px; width:auto; bottom:calc(100% + 7px); }.mobile-relation-flyout button { padding:8px 2px; font-size:11px; }
.desktop-commandbar{position:relative;z-index:80}.tabs.popup-nav{z-index:80}
.function-backdrop{position:fixed;inset:0;z-index:70;background:transparent;pointer-events:auto}
.function-popup{position:fixed;z-index:90;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;border:1px solid #b29a6a;border-radius:10px;background:rgba(248,241,222,.87);backdrop-filter:blur(14px);box-shadow:0 10px 30px #18243544;pointer-events:auto;color:var(--ink)}
.function-popup-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #b29a6a66;flex-shrink:0;font-size:17px;font-weight:700}.function-popup-head button{margin:0;padding:2px 10px;font-size:15px;line-height:1.6;background:transparent;color:var(--ink)}.function-popup-head button::after{border:0}
.function-popup-body{flex:1;height:0;min-height:0}.function-popup-tip{display:block;flex-shrink:0;padding:7px 12px;border-top:1px solid #b29a6a44;font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.popup-record{padding:10px}.function-popup .phone{padding:12px}.function-popup .shop-view{padding:10px}
.relation-flyout{background:rgba(38,54,74,.94);backdrop-filter:blur(12px)}
</style>
