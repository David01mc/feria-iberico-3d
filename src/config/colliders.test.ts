import { describe, expect, it } from 'vitest'
import { buildColliders, WALK_SPAWN } from './colliders'
import { FAIR } from './fair'
import { contains, rect } from './geometry'

const inside = (x: number, z: number, rects: ReturnType<typeof buildColliders>) =>
  rects.some((r) => contains(r, rect(x, z, x, z)))

describe('buildColliders', () => {
  const colliders = buildColliders(FAIR)

  it('cierra el pabellón por sus cuatro muros', () => {
    const { bounds } = FAIR.hall
    expect(inside(bounds.x0 - 0.5, 0, colliders)).toBe(true)
    expect(inside(bounds.x1 + 0.5, 0, colliders)).toBe(true)
    expect(inside(0, bounds.z0 - 0.5, colliders)).toBe(true)
    expect(inside(0, bounds.z1 + 0.5, colliders)).toBe(true)
  })

  it('incluye paneles y mostrador de cada stand modular', () => {
    expect(colliders.length).toBeGreaterThan(FAIR.neighbors.length * 2)
  })

  it('deja libre el punto de partida del paseo y los pasillos', () => {
    expect(inside(WALK_SPAWN.position[0], WALK_SPAWN.position[1], colliders)).toBe(false)
    expect(inside(0, 0, colliders)).toBe(false)
    expect(inside(5.5, 10, colliders)).toBe(false)
  })
})
