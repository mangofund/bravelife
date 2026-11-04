import { state, isOpen } from './engine/core.js'
import { travelOptions } from './engine/transport.js'
import { locVisible } from './engine/courage.js'
import { isMinor } from './engine/calendar.js'
import { LOCATION_MAP } from './data/locations.js'
import { MODE_MAP } from './data/transport.js'

export function freePreviewMode(destination) {
  return travelOptions(destination).filter(mode => mode.ok && mode.cost === 0)
    .sort((a, b) => a.hours - b.hours)[0]
}

export function previewArrival(destination) {
  if (!locVisible(destination)) return null
  const mode = destination === state.location ? null : freePreviewMode(destination)
  if (destination !== state.location && !mode) return null
  const hours = mode?.hours || 0
  const hour = state.hour + hours
  const energy = state.stats.energy - hours * 2.5 -
    (mode ? Math.round((MODE_MAP[mode.id].energyPerHour || 0) * hours) : 0)
  const hunger = state.stats.hunger - hours * (isMinor() ? 1.2 : 3)
  if (hour >= 24 || energy < 35 || hunger < 20 || !isOpen(LOCATION_MAP[destination], hour)) return null
  return { hour, hours, energy, hunger }
}
