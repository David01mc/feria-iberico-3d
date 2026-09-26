import { BOOTH, closedSides, counterFootprint } from './booths'
import { innerStrip, localRectToWorld, rect, standFrame } from './geometry'
import { STAND_COLLIDERS } from './layouts'
import type { FairConfig, Rect } from './types'

/** Punto de partida del paseo: Avenida Central, mirando hacia los cuatro stands. */
export const WALK_SPAWN = {
  position: [9, 0.4] as [number, number],
  lookAt: [-3, 1.2] as [number, number],
}

/**
 * Obstáculos en planta para el paseo en primera persona: muros del pabellón, paneles y
 * mostradores de los stands modulares y el mobiliario de los cuatro stands protagonistas.
 */
export function buildColliders(fair: FairConfig): Rect[] {
  const { bounds } = fair.hall
  const colliders: Rect[] = [
    rect(bounds.x0 - 1, bounds.z0 - 1, bounds.x1 + 1, bounds.z0),
    rect(bounds.x0 - 1, bounds.z1, bounds.x1 + 1, bounds.z1 + 1),
    rect(bounds.x0 - 1, bounds.z0, bounds.x0, bounds.z1),
    rect(bounds.x1, bounds.z0, bounds.x1 + 1, bounds.z1),
  ]

  for (const neighbor of fair.neighbors) {
    for (const side of closedSides(neighbor)) {
      colliders.push(innerStrip(neighbor.plot, side, BOOTH.panelThickness + 0.02))
    }
    const counter = counterFootprint(neighbor)
    if (counter) colliders.push(counter)
  }

  for (const stand of fair.stands) {
    const frame = standFrame(stand.plot, stand.front)
    colliders.push(...STAND_COLLIDERS[stand.kind]().map((local) => localRectToWorld(frame, local)))
  }

  return colliders
}
