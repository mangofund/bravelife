import assert from 'node:assert/strict'
import { newGame, npcsAt, state, talk } from '../src/game/index.js'
import { previewArrival, previewFood } from '../src/game/free-preview.js'

globalThis.uni = { setStorageSync() {}, showToast() {} }
newGame({ name: '试玩', background: 'normal', startAge: 22 })
state.location = 'park'
state.hour = 19 + 22 / 60
assert.equal(previewArrival('library'), null)
state.hour = 16
const arrival = previewArrival('library')
assert.ok(arrival && arrival.hour > state.hour && arrival.energy < state.stats.energy)
assert.ok(npcsAt('library', arrival.hour).some(npc => npc.id === 'haruka'))
state.stats.energy = 36
assert.equal(previewArrival('library'), null)
state.location = 'library'
state.hour = 14
assert.equal(talk('haruka'), true)
const met = state.social.haruka.aff
state.day++
assert.equal(talk('haruka'), true)
assert.ok(state.social.haruka.aff > met)
console.log('PASS: closed-on-arrival routes, low-energy routes and next-day NPC follow-up')


state.location = 'konbini'
state.bag = { bento: 1 }
state.stats.hunger = 15
state.money = 1000
assert.equal(previewFood(0).item, 'bento')
state.bag = {}
assert.equal(previewFood(0).meal.id, 'onigiri')
assert.equal(previewFood(0).emergency, true)
state.stats.hunger = 30
assert.equal(previewFood(0), null)
state.stats.hunger = 15
state.money = 149
assert.equal(previewFood(0), null)
console.log('PASS: existing food, emergency meal with no run profit, and actual cash limit')
