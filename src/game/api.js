// 与 BraveLife 服务器通信。网页版和服务器同域，直接用相对路径；小程序用完整域名
// （小程序后台需要把 https://bravelife.app 加到「request 合法域名」）

export const SERVER = 'https://bravelife.app'
const TOKEN_KEY = 'bravelife_token'

let base = SERVER
// #ifdef H5
// 部署在 bravelife.app 上时同域请求；本地 vite 开发服务器没有接口，转发到线上
base = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && location.port !== '8787' ? SERVER : ''
// #endif

export function getToken() {
  try {
    return uni.getStorageSync(TOKEN_KEY) || ''
  } catch (e) {
    return ''
  }
}

export function setToken(token) {
  try {
    if (token) uni.setStorageSync(TOKEN_KEY, token)
    else uni.removeStorageSync(TOKEN_KEY)
  } catch (e) {
    console.error('token storage failed', e)
  }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' }
    const token = getToken()
    if (token) header.Authorization = 'Bearer ' + token
    uni.request({
      url: base + path,
      method,
      header,
      data: body ? JSON.stringify(body) : undefined,
      timeout: 15000,
      success(res) {
        let data = res.data
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data)
          } catch (e) {
            data = {}
          }
        }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data || {})
        else reject(new ApiError(res.statusCode, (data && data.error) || '请求失败（' + res.statusCode + '）'))
      },
      fail() {
        reject(new ApiError(0, '网络连接失败，请检查网络'))
      }
    })
  })
}
