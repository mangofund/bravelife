import assert from 'node:assert/strict'
import { newGame, state, travel, keepInvite } from '../src/game/index.js'
import { previewInvite } from '../src/game/free-preview.js'
import { reviewPreviewStep } from '../src/game/preview-review.js'

globalThis.uni = { setStorageSync() {}, showToast() {} }
newGame({ name: '邀约测试', background: 'normal', startAge: 22 })
state.day = 4
state.hour = 11
state.location = 'gym'
state.social.kenta = { aff: 20, status: 'none', last: 4 }
state.invite = { npc: 'kenta', loc: 'park', from: 12, to: 17, day: 4, done: false }
assert.equal(keepInvite(), false)
assert.ok(previewInvite())
state.location = 'park'
assert.equal(keepInvite(), false)
state.hour = 12
assert.equal(keepInvite(), true)
assert.equal(state.social.kenta.aff, 30)
assert.equal(previewInvite(), null)

const missed = { before: { invite: { day: 4, done: false } }, after: { day: 5, invite: null } }
assert.equal(reviewPreviewStep(missed)[0].category, '策划')
assert.equal(reviewPreviewStep({ ...missed, attendedInvite: true }).length, 0)
assert.equal(reviewPreviewStep({ before: {}, after: {} }, 'walk', { modes: ['train'] })[0].category, '功能')

const random = Math.random
try {
  for (const [mode, expected] of [['walk', false], ['bike', false], ['train', true]]) {
    state.location = 'home'
    state.hour = 8
    state.pendingEvent = null
    state.vehicles.bike = true
    let rolls = 0
    Math.random = () => ++rolls === 1 ? 0 : 0.2
    assert.equal(travel('konbini', mode), true)
    assert.equal(state.pendingEvent === 'delay', expected)
  }
} finally {
  Math.random = random
}
console.log('PASS: exact invitation, missed-invite detection and transport-specific events')
