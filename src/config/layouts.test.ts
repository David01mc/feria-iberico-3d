import { describe, expect, it } from 'vitest'
import { buildColliders } from './colliders'
import { FAIR } from './fair'
import { contains, localRectToWorld, localToWorld, overlaps, rect, standFrame } from './geometry'
import { CERVEZAS, CROQUETAS, EMBUTIDOS, SIDRAS, STAND_COLLIDERS, VINOS } from './layouts'

const inside = (x: number, z: number, rects: ReturnType<typeof buildColliders>) =>
  rects.some((r) => contains(r, rect(x, z, x, z)))

describe('layouts de los stands', () => {
  it('el remate del stand de vinos no comparte caras con el muro ni supera la altura permitida', () => {
    const stand = FAIR.stands.find((s) => s.kind === 'vinos')!
    expect(VINOS.canopy.bottom).toBeGreaterThan(VINOS.wall.height)
    expect(VINOS.canopy.z[0]).toBeGreaterThan(VINOS.wall.z + VINOS.wall.depth)
    expect(VINOS.canopy.bottom + VINOS.canopy.height).toBeLessThanOrEqual(stand.maxHeight)
  })

  it('la planta del stand de sidra deja libres los dos taburetes', () => {
    const [px, pz] = SIDRAS.plant
    const plant = rect(px - 0.275, pz - 0.275, px + 0.275, pz + 0.275)
    for (const [x, z] of SIDRAS.stools) {
      const half = SIDRAS.stoolSize / 2
      expect(overlaps(plant, rect(x - half, z - half, x + half, z + half))).toBe(false)
    }
  })

  it('sidras y cervezas separan paredes, perfiles y tarimas en su límite común', () => {
    const sidras = FAIR.stands.find((s) => s.kind === 'sidras')!
    const cervezas = FAIR.stands.find((s) => s.kind === 'cervezas')!
    const sf = standFrame(sidras.plot, sidras.front)
    const cf = standFrame(cervezas.plot, cervezas.front)
    const z = (frame: typeof sf, localZ: number) => localToWorld(frame, [0, localZ])[1]
    const sidraWall = z(sf, -sf.depth / 2 + SIDRAS.wallInset)
    const beerPanel = z(cf, -cf.depth / 2 + CERVEZAS.panelInset)
    const beerFrame = z(cf, CERVEZAS.rearFrameZ - 0.035)
    const ciderCeiling = z(sf, SIDRAS.ceiling.z[0])
    const ciderFloor = z(sf, -sf.depth / 2 + SIDRAS.floorInset)
    const beerFloor = z(cf, -cf.depth / 2 + CERVEZAS.floorInset)

    expect(beerPanel - sidraWall).toBeGreaterThanOrEqual(0.04)
    expect(beerFrame - ciderCeiling).toBeGreaterThanOrEqual(0.04)
    expect(beerFloor - ciderFloor).toBeGreaterThanOrEqual(0.04)
  })

  it('quesos, croquetas y embutidos mantienen separados sus muros laterales', () => {
    const byKind = (kind: 'quesos' | 'croquetas' | 'embutidos') => {
      const stand = FAIR.stands.find((s) => s.kind === kind)!
      const frame = standFrame(stand.plot, stand.front)
      return STAND_COLLIDERS[kind]().map((wall) => localRectToWorld(frame, wall))
    }
    const quesosEast = byKind('quesos')[1]!
    const croquetasWest = byKind('croquetas')[2]!
    const croquetasEast = byKind('croquetas')[1]!
    const embutidosWest = byKind('embutidos')[1]!

    expect(croquetasWest.x0 - quesosEast.x1).toBeGreaterThanOrEqual(0.1)
    expect(embutidosWest.x0 - croquetasEast.x1).toBeGreaterThanOrEqual(0.1)
  })

  it('el lateral de cervezas queda separado del módulo vecino', () => {
    const beer = FAIR.stands.find((s) => s.kind === 'cervezas')!
    const neighbor = FAIR.neighbors.find(
      (n) => n.plot.x0 === beer.plot.x1 && n.plot.z0 === beer.plot.z0,
    )!
    const wallOuter = beer.plot.x1 - CERVEZAS.sideInset
    const neighborPostInner = neighbor.plot.x0 + 0.005

    expect(neighborPostInner - wallOuter).toBeGreaterThanOrEqual(0.06)
  })

  it('las encimeras de croquetas y embutidos caben entre los muros retraídos', () => {
    const overhang = 0.03
    const croquetasOpening = 1.5 - CROQUETAS.wallInset - CROQUETAS.wallThickness
    expect(CROQUETAS.frontCounter.size[0] / 2 + overhang).toBeLessThan(croquetasOpening)
    expect(CROQUETAS.backCounter.size[0] / 2 + overhang).toBeLessThan(croquetasOpening)

    const embutidosWall = 2.25 - EMBUTIDOS.wallInset - EMBUTIDOS.wallThickness
    const counterEdge =
      EMBUTIDOS.frontCounter.center[0] + EMBUTIDOS.frontCounter.size[0] / 2 + overhang
    expect(counterEdge).toBeLessThan(embutidosWall)
  })

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
