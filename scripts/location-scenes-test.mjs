import assert from 'node:assert/strict'
import { Box3, Raycaster, Vector3 } from 'three'
import { LOCATIONS } from '../src/game/data/locations.js'
import { NPCS } from '../src/game/data/npcs.js'
import { buildLocation } from '../src/game/scene3d/locations.js'

for (const location of LOCATIONS.filter(location => location.id !== 'home')) {
  const preview = buildLocation({ id: location.id, people: [] })
  assert(preview.root.children.length >= 4, location.id)
  assert.equal(preview.targets.length, 0, location.id)
  const bounds = new Box3().setFromObject(preview.root)
  assert(bounds.max.y > .65 && bounds.min.y < 0, location.id)
}

const people = NPCS.slice(-4).map(npc => npc.id)
const model = buildLocation({ id: 'park', people })
assert.deepEqual(model.targets.map(person => person.userData.hit), people)
assert.equal(new Set(model.targets.map(person => person.position.x)).size, people.length)
assert(model.targets.every(person => person.children.length > 8))
model.root.updateMatrixWorld(true)
for (const person of model.targets) {
  const ray = new Raycaster(new Vector3(person.position.x, .85, 5), new Vector3(0, 0, -1))
  assert.equal(ray.intersectObjects(model.targets, true)[0]?.object.parent.userData.hit, person.userData.hit)
}
console.log('All map dioramas and street character targets passed')
