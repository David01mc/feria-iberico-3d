import { describe, expect, it } from 'vitest'
import { WALK_SPAWN } from './colliders'
import { FAIR } from './fair'
import { createNavigator, standEntrance } from './navigation'

const navigator = createNavigator(FAIR)
const physical = createNavigator(FAIR, false)

describe('guía entre stands', () => {
  it.each(FAIR.stands.map((stand) => [stand.company.name, stand] as const))(
    'encuentra un camino transitable hasta %s',
    (_, stand) => {
      const goal = standEntrance(stand)
      const route = navigator.route(WALK_SPAWN.position, goal)
      expect(route.length).toBeGreaterThan(1)
      expect(route.at(-1)).toEqual(goal)
      for (let i = 1; i < route.length; i++) {
        const a = route[i - 1]!
        const b = route[i]!
        const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.15)
        for (let j = 0; j <= steps; j++) {
          const t = j / steps
          expect(navigator.clear([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])).toBe(true)
        }
      }
    },
  )

  it.each(
    FAIR.stands.map(
      (stand, i) =>
        [stand.company.name, stand, FAIR.stands[(i + 1) % FAIR.stands.length]!] as const,
    ),
  )('recalcula la ruta desde la entrada de %s al siguiente stand', (_, from, to) => {
    const route = navigator.route(standEntrance(from), standEntrance(to))
    expect(route.length).toBeGreaterThan(1)
    expect(route.at(-1)).toEqual(standEntrance(to))
  })

  it.each(FAIR.stands.map((stand) => [stand.company.name, stand] as const))(
    'la ruta a %s se mantiene fuera de las parcelas',
    (_, stand) => {
      const route = navigator.route(WALK_SPAWN.position, standEntrance(stand))
      for (let i = 1; i < route.length; i++) {
        const a = route[i - 1]!
        const b = route[i]!
        const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.2)
        for (let j = 0; j <= steps; j++) {
          const t = j / steps
          const x = a[0] + (b[0] - a[0]) * t
          const z = a[1] + (b[1] - a[1]) * t
          const inside = [...FAIR.stands, ...FAIR.neighbors].find(
            ({ plot }) =>
              x > plot.x0 + 0.1 && x < plot.x1 - 0.1 && z > plot.z0 + 0.1 && z < plot.z1 - 0.1,
          )
          expect(
            inside?.code,
            `Ruta a ${stand.company.name} atraviesa ${inside?.code} en ${x.toFixed(1)}, ${z.toFixed(1)}`,
          ).toBeUndefined()
        }
      }
    },
  )

  it.each(
    FAIR.stands
      .filter((stand) => ['jamon', 'vinos', 'cervezas', 'sidras', 'tapas'].includes(stand.kind))
      .map((stand) => [stand.company.name, stand] as const),
  )('puede salir de %s antes de continuar la guía', (_, stand) => {
    const { plot } = stand
    const candidates: [number, number][] = []
    for (let x = plot.x0 + 0.5; x < plot.x1 - 0.4; x += 0.5) {
      for (let z = plot.z0 + 0.5; z < plot.z1 - 0.4; z += 0.5) {
        if (physical.clear([x, z])) candidates.push([x, z])
      }
    }
    expect(candidates.length).toBeGreaterThan(0)
    const start = candidates[Math.floor(candidates.length / 2)]!
    const route = navigator.route(start, WALK_SPAWN.position)
    expect(route.length).toBeGreaterThan(1)
    expect(route.at(-1)).toEqual(WALK_SPAWN.position)
    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1]!
      const b = route[i]!
      const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.2)
      for (let j = 0; j <= steps; j++) {
        const t = j / steps
        expect(physical.clear([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])).toBe(true)
      }
    }
  })
})
