import { rect, SIDES, sideSegment } from './geometry'
import type { NeighborPlot, Rect, Side } from './types'

/** Medidas del sistema de stand modular (paneles de melamina y perfilería de aluminio). */
export const BOOTH = {
  panelHeight: 2.5,
  panelThickness: 0.04,
  fasciaHeight: 0.3,
  counter: { width: 1, depth: 0.5, height: 1, inset: 0.65 },
} as const

/** Lado principal del stand: el primero abierto a pasillo. */
export const boothFront = (n: NeighborPlot): Side | undefined => n.openSides[0]

export const closedSides = (n: NeighborPlot): Side[] =>
  SIDES.filter((side) => !n.openSides.includes(side))

/** Posición y orientación del mostrador, paralelo al frente y retranqueado. */
export function counterPlacement(n: NeighborPlot) {
  const front = boothFront(n)
  return front ? sideSegment(n.plot, front, BOOTH.counter.inset) : undefined
}

/** Huella en planta del mostrador (para colisiones). */
export function counterFootprint(n: NeighborPlot): Rect | undefined {
  const front = boothFront(n)
  const placement = counterPlacement(n)
  if (!front || !placement) return undefined
  const [cx, cz] = placement.center
  const along = BOOTH.counter.width / 2
  const across = BOOTH.counter.depth / 2
  return front === 'north' || front === 'south'
    ? rect(cx - along, cz - across, cx + along, cz + across)
    : rect(cx - across, cz - along, cx + across, cz + along)
}
