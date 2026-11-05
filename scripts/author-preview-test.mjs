import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import worker from '../worker/index.js'
import { beginRehearsal, commitRehearsal, endRehearsal, resetState, save, state } from '../src/game/engine/core.js'
import { buyShopProduct } from '../src/game/engine/shop.js'

globalThis.crypto ||= webcrypto
const endpoint = 'https://test.invalid/api/me/preview'
for (const method of ['GET', 'POST']) {
  const guest = await worker.fetch(new Request(endpoint, { method }), {})
  assert.equal(guest.status, 401)
  for (const [author, user, expected] of [[undefined, 1, 404], ['1', 2, 404], ['1', 1, 200]]) {
    const env = {
      BRAVELIFE_AUTHOR_ID: author,
      DB: { prepare: () => ({ bind: () => ({ first: async () => ({ id: user }) }) }) }
    }
    const response = await worker.fetch(new Request(endpoint, {
      method, headers: { Authorization: 'Bearer ' + 'a'.repeat(64) }
    }), env)
    assert.equal(response.status, expected)
    if (expected === 200) assert.equal(response.headers.get('Cache-Control'), 'no-store')
  }
}

let saved
globalThis.uni = { setStorageSync: (_, data) => { saved = data }, showToast() {} }
resetState({ started: true, money: 1000 })
assert.equal(save(), true)
const original = saved
assert.equal(beginRehearsal(), true)
assert.equal(beginRehearsal(), false)
assert.equal(buyShopProduct('supply', 'seed_radish'), true)
assert.equal(state.money, 950)
assert.equal(saved, original)
endRehearsal()
assert.equal(JSON.stringify(state), original)
assert.equal(buyShopProduct('supply', 'seed_radish'), true)
assert.equal(JSON.parse(saved).money, 950)
assert.equal(beginRehearsal(), true)
assert.equal(buyShopProduct('supply', 'seed_radish'), true)
assert.equal(JSON.parse(saved).money, 950)
assert.equal(commitRehearsal(), true)
endRehearsal()
assert.equal(JSON.parse(saved).money, 900)
assert.equal(state.money, 900)
const draft = { ...JSON.parse(saved), money: 800, day: 9 }
assert.equal(beginRehearsal(draft), true)
assert.equal(state.day, 9)
assert.equal(state.money, 800)
assert.equal(JSON.parse(saved).money, 900)
endRehearsal()
assert.equal(state.money, 900)
console.log('PASS: author authorization, save isolation, draft recovery and explicit commit')
