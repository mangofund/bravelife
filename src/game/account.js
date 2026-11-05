import { reactive, watch } from 'vue'
import { api, getToken, setToken } from './api.js'
import { state, resetState, initialState, save, hasSave, load, fmtMoney, isRehearsing } from './engine/core.js'
import { settings, setTheme, setSpeed } from './themes.js'

// 账号状态（不进游戏存档）
export const account = reactive({
  user: null,
  checked: false,
  syncing: false,
  lastSync: 0,
  error: ''
})

export const SLOT_NAMES = { auto: '自动存档', 1: '存档 1', 2: '存档 2', 3: '存档 3' }

function applySettings(s) {
  if (!s || typeof s !== 'object') return
  applyingRemote = true
  if (s.theme) setTheme(s.theme)
  if (s.speed !== undefined) setSpeed(s.speed)
  applyingRemote = false
}

// 设置变化后 2 秒同步到服务器（从服务器读到的设置不回写）
let applyingRemote = false
let settingsTimer = null
watch(
  () => [settings.theme, settings.speed],
  () => {
    if (!account.user || applyingRemote) return
    if (settingsTimer) clearTimeout(settingsTimer)
    settingsTimer = setTimeout(() => {
      api('PUT', '/api/me/settings', { settings: { theme: settings.theme, speed: settings.speed } }).catch(() => {})
    }, 2000)
  }
)

export async function restoreSession() {
  if (!getToken()) {
    account.checked = true
    return null
  }
  try {
    const r = await api('GET', '/api/me')
    account.user = r.user
    applySettings(r.settings)
  } catch (e) {
    if (e.status === 401) setToken('')
  }
  account.checked = true
  return account.user
}

function onLoggedIn(r) {
  setToken(r.token)
  account.user = r.user
  applySettings(r.settings)
  return r.user
}

export async function registerAccount(username, email, password) {
  return onLoggedIn(await api('POST', '/api/auth/register', { username, email, password }))
}

export async function loginPassword(accountName, password) {
  return onLoggedIn(await api('POST', '/api/auth/login', { account: accountName, password }))
}

export function sendEmailCode(email) {
  return api('POST', '/api/auth/email/send', { email })
}

export async function loginEmailCode(email, code) {
  return onLoggedIn(await api('POST', '/api/auth/email/verify', { email, code }))
}

// 微信小程序一键登录
export function loginWechat() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: async (res) => {
        try {
          resolve(onLoggedIn(await api('POST', '/api/auth/wechat', { code: res.code })))
        } catch (e) {
          reject(e)
        }
      },
      fail: () => reject(new Error('微信登录被取消'))
    })
  })
}

export async function logout() {
  try {
    await api('POST', '/api/auth/logout')
  } catch (e) {
    // 离线时也允许退出
  }
  setToken('')
  account.user = null
}

export function displayName(u) {
  if (!u) return ''
  return u.username || u.email || (u.wechat ? '微信用户' : '玩家')
}

function summary() {
  return {
    name: state.profile ? state.profile.name : '',
    day: state.day,
    hour: state.hour,
    money: state.money,
    moneyText: fmtMoney(state.money)
  }
}

export function listSaves() {
  return api('GET', '/api/saves').then((r) => r.saves || [])
}

export async function saveToSlot(slot) {
  if (!account.user || !state.started || isRehearsing()) return false
  account.syncing = true
  try {
    await api('PUT', '/api/saves/' + slot, { data: JSON.parse(JSON.stringify(state)), summary: summary() })
    account.lastSync = Date.now()
    account.error = ''
    return true
  } catch (e) {
    account.error = e.message
    throw e
  } finally {
    account.syncing = false
  }
}

// 读取云端存档：覆盖本地进度（缺字段用默认值兜底，兼容旧存档）
export async function loadFromSlot(slot) {
  const r = await api('GET', '/api/saves/' + slot)
  const base = initialState()
  if (r.data.tutorial === undefined) base.tutorial.done = true
  Object.keys(base).forEach((k) => {
    if (r.data[k] !== undefined) base[k] = r.data[k]
  })
  resetState(base)
  save()
  return r.summary
}

// 登录后：本地有进度而云端没有自动存档时，把游客进度传上去；两边都有时交给界面让玩家选
export async function syncAfterLogin() {
  const saves = await listSaves()
  const cloudAuto = saves.filter((s) => s.slot === 'auto')[0] || null
  const local = hasSave()
  if (local && !cloudAuto) {
    // 本地存档还没读进内存时（例如在标题页登录）先读出来
    if (!state.started) load()
    await saveToSlot('auto')
    return { action: 'uploaded' }
  }
  if (local && cloudAuto) return { action: 'choose', cloud: cloudAuto }
  if (!local && cloudAuto) return { action: 'cloud-only', cloud: cloudAuto }
  return { action: 'none' }
}

// 游戏中定时把进度写到云端自动存档；失败不打扰玩家
let autoBusy = false
let queuedAutoToken = ''
export async function autoCloudSave(queueLatest = false) {
  if (!account.user || !state.started || isRehearsing()) return
  const token = getToken()
  if (!token) return
  if (autoBusy) {
    if (queueLatest) queuedAutoToken = token
    return
  }
  autoBusy = true
  try {
    do {
      queuedAutoToken = ''
      try {
        await saveToSlot('auto')
      } catch {
        // A later action or the normal auto-save will retry.
      }
    } while (queuedAutoToken === token && getToken() === token)
  } finally {
    autoBusy = false
    queuedAutoToken = ''
  }
}
