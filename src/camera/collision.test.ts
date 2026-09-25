import { describe, expect, it } from 'vitest'
import { rect } from '../config/geometry'
import { moveWithCollisions, pushOut } from './collision'

const RADIUS = 0.3
/** Panel fino de stand modular en x = 1. */
const WALL = rect(1, -1, 1.04, 1)

describe('moveWithCollisions', () => {
  it('se detiene a un radio de distancia del panel', () => {
    const [x] = moveWithCollisions([0, 0], [2, 0], RADIUS, [WALL])
    expect(x).toBeCloseTo(1 - RADIUS, 3)
  })

  it('desliza a lo largo del panel en lugar de quedarse pegado', () => {
    const [x, z] = moveWithCollisions([0, 0], [1, 0.8], RADIUS, [WALL])
    expect(x).toBeCloseTo(1 - RADIUS, 3)
    expect(z).toBeCloseTo(0.8, 3)
  })

  it('no atraviesa un panel fino aunque el paso sea grande', () => {
    const [x] = moveWithCollisions([0, 0], [6, 0], RADIUS, [WALL])
    expect(x).toBeLessThan(1)
  })

  it('se mueve libremente si no hay obstáculos', () => {
    const [x, z] = moveWithCollisions([0, 0], [1.5, -2], RADIUS, [])
    expect(x).toBeCloseTo(1.5, 6)
    expect(z).toBeCloseTo(-2, 6)
  })
})

describe('pushOut', () => {
  it('saca el punto por el lado más cercano si ha quedado dentro de un obstáculo', () => {
    const [x, z] = pushOut([0.5, 0.1], RADIUS, [rect(0, 0, 4, 4)])
    expect(z).toBeCloseTo(-RADIUS, 3)
    expect(x).toBeCloseTo(0.5, 3)
  })
})
