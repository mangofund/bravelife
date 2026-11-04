# 玩家反馈

网页和微信小程序都可以从标题页或游戏内的「账号与存档」打开「玩家反馈」。游客也能提交。Cloudflare Worker 将反馈类型、标题、说明和平台写入 BraveLife 的公开 GitHub Issues。页面会在提交前说明公开范围，并在成功后显示 Issue 编号。

## 上线配置

- 在 GitHub 为 `mangofund/bravelife` 创建细粒度访问令牌，仓库权限只需 **Issues: Read and write**。建议由专用账号创建 Issue，以便维护者通过自己的账号接收通知。
- 在 Cloudflare 的 `bravelife` Worker 中，将令牌保存为加密密钥 `GITHUB_FEEDBACK_TOKEN`。可在控制台设置，或执行 `wrangler secret put GITHUB_FEEDBACK_TOKEN` 后在提示中输入。密钥缺失时接口返回 503。
- 在 GitHub 仓库选择 **Watch → Custom → Issues**。在个人通知设置的 **Watching** 下选择邮件或站内通知。
- 微信小程序的 request 合法域名使用 `https://bravelife.app`。构建使用 `npm run build:mp-weixin`，再通过微信开发者工具上传并按小程序流程审核发布。

接口会限流，且只在 GitHub 返回有效 Issue 编号时确认成功。GitHub 响应超时或服务器异常时，应先查看 Issues 再决定是否重试。
