export const PET_ROUTINES = {
  dog: ['run', 'run', 'sniff', 'jump', 'run', 'sleep', 'idle', 'run', 'sun', 'sun', 'run'],
  cat: ['run', 'jump', 'run', 'groom', 'jump', 'sleep', 'idle', 'jump', 'sun', 'sun', 'run']
}
export const PET_CLIPS = { sun: 'sleep' }
export function petMealPending(pet, care, now) {
  return care.meal === pet.lastMealAt
    ? care.stage < care.activities.length
    : pet.lastMealAt > 0 && now - pet.lastMealAt < 5 * 60000
}

export function petMealAction(pet, care, now, random = Math.random) {
  if (!petMealPending(pet, care, now)) return
  if (care.meal !== pet.lastMealAt) {
    const activities = ['toilet', 'sleep', 'play']
    for (let i = activities.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      const activity = activities[i]
      activities[i] = activities[j]
      activities[j] = activity
    }
    care.meal = pet.lastMealAt
    care.stage = 0
    care.activities = ['eat', ...activities.flatMap(action => action === 'toilet' ? [action] : [action, action])]
  }
  return care.activities[care.stage]
}

export function petResting(pet, now) { return !pet || pet.fedUntil <= now || pet.energy < 15 }
export function petHabitat(kind, pet, now, turn = 0) {
  if (petResting(pet, now)) return 'room'
  return (Math.floor(turn / PET_ROUTINES[kind].length) + (kind === 'cat' ? 1 : 0)) % 2 ? 'room' : 'garden'
}

function adjacent(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1 }

// Follow connected tiles toward a pet furnishing, or explore without immediately backtracking.
export function nextPetSpot(points, current, turn = 0, previous, goal) {
  if (!points.length) return null
  const start = points.find(p => p.id === current) || points[0]
  const neighbors = points.filter(p => adjacent(start, p))
  if (goal) {
    const queue = [{ point: start, first: start }]
    const visited = new Set([start.id])
    for (const { point, first } of queue) {
      if (goal(point)) return first
      for (const next of points) {
        if (!adjacent(point, next) || visited.has(next.id)) continue
        visited.add(next.id)
        queue.push({ point: next, first: point === start ? next : first })
      }
    }
    return start
  }
  const onward = neighbors.filter(p => p.id !== previous)
  const choices = onward.length ? onward : neighbors
  return choices[turn % choices.length] || start
}
