import assert from 'node:assert/strict'

const storage = new Map()
globalThis.uni = {
  setStorageSync: (key, value) => storage.set(key, value),
  getStorageSync: key => storage.get(key),
  showToast() {}
}
const game = await import('../src/game/index.js')
const { NEIGHBORS } = await import('../src/game/data/neighbors.js')
const { state } = game
const { previewStreetReply } = await import('../src/game/free-preview.js')

game.newGame({ name: '测试', background: 'normal', wish: 'rich' })
for (const npc of NEIGHBORS) {
  const locations = new Set()
  for (let day = 1; day <= 12; day++) {
    state.day = day
    const { location, hours } = game.spotOf(npc)
    locations.add(location)
    assert(game.npcsAt(location, hours[0]).includes(npc))
    assert(!game.npcsAt(location, hours[1]).includes(npc))
  }
  assert.equal(locations.size, npc.route.length)
}

const npc = NEIGHBORS[0]
function meet() {
  const { location, hours } = game.spotOf(npc)
  state.location = location
  state.hour = hours[0]
}
meet()
assert.equal(game.talk(npc.id, 9), false)
assert.equal(game.rel(npc.id), null)
assert(game.talk(npc.id, 1))
assert.equal(game.talk(npc.id, 0), false)
assert(game.load())
assert.deepEqual(game.rel(npc.id).streetMemory, { reply: 1, followedUp: false })
state.day++
meet()
assert(game.talk(npc.id))
assert.equal(game.rel(npc.id).streetMemory.followedUp, true)
assert(state.messages.some(message => message.text === npc.choices[1][2]))
assert(game.rel(npc.id).aff > 5)
for (const legacy of [false, true]) {
  game.newGame({ name: '代玩测试', background: 'normal' })
  meet()
  if (legacy) {
    assert.equal(game.talk(npc.id), true)
    state.day++
    meet()
  }
  const reply = previewStreetReply(npc)
  assert.equal(reply, 0)
  assert.equal(game.talk(npc.id, reply), true)
  assert.equal(game.load(), true)
  assert.deepEqual(game.rel(npc.id).streetMemory, { reply: 0, followedUp: false })
  state.day++
  meet()
  assert.equal(previewStreetReply(npc), undefined)
  assert.equal(game.talk(npc.id, previewStreetReply(npc)), true)
  assert.equal(game.rel(npc.id).streetMemory.followedUp, true)
  assert(state.messages.some(message => message.text === npc.choices[0][2]))
}
console.log('Street encounters passed')
