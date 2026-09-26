import { Quaternion, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { alignTwoPoints, alongLine, gridOnSurface, seeded, wheelStack, withTints } from './arrange'

describe('seeded', () => {
  it('es determinista para la misma semilla', () => {
    const a = seeded(42)
    const b = seeded(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('devuelve valores en [0, 1)', () => {
    const r = seeded(1)
    for (let i = 0; i < 100; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('gridOnSurface', () => {
  const tray = {
    center: [0, 0.1, 0] as [number, number, number],
    size: [0.6, 0.3] as [number, number],
  }

  it('rellena la superficie con la separación pedida y a su altura', () => {
    const items = gridOnSurface(tray, { spacing: [0.1, 0.1] })
    expect(items).toHaveLength(6 * 3)
    for (const { position } of items) {
      expect(position[1]).toBeCloseTo(0.1)
      expect(Math.abs(position[0])).toBeLessThanOrEqual(0.3)
      expect(Math.abs(position[2])).toBeLessThanOrEqual(0.15)
    }
  })

  it('respeta un margen perimetral', () => {
    const items = gridOnSurface(tray, { spacing: [0.1, 0.1], margin: 0.05 })
    expect(items).toHaveLength(5 * 2)
  })
})

describe('alongLine', () => {
  it('reparte las piezas a lo largo de la barra, sin tocar los extremos', () => {
    const items = alongLine([0, 2, 0], [1, 2, 0], 4)
    expect(items.map((p) => p.position[0])).toEqual([0.125, 0.375, 0.625, 0.875])
    expect(items.every((p) => p.position[1] === 2)).toBe(true)
  })
})

describe('wheelStack', () => {
  it('apila ruedas en pirámide, cada piso sobre el anterior', () => {
    const items = wheelStack([0, 0, 0], { radius: 0.1, height: 0.1, layers: [3, 2, 1] })
    expect(items).toHaveLength(6)
    const heights = [...new Set(items.map((p) => p.position[1].toFixed(3)))]
    expect(heights).toEqual(['0.000', '0.100', '0.200'])
  })
})

describe('withTints', () => {
  it('asigna a cada pieza un tono de la paleta de forma determinista', () => {
    const items = alongLine([0, 0, 0], [1, 0, 0], 20)
    const tints = ['#ffffff', '#eeeeee', '#dddddd']
    const a = withTints(items, tints, 3)
    expect(a.every((p) => tints.includes(p.tint!))).toBe(true)
    expect(new Set(a.map((p) => p.tint)).size).toBeGreaterThan(1)
    expect(withTints(items, tints, 3)).toEqual(a)
  })
})

describe('alignTwoPoints', () => {
  it('lleva el ancla A a su destino y orienta A→B hacia el destino de B', () => {
    const localA: [number, number, number] = [0.3, -0.07, 0]
    const localB: [number, number, number] = [0.74, 0.02, 0]
    const worldA: [number, number, number] = [1, 1.2, 0]
    const worldB: [number, number, number] = [1.35, 1.33, 0]
    const { position, quaternion } = alignTwoPoints(localA, localB, worldA, worldB)
    const q = new Quaternion(...quaternion)
    const a = new Vector3(...localA).applyQuaternion(q).add(new Vector3(...position))
    const b = new Vector3(...localB).applyQuaternion(q).add(new Vector3(...position))
    expect(a.distanceTo(new Vector3(...worldA))).toBeLessThan(1e-9)
    const wanted = new Vector3(...worldB).sub(new Vector3(...worldA)).normalize()
    expect(b.sub(a).normalize().dot(wanted)).toBeCloseTo(1, 9)
  })
})
