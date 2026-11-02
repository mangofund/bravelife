// 密码哈希、令牌、验证码等安全工具，只用 Workers 自带的 WebCrypto

const enc = new TextEncoder()
export const PBKDF2_ITERATIONS = 100000

function toHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex) {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16)
  return out
}

export function randomHex(bytes) {
  const b = new Uint8Array(bytes)
  crypto.getRandomValues(b)
  return toHex(b)
}

export async function sha256(text) {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text)))
}

async function pbkdf2(password, saltHex, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations },
    key,
    256
  )
  return toHex(bits)
}

// 存储格式：pbkdf2$迭代次数$哈希，盐单独一列；以后提高迭代次数时旧密码仍能校验
export async function hashPassword(password) {
  const salt = randomHex(16)
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS)
  return { pw_hash: 'pbkdf2$' + PBKDF2_ITERATIONS + '$' + hash, pw_salt: salt }
}

// 常量时间比较，避免按耗时猜出哈希
function safeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifyPassword(password, stored, salt) {
  if (!stored || !salt) return false
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'pbkdf2') return false
  const hash = await pbkdf2(password, salt, Number(parts[1]))
  return safeEqual(hash, parts[2])
}

export function sixDigitCode() {
  const b = new Uint32Array(1)
  crypto.getRandomValues(b)
  return String(b[0] % 1000000).padStart(6, '0')
}

export function newToken() {
  return randomHex(32)
}

export { safeEqual }
