import { state, isOpen } from './engine/core.js'
import { bestBed } from './engine/time.js'
import { travelOptions } from './engine/transport.js'
import { locVisible } from './engine/courage.js'
import { isMinor } from './engine/calendar.js'
import { LOCATION_MAP } from './data/locations.js'
import { ITEMS } from './data/world.js'
import { MODE_MAP } from './data/transport.js'

export function freePreviewMode(destination) {
  return travelOptions(destination).filter(mode => mode.ok && mode.cost === 0)
    .sort((a, b) => a.hours - b.hours)[0]
}

export function previewArrival(destination, { nap = 0, minimumEnergy = 35 } = {}) {
  if (!locVisible(destination)) return null
  const mode = destination === state.location ? null : freePreviewMode(destination)
  if (destination !== state.location && !mode) return null
  const hours = mode?.hours || 0
  const hour = state.hour + nap + hours
  const energy = Math.min(100, state.stats.energy + nap * 11 * bestBed()) - hours * 2.5 -
    (mode ? Math.round((MODE_MAP[mode.id].energyPerHour || 0) * hours) : 0)
  const hunger = state.stats.hunger - nap * 1.5 - hours * (isMinor() ? 1.2 : 3)
  if (hour >= 24 || energy < minimumEnergy || hunger < 20 || !isOpen(LOCATION_MAP[destination], hour)) return null
  return { hour, hours, energy, hunger }
}


// Invitations can be attended after a short wait, if the venue and needs allow it.
export function previewInvite() {
  const invite = state.invite
  if (!invite || invite.done || invite.day !== state.day) return null
  const minimumEnergy = 25
  for (const nap of state.location === 'home' ? [0, 2] : [0]) {
    const arrival = previewArrival(invite.loc, { nap, minimumEnergy })
    if (!arrival) continue
    const start = Math.max(arrival.hour, invite.from)
    const wait = start - arrival.hour
    if (start >= invite.to || !isOpen(LOCATION_MAP[invite.loc], start) ||
        arrival.energy - wait * 2.5 < minimumEnergy || arrival.hunger - wait * (isMinor() ? 1.2 : 3) < 30) continue
    return { invite, wait, nap }
  }
  return null
}


export function previewFood(spendable) {
  const food = Object.entries(ITEMS).find(([id, item]) =>
    state.bag[id] > 0 && item.kind === 'food' && item.effects.hunger > 0)
  if (food) return { item: food[0], name: food[1].name }

  const meals = LOCATION_MAP.konbini.actions
  const emergency = state.stats.hunger < 20
  const budget = Math.min(state.money, emergency ? Math.max(spendable, meals[0].cost) : spendable)
  const meal = [...meals].reverse().find(action => action.cost <= budget)
  if (!meal || !locVisible('konbini')) return null
  if (state.location !== 'konbini') {
    const mode = freePreviewMode('konbini')
    if (!mode || state.stats.energy <= mode.hours * 2.5 +
        Math.round((MODE_MAP[mode.id].energyPerHour || 0) * mode.hours)) return null
  }
  return { meal, emergency: meal.cost > spendable }
}

export function previewStreetReply(npc) {
  if (npc.route && npc.choices?.length && !state.social[npc.id]?.streetMemory) return 0
}
