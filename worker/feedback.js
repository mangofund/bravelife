import { HttpError } from './auth.js'

const CATEGORIES = new Map([
  ['bug', '游戏故障'],
  ['suggestion', '玩法建议'],
  ['other', '其他反馈']
])

const PLATFORMS = new Map([
  ['web', '网页'],
  ['wechat', '微信小程序']
])

const ISSUES_API = 'https://api.github.com/repos/mangofund/bravelife/issues'

export async function submitFeedback(env, request, body) {
  const category = CATEGORIES.get(body.category)
  const platform = PLATFORMS.get(body.platform)
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  if (body.publicConsent !== true || !category || !platform) {
    throw new HttpError(400, '请选择反馈类型并确认公开提交')
  }
  if (!title || title.length > 60 || /[\x00-\x1f\x7f\u2028\u2029]/.test(title) || !description || description.length > 1000) {
    throw new HttpError(400, '请填写 60 字以内的单行标题和 1000 字以内的说明')
  }
  if (!env.GITHUB_FEEDBACK_TOKEN) throw new HttpError(503, '反馈服务暂未开放')

  const key = request.headers.get('CF-Connecting-IP') || 'unknown'
  const { success } = await env.FEEDBACK_RATE_LIMIT.limit({ key })
  if (!success) throw new HttpError(429, '提交太频繁，请稍后再试')

  // 将玩家原文呈现为纯文本，避免正文中的 Markdown 图片和提及被执行。
  const plainText = description.split(/\r\n?|\n|\u2028|\u2029/).map((line) => '    ' + line).join('\n')
  const issue = {
    title: `[玩家反馈·${category}] ${title}`,
    body: `平台：${platform}\n\n${plainText}`
  }

  let response
  try {
    response = await fetch(ISSUES_API, {
      method: 'POST',
      redirect: 'error',
      headers: {
        Authorization: 'Bearer ' + env.GITHUB_FEEDBACK_TOKEN,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'BraveLife-Feedback',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify(issue),
      signal: AbortSignal.timeout(8000)
    })
    if (response.status === 201) {
      const result = await response.json()
      if (Number.isSafeInteger(result.number) && result.number > 0) return { issueNumber: result.number }
    } else {
      await response.body?.cancel()
    }
  } catch {
    // 请求可能已经在 GitHub 创建 Issue，不能自动再提交一次。
  }

  console.warn('feedback issue creation failed', { status: response?.status })
  if (!response || response.status === 201 || response.status >= 500) {
    throw new HttpError(502, '暂时无法确认是否提交成功，请先检查 GitHub Issues，再决定是否重试。')
  }
  throw new HttpError(503, 'GitHub 暂时无法接收反馈，请稍后再试。')
}
