// BraveLife 服务器：/api/* 走这里，其他路径交给静态网站资源
import {
  HttpError, register, login, sendEmailCode, verifyEmailCode, wechatLogin, logout, requireUser, publicUser
} from './auth.js'
import { safeEqual } from './crypto.js'
import { submitFeedback } from './feedback.js'

const SLOTS = ['auto', '1', '2', '3']
const MAX_SAVE_BYTES = 512 * 1024
const MAX_SETTINGS_BYTES = 4 * 1024
const MAX_CONFIG_BYTES = 256 * 1024

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, extra)
  })
}

async function readJson(request, maxBytes, limitStream = false) {
  let text = ''
  if (limitStream && request.body) {
    const reader = request.body.getReader()
    const decoder = new TextDecoder()
    let size = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > maxBytes) {
          await reader.cancel()
          throw new HttpError(413, '数据太大')
        }
        text += decoder.decode(value, { stream: true })
      }
      text += decoder.decode()
    } finally {
      reader.releaseLock()
    }
  } else {
    text = await request.text()
  }
  if (text.length > maxBytes) throw new HttpError(413, '数据太大')
  if (!text) return {}
  try {
    const v = JSON.parse(text)
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('not object')
    return v
  } catch (e) {
    throw new HttpError(400, '请求格式不正确')
  }
}

async function listSaves(env, user) {
  const rows = await env.DB.prepare('SELECT slot, summary, updated_at FROM saves WHERE user_id = ?').bind(user.id).all()
  return {
    saves: (rows.results || []).map((r) => ({ slot: r.slot, summary: JSON.parse(r.summary || '{}'), updatedAt: r.updated_at }))
  }
}

async function getSave(env, user, slot) {
  const row = await env.DB.prepare('SELECT data, summary, updated_at FROM saves WHERE user_id = ? AND slot = ?').bind(user.id, slot).first()
  if (!row) throw new HttpError(404, '这个存档位是空的')
  return { slot, data: JSON.parse(row.data), summary: JSON.parse(row.summary || '{}'), updatedAt: row.updated_at }
}

async function putSave(env, user, slot, request) {
  const body = await readJson(request, MAX_SAVE_BYTES + 4096)
  if (!body.data || typeof body.data !== 'object') throw new HttpError(400, '存档内容为空')
  const data = JSON.stringify(body.data)
  if (data.length > MAX_SAVE_BYTES) throw new HttpError(413, '存档太大')
  const summary = JSON.stringify(body.summary && typeof body.summary === 'object' ? body.summary : {}).slice(0, 2000)
  const t = Date.now()
  await env.DB.prepare(
    'INSERT INTO saves (user_id, slot, data, summary, updated_at) VALUES (?, ?, ?, ?, ?) ' +
      'ON CONFLICT(user_id, slot) DO UPDATE SET data = excluded.data, summary = excluded.summary, updated_at = excluded.updated_at'
  )
    .bind(user.id, slot, data, summary, t)
    .run()
  return { ok: true, updatedAt: t }
}

async function getConfig(env) {
  const row = await env.DB.prepare("SELECT value, updated_at FROM config WHERE key = 'game'").first()
  const game = row ? JSON.parse(row.value) : {}
  return json({ version: row ? row.updated_at : 0, game }, 200, { 'Cache-Control': 'public, max-age=60' })
}

// 改服务器数值配置需要管理员令牌：wrangler secret put ADMIN_TOKEN
async function putConfig(env, request) {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.replace(/^Bearer /, '')
  if (!env.ADMIN_TOKEN || !token || !safeEqual(token, env.ADMIN_TOKEN)) throw new HttpError(403, '没有权限')
  const body = await readJson(request, MAX_CONFIG_BYTES)
  const game = body.game && typeof body.game === 'object' ? body.game : {}
  const t = Date.now()
  await env.DB.prepare(
    "INSERT INTO config (key, value, updated_at) VALUES ('game', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
  )
    .bind(JSON.stringify(game), t)
    .run()
  return { ok: true, version: t }
}

async function route(request, env) {
  const url = new URL(request.url)
  const path = url.pathname
  const method = request.method

  if (path === '/api/health') return json({ ok: true })
  if (path === '/api/config' && method === 'GET') return getConfig(env)
  if (path === '/api/config' && method === 'PUT') return json(await putConfig(env, request))

  if (method === 'POST') {
    if (path === '/api/feedback') {
      const contentType = request.headers.get('Content-Type') || ''
      if (!/^application\/json(?:;|$)/i.test(contentType)) throw new HttpError(415, '请使用 JSON 提交反馈')
      return json(await submitFeedback(env, request, await readJson(request, 8192, true)), 201)
    }
    if (path === '/api/auth/register') return json(await register(env, await readJson(request, 4096)))
    if (path === '/api/auth/login') return json(await login(env, await readJson(request, 4096)))
    if (path === '/api/auth/email/send') return json(await sendEmailCode(env, await readJson(request, 4096)))
    if (path === '/api/auth/email/verify') return json(await verifyEmailCode(env, await readJson(request, 4096)))
    if (path === '/api/auth/wechat') return json(await wechatLogin(env, await readJson(request, 4096)))
    if (path === '/api/auth/logout') return json(await logout(env, request))
  }

  const user = await requireUser(env, request)

  if (path === '/api/me' && method === 'GET') {
    return json({ user: publicUser(user), settings: JSON.parse(user.settings || '{}') })
  }
  if (path === '/api/me/settings' && method === 'PUT') {
    const body = await readJson(request, MAX_SETTINGS_BYTES)
    const settings = JSON.stringify(body.settings && typeof body.settings === 'object' ? body.settings : {})
    await env.DB.prepare('UPDATE users SET settings = ? WHERE id = ?').bind(settings, user.id).run()
    return json({ ok: true })
  }
  if (path === '/api/saves' && method === 'GET') return json(await listSaves(env, user))

  const m = path.match(/^\/api\/saves\/([a-z0-9]+)$/)
  if (m) {
    const slot = m[1]
    if (SLOTS.indexOf(slot) < 0) throw new HttpError(400, '存档位不存在')
    if (method === 'GET') return json(await getSave(env, user, slot))
    if (method === 'PUT') return json(await putSave(env, user, slot, request))
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM saves WHERE user_id = ? AND slot = ?').bind(user.id, slot).run()
      return json({ ok: true })
    }
  }
  throw new HttpError(404, '接口不存在')
}

// 只给本地开发服务器（localhost）开放跨域，线上网页和接口同域不需要
function corsHeaders(request) {
  const origin = request.headers.get('Origin') || ''
  if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin'
  }
}

async function handle(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 })
  try {
    return await route(request, env)
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status)
    console.error('api error', e && e.stack ? e.stack : e)
    return json({ error: '服务器出错了，请稍后再试' }, 500)
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)
    const res = await handle(request, env)
    const cors = corsHeaders(request)
    Object.keys(cors).forEach((k) => res.headers.set(k, cors[k]))
    return res
  }
}
