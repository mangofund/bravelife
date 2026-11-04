export const PET_ROUTINES = {
  dog: ['idle','run','run','jump','sniff','run','idle','sniff'],
  cat: ['idle','run','groom','jump','run','idle','sleep','groom']
}
export function petResting(pet, now) { return !pet || pet.fedUntil <= now || pet.energy < 15 }
export function petHabitat(kind, pet, now) { return kind === 'dog' && !petResting(pet, now) ? 'garden' : 'room' }
// One adjacent tile per step: pets never take a straight shortcut through furniture.
export function nextPetSpot(points, current, turn = 0) {
  if (!points.length) return null
  const start = points.find(p => p.id === current) || points[0]
  const neighbors = points.filter(p => Math.abs(p.x-start.x)+Math.abs(p.y-start.y)===1)
  return neighbors.length ? neighbors[((turn % neighbors.length)+neighbors.length)%neighbors.length] : start
}
