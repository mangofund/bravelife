const text = (v, max = 200) => typeof v === 'string' ? v.slice(0, max) : ''
export function initialHomestead() {
  return { version: 1, goal: '', experiences: [], drafts: [], nextDraft: 1, receipts: [], ren: null }
}
export function normalizeHomestead(raw) {
  const h = initialHomestead()
  if (!raw || typeof raw !== 'object') return h
  h.goal = ['soup', 'feed', 'stove'].includes(raw.goal) ? raw.goal : ''
  h.experiences = Array.isArray(raw.experiences) ? raw.experiences.filter(x => x && typeof x.id === 'string').slice(0, 80).map(x => ({ id: text(x.id, 80), title: text(x.title, 60), text: text(x.text), day: Number(x.day) || 1, at: Number(x.at) || 0, recipe: text(x.recipe, 50) })) : []
  h.drafts = Array.isArray(raw.drafts) ? raw.drafts.filter(x => x && typeof x.id === 'string').slice(0, 30).map(x => ({ id: text(x.id, 80), title: text(x.title, 60), goal: text(x.goal), conditions: text(x.conditions), steps: text(x.steps, 600), budget: text(x.budget), tradeoff: text(x.tradeoff), result: text(x.result, 400), source: text(x.source, 120), version: text(x.version, 60), at: Number(x.at) || 0 })) : []
  const storedNext = Number.isSafeInteger(raw.nextDraft) && raw.nextDraft > 0 && raw.nextDraft < Number.MAX_SAFE_INTEGER ? raw.nextDraft : 1
  h.nextDraft = Math.max(storedNext, ...h.drafts.map(d => /^draft-\d+$/.test(d.id) ? (Number.isSafeInteger(Number(d.id.slice(6))) && Number(d.id.slice(6)) < Number.MAX_SAFE_INTEGER ? Number(d.id.slice(6)) + 1 : 1) : 1))
  h.receipts = Array.isArray(raw.receipts) ? raw.receipts.filter(x => typeof x === 'string').slice(-64) : []
  if (raw.ren && ['open', 'shared', 'declined', 'later'].includes(raw.ren.status)) h.ren = { status: raw.ren.status, goal: text(raw.ren.goal), outcome: text(raw.ren.outcome, 400), reason: text(raw.ren.reason), at: Number(raw.ren.at) || 0, source: text(raw.ren.source, 80) }
  return h
}
