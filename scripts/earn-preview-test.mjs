import assert from 'node:assert/strict'
import { beginRehearsal, endRehearsal, state, newGame, travel, work, applyJob } from '../src/game/index.js'
import { planEarnings } from '../src/game/earn-preview.js'

globalThis.uni = { setStorageSync() {}, showToast() {} }
newGame({ name: '目标测试', background: 'normal', startAge: 22 })
state.pendingEvent = ''
state.pendingStory = ''
state.hour = 8
state.job = { career: 'konbini', level: 0, shifts: 0, lastDay: 0 }
const goal = { day: state.day, startBalance: state.money, balance: state.money + 5000 }
const snapshot = JSON.stringify(state)
const route = planEarnings(goal)
assert.equal(route.next.type, 'travel')
assert.ok(route.end < 24 && route.net >= 5000)
assert.equal(JSON.stringify(state), snapshot)
assert.equal(beginRehearsal(), true)
assert.equal(travel(route.next.destination, route.next.mode), true)
assert.equal(planEarnings(goal).next.type, 'work')
assert.equal(work(), true)
assert.match(planEarnings(goal).message, /目标达成/)
endRehearsal()
assert.equal(JSON.stringify(state), snapshot)

state.location = 'konbini'
state.job = null
assert.deepEqual(planEarnings(goal).next, { type: 'apply', career: 'konbini' })
assert.equal(applyJob('konbini'), true)
assert.equal(planEarnings(goal).next.type, 'work')
state.hour = 18
assert.match(planEarnings(goal).message, /未找到/)
state.hour = 8
assert.match(planEarnings({ ...goal, balance: state.money + 100000 }).message, /低于/)
state.job.lastDay = state.day
assert.match(planEarnings(goal).message, /用完/)
console.log('PASS: estimate, replan, reach goal, eligibility and deadline')
