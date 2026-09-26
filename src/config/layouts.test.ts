import { describe, expect, it } from 'vitest'
import { buildColliders } from './colliders'
import { FAIR } from './fair'
import { contains, localRectToWorld, localToWorld, rect, standFrame } from './geometry'
import { STAND_COLLIDERS } from './layouts'

const inside = (x: number, z: number, rects: ReturnType<typeof buildColliders>) =>
  rects.some((r) => contains(r, rect(x, z, x, z)))

describe('layouts de los stands', () => {
  it.each(FAIR.stands.map((s) => [s.kind, s] as const))(
    '%s: todos sus obstáculos caen dentro de su parcela',
    (_, stand) => {
      const frame = standFrame(stand.plot, stand.front)
      for (const local of STAND_COLLIDERS[stand.kind]()) {
        expect(contains(stand.plot, localRectToWorld(frame, local))).toBe(true)
      }
    },
  )

  it.each(FAIR.stands.map((s) => [s.kind, s] as const))(
    '%s: se puede entrar por el centro de su frente',
    (_, stand) => {
      const frame = standFrame(stand.plot, stand.front)
      const [x, z] = localToWorld(frame, [0, frame.depth / 2 - 0.15])
      expect(inside(x, z, buildColliders(FAIR))).toBe(false)
    },
  )

  it('el paseo choca con la barra del jamón', () => {
    const jamon = FAIR.stands.find((s) => s.kind === 'jamon')!
    const [x, z] = localToWorld(standFrame(jamon.plot, jamon.front), [0, 0])
    expect(inside(x, z, buildColliders(FAIR))).toBe(true)
  })
})
