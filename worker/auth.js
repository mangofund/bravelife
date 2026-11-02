import { hashPassword, verifyPassword, sha256, sixDigitCode, newToken } from './crypto.js'

const SESSION_DAYS = 30
const CODE_TTL = 10 * 60 * 1000
const CODE_COOLDOWN = 60 * 1000
const CODE_MAX_ATTEMPTS = 5

const USERNAME_RE = /^[A-Za-z0-9_\u4e00-\u9fa5]{3,20}$/
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function now() {
  return Date.now()
}

function publicUser(u) {
  return { id: u.id, username: u.username || '', email: u.email || '', wechat: !!u.wx_openid }
}

async function createSession(env, userId) {
  const token = newToken()
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256(token), userId, now() + SESSION_DAYS * 86400000)
    .run()
  return token
}

async function loginResult(env, user) {
  const token = await createSession(env, user.id)
  let settings = {}
  try {
    settings = JSON.parse(user.settings || '{}')
  } catch (e) {
    settings = {}
  }
  return { token, user: publicUser(user), settings }
}

export async function currentUser(env, request) {
  const auth = request.headers.get('Authorization') || ''
  const m = auth.match(/^Bearer ([a-f0-9]{64})$/)
  if (!m) return null
  const row = await env.DB.prepare(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'
  )
    .bind(await sha256(m[1]), now())
    .first()
  return row || null
}

export async function requireUser(env, request) {
  const u = await currentUser(env, request)
  if (!u) throw new HttpError(401, '请先登录')
  return u
}

export async function register(env, body) {
  const username = String(body.username || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!username && !email) throw new HttpError(400, '请填写用户名或邮箱')
  if (username && !USERNAME_RE.test(username)) throw new HttpError(400, '用户名需为 3-20 位中英文、数字或下划线')
  if (email && !EMAIL_RE.test(email)) throw new HttpError(400, '邮箱格式不正确')
  if (password.length < 8 || password.length > 72) throw new HttpError(400, '密码需为 8-72 位')
  if (username) {
    const dup = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
    if (dup) throw new HttpError(409, '用户名已被使用')
  }
  if (email) {
    const dup = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (dup) throw new HttpError(409, '邮箱已被注册')
  }
  const pw = await hashPassword(password)
  const res = await env.DB.prepare(
    'INSERT INTO users (username, email, pw_hash, pw_salt, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *'
  )
    .bind(username || null, email || null, pw.pw_hash, pw.pw_salt, now())
    .first()
  return loginResult(env, res)
}

export async function login(env, body) {
  const account = String(body.account || '').trim()
  const password = String(body.password || '')
  if (!account || !password) throw new HttpError(400, '请输入账号和密码')
  const field = account.indexOf('@') >= 0 ? 'email' : 'username'
  // 两列都是 COLLATE NOCASE，大小写不敏感
  const user = await env.DB.prepare('SELECT * FROM users WHERE ' + field + ' = ?').bind(account).first()
  // 账号不存在和密码错误返回同一提示，避免被用来探测账号
  if (!user || !(await verifyPassword(password, user.pw_hash, user.pw_salt))) throw new HttpError(401, '账号或密码错误')
  return loginResult(env, user)
}

export async function sendEmailCode(env, body) {
  const email = String(body.email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) throw new HttpError(400, '邮箱格式不正确')
  if (!env.EMAIL) throw new HttpError(503, '邮件服务还没有开通，请先用密码登录')
  const old = await env.DB.prepare('SELECT sent_at FROM email_codes WHERE email = ?').bind(email).first()
  if (old && now() - old.sent_at < CODE_COOLDOWN) throw new HttpError(429, '发送太频繁，请一分钟后再试')
  const code = sixDigitCode()
  await env.DB.prepare(
    'INSERT INTO email_codes (email, code_hash, expires_at, attempts, sent_at) VALUES (?, ?, ?, 0, ?) ' +
      'ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, sent_at = excluded.sent_at'
  )
    .bind(email, await sha256(email + ':' + code), now() + CODE_TTL, now())
    .run()
  await env.EMAIL.send({
    to: email,
    from: { email: 'noreply@bravelife.app', name: 'BraveLife 勇敢人生' },
    subject: '你的登录验证码：' + code,
    text: '你的 BraveLife 登录验证码是 ' + code + '，10 分钟内有效。如果不是你本人操作，请忽略这封邮件。',
    html:
      '<p>你的 BraveLife 登录验证码是：</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">' +
      code +
      '</p><p>10 分钟内有效。如果不是你本人操作，请忽略这封邮件。</p>'
  })
  return { ok: true }
}

export async function verifyEmailCode(env, body) {
  const email = String(body.email || '').trim().toLowerCase()
  const code = String(body.code || '').trim()
  const row = await env.DB.prepare('SELECT * FROM email_codes WHERE email = ?').bind(email).first()
  if (!row || row.expires_at < now()) throw new HttpError(400, '验证码已过期，请重新获取')
  if (row.attempts >= CODE_MAX_ATTEMPTS) throw new HttpError(429, '错误次数太多，请重新获取验证码')
  if ((await sha256(email + ':' + code)) !== row.code_hash) {
    await env.DB.prepare('UPDATE email_codes SET attempts = attempts + 1 WHERE email = ?').bind(email).run()
    throw new HttpError(400, '验证码不正确')
  }
  await env.DB.prepare('DELETE FROM email_codes WHERE email = ?').bind(email).run()
  let user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
  if (!user) {
    user = await env.DB.prepare('INSERT INTO users (email, created_at) VALUES (?, ?) RETURNING *').bind(email, now()).first()
  }
  return loginResult(env, user)
}

// 微信小程序登录：用 wx.login 拿到的 code 换 openid（AppID / AppSecret 用 wrangler secret 配置）
export async function wechatLogin(env, body) {
  if (!env.WX_APPID || !env.WX_SECRET) throw new HttpError(503, '微信登录还没有配置')
  const code = String(body.code || '')
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(code)) throw new HttpError(400, '登录凭证无效')
  const url =
    'https://api.weixin.qq.com/sns/jscode2session?appid=' +
    encodeURIComponent(env.WX_APPID) +
    '&secret=' +
    encodeURIComponent(env.WX_SECRET) +
    '&js_code=' +
    encodeURIComponent(code) +
    '&grant_type=authorization_code'
  const res = await fetch(url)
  const data = await res.json()
  if (!data.openid) throw new HttpError(401, '微信登录失败')
  let user = await env.DB.prepare('SELECT * FROM users WHERE wx_openid = ?').bind(data.openid).first()
  if (!user) {
    user = await env.DB.prepare('INSERT INTO users (wx_openid, created_at) VALUES (?, ?) RETURNING *').bind(data.openid, now()).first()
  }
  return loginResult(env, user)
}

export async function logout(env, request) {
  const auth = request.headers.get('Authorization') || ''
  const m = auth.match(/^Bearer ([a-f0-9]{64})$/)
  if (m) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(m[1])).run()
  return { ok: true }
}

export { publicUser }
