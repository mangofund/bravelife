import { state, resetState, save, toast } from './core.js'
class ActionError extends Error {}
export function requireAction(condition, message) { if (!condition) throw new ActionError(message) }
let busy = false
export function transact(run, requestId = '') {
  if (busy || (requestId && state.homestead.receipts.includes(requestId))) return false
  const before = JSON.parse(JSON.stringify(state))
  busy = true
  try {
    const message = run()
    if (requestId) state.homestead.receipts = [...state.homestead.receipts, requestId].slice(-64)
    requireAction(save(), '保存失败，本次操作未扣款或消耗，请重试')
    if (message) toast(message)
    return true
  } catch (e) {
    resetState(before)
    toast(e instanceof ActionError ? e.message : '操作未完成，库存已恢复，请重试')
    if (!(e instanceof ActionError)) console.error('homestead action failed', e)
    return false
  } finally { busy = false }
}
