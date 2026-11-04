// Only call from synchronous user handlers. Never wrap clock or deferred room actions.
import { state } from './engine/core.js'
import { play, playTabSwitch } from './audio.js'

export function switchAudio(current, next, apply) {
  if (current === next) return
  playTabSwitch()
  apply(next)
}

// One feedback sound per action, with specific outcomes taking priority.
export function actionAudio(action, fallback = 'confirm', { visibleFailure = false, keyMoment = false } = {}) {
  const before = {
    courage: state.courage.value,
    career: state.job?.career,
    level: state.job?.level,
    quests: state.courage.questsDone,
    tutorial: state.tutorial.step,
    goals: Object.keys(state.life.goals).length,
    social: Object.fromEntries(Object.entries(state.social).map(([id, r]) => [id, { aff: r.aff, status: r.status }]))
  }
  const result = action()
  if (result === false) {
    if (visibleFailure) play('error')
    return result
  }
  const relationships = Object.entries(state.social)
  const milestone = keyMoment && ((state.job?.career === before.career && state.job?.level > before.level) || relationships.some(([id, r]) =>
    r.status !== before.social[id]?.status && ['dating', 'married'].includes(r.status)))
  const completed = state.courage.questsDone > before.quests || state.tutorial.step > before.tutorial || Object.keys(state.life.goals).length > before.goals
  const affection = relationships.some(([id, r]) => r.aff > (before.social[id]?.aff || 0))
  const event = milestone ? 'keyMoment' : completed ? 'taskComplete' : state.courage.value > before.courage ? 'courage' : affection ? 'affection' : fallback
  if (event) play(event)
  return result
}
