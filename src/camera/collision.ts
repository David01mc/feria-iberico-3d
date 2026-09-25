import type { Rect } from '../config/types'

/** Punto en planta [x, z]. */
export type Vec2 = [number, number]

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Empuja un círculo (el visitante) fuera de los obstáculos que solapa. */
export function pushOut(p: Vec2, radius: number, rects: readonly Rect[]): Vec2 {
  let [x, z] = p
  for (const r of rects) {
    const nx = clamp(x, r.x0, r.x1)
    const nz = clamp(z, r.z0, r.z1)
    const dx = x - nx
    const dz = z - nz
    const d2 = dx * dx + dz * dz
    if (d2 >= radius * radius) continue
    if (d2 > 1e-12) {
      const d = Math.sqrt(d2)
      x = nx + (dx / d) * radius
      z = nz + (dz / d) * radius
      continue
    }
    // El centro ha quedado dentro: sale por el lado más cercano.
    const exits = [
      { gap: x - r.x0, apply: () => (x = r.x0 - radius) },
      { gap: r.x1 - x, apply: () => (x = r.x1 + radius) },
      { gap: z - r.z0, apply: () => (z = r.z0 - radius) },
      { gap: r.z1 - z, apply: () => (z = r.z1 + radius) },
    ]
    exits.reduce((best, e) => (e.gap < best.gap ? e : best)).apply()
  }
  return [x, z]
}

/**
 * Avanza `delta` en subpasos de medio radio (para no atravesar paneles finos) y
 * resuelve colisiones en cada uno, de modo que el visitante desliza por las paredes.
 */
export function moveWithCollisions(
  from: Vec2,
  delta: Vec2,
  radius: number,
  rects: readonly Rect[],
): Vec2 {
  const distance = Math.hypot(delta[0], delta[1])
  if (distance === 0) return from
  const steps = Math.max(1, Math.ceil(distance / (radius * 0.5)))
  let p: Vec2 = from
  for (let i = 0; i < steps; i++) {
    p = [p[0] + delta[0] / steps, p[1] + delta[1] / steps]
    p = pushOut(pushOut(p, radius, rects), radius, rects)
  }
  return p
}
