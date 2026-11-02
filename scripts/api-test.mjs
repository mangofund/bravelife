// 接口测试：BASE=http://localhost:8787 node scripts/api-test.mjs
// 会注册一个随机测试账号，跑一遍登录、存读档、设置和配置接口
const BASE = process.env.BASE || 'http://localhost:8787'
let failures = 0
function check(name, cond, extra) {
  if (cond) console.log('ok  ', name)
  else {
    failures++
    console.error('FAIL', name, extra === undefined ? '' : JSON.stringify(extra))
  }
}

async function call(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = 'Bearer ' + token
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  let data = null
  try {
    data = await res.json()
  } catch (e) {
    data = null
  }
  return { status: res.status, data }
}

const name = 'test_' + Math.random().toString(36).slice(2, 8)
const email = name + '@example.com'

let r = await call('GET', '/api/health')
check('health', r.status === 200 && r.data.ok, r)

r = await call('POST', '/api/auth/register', { username: name, email, password: 'short' })
check('reject short password', r.status === 400, r)

r = await call('POST', '/api/auth/register', { username: name, email, password: 'brave-life-2026' })
check('register', r.status === 200 && r.data.token && r.data.user.username === name, r)
const token = r.data && r.data.token

r = await call('POST', '/api/auth/register', { username: name.toUpperCase(), password: 'brave-life-2026' })
check('duplicate username (case-insensitive)', r.status === 409, r)

r = await call('POST', '/api/auth/login', { account: name, password: 'wrong-password' })
check('wrong password rejected', r.status === 401, r)

r = await call('POST', '/api/auth/login', { account: email.toUpperCase(), password: 'brave-life-2026' })
check('login by email', r.status === 200 && r.data.token, r)

r = await call('GET', '/api/me')
check('me requires token', r.status === 401, r)

r = await call('GET', '/api/me', null, token)
check('me', r.status === 200 && r.data.user.email === email, r)

r = await call('PUT', '/api/me/settings', { settings: { theme: 'crayon', speed: 2 } }, token)
check('save settings', r.status === 200, r)
r = await call('GET', '/api/me', null, token)
check('settings persisted', r.data.settings.theme === 'crayon', r)

const save = { started: true, day: 12, money: 345678, profile: { name: '测试' } }
r = await call('PUT', '/api/saves/2', { data: save, summary: { day: 12, money: 345678 } }, token)
check('put slot 2', r.status === 200 && r.data.updatedAt, r)
r = await call('PUT', '/api/saves/auto', { data: save, summary: { day: 12 } }, token)
check('put auto', r.status === 200, r)
r = await call('PUT', '/api/saves/9', { data: save }, token)
check('invalid slot rejected', r.status === 400, r)
r = await call('GET', '/api/saves', null, token)
check('list saves', r.status === 200 && r.data.saves.length === 2, r)
r = await call('GET', '/api/saves/2', null, token)
check('load slot 2', r.status === 200 && r.data.data.money === 345678, r)
r = await call('DELETE', '/api/saves/2', null, token)
r = await call('GET', '/api/saves/2', null, token)
check('delete slot', r.status === 404, r)

r = await call('GET', '/api/config')
check('public config', r.status === 200 && typeof r.data.game === 'object', r)
r = await call('PUT', '/api/config', { game: {} }, 'not-admin')
check('config write needs admin', r.status === 403, r)

r = await call('POST', '/api/auth/wechat', { code: 'abcdefgh1234' })
check('wechat not configured yet', r.status === 503, r)

r = await call('POST', '/api/auth/logout', null, token)
r = await call('GET', '/api/me', null, token)
check('logout invalidates token', r.status === 401, r)

console.log(failures ? failures + ' failures' : 'all passed')
process.exit(failures ? 1 : 0)
