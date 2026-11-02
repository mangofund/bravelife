// 游戏所在城市与当地货币。以后加其他国家的城市时，在 CITIES 里补一项并切换 CURRENT_CITY 即可
// 金额在存档里统一按当地货币的最小常用单位存整数（日元没有小数）

export const CITIES = {
  tokyo: {
    name: '东京',
    country: '日本',
    currency: { code: 'JPY', name: '日元', decimals: 0, prefix: '', suffix: ' 日元' }
  }
}

export const CURRENT_CITY = 'tokyo'

export function currency() {
  return CITIES[CURRENT_CITY].currency
}

function group(intStr) {
  let out = ''
  for (let i = 0; i < intStr.length; i++) {
    if (i > 0 && (intStr.length - i) % 3 === 0) out += ','
    out += intStr[i]
  }
  return out
}

// 1500 → 「1,500 日元」；1e8 以上用「亿」更好读：100000000 → 「1 亿日元」
export function fmtMoney(n) {
  const c = currency()
  const neg = n < 0
  const abs = Math.abs(n)
  let body
  if (abs >= 100000000 && abs % 1000000 === 0) {
    body = Math.round((abs / 100000000) * 100) / 100 + ' 亿' + c.suffix.trim()
    return (neg ? '-' : '') + c.prefix + body
  }
  body = group(String(Math.floor(abs)))
  return (neg ? '-' : '') + c.prefix + body + c.suffix
}
