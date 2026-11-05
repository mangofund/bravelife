// Flag observable anomalies even when the action itself succeeded.
export function reviewPreviewStep(evidence, travelMode, triggeredEvent) {
  const issues = []
  const { before, after } = evidence
  if (triggeredEvent?.modes && travelMode && !triggeredEvent.modes.includes(travelMode)) {
    issues.push({ category: '功能', title: '交通事件与实际出行方式不符' })
  }
  if (before.invite && !before.invite.done && after.day > before.invite.day &&
      !after.invite?.done && !evidence.attendedInvite) {
    issues.push({ category: '策划', title: '代玩跨日时错过人物邀约' })
  }
  return issues
}
