import { describe, expect, it } from 'vitest'
import {
  area,
  center,
  computeOpenSides,
  contains,
  overlaps,
  rect,
  sideSegment,
  subdivide,
} from './geometry'

describe('sideSegment', () => {
  it('coloca una pieza paralela al lado este, hacia dentro', () => {
    const seg = sideSegment(rect(0, 0, 4, 2), 'east', 0.1)
    expect(seg.center[0]).toBeCloseTo(3.9)
    expect(seg.center[1]).toBeCloseTo(1)
    expect(seg.length).toBe(2)
    expect(seg.rotationY).toBeCloseTo(Math.PI / 2)
  })

  it('coloca una pieza en el lado norte mirando al norte', () => {
    const seg = sideSegment(rect(0, 0, 4, 2), 'north', 0.5)
    expect(seg.center).toEqual([2, 0.5])
    expect(seg.length).toBe(4)
    expect(seg.rotationY).toBeCloseTo(Math.PI)
  })
})

describe('rect', () => {
  it('normaliza el orden de las coordenadas', () => {
    expect(rect(4, 3, 0, 0)).toEqual({ x0: 0, x1: 4, z0: 0, z1: 3 })
  })

  it('calcula área y centro', () => {
    const r = rect(-4, -8, 4, -2)
    expect(area(r)).toBe(48)
    expect(center(r)).toEqual([0, -5])
  })
})

describe('overlaps', () => {
  it('no considera solape dos parcelas que solo se tocan', () => {
    expect(overlaps(rect(0, 0, 3, 3), rect(3, 0, 6, 3))).toBe(false)
  })

  it('detecta solape con área positiva', () => {
    expect(overlaps(rect(0, 0, 3, 3), rect(2.9, 0, 6, 3))).toBe(true)
  })
})

describe('contains', () => {
  it('acepta un rectángulo en el borde interior', () => {
    expect(contains(rect(0, 0, 10, 10), rect(0, 0, 3, 3))).toBe(true)
  })

  it('rechaza uno que sobresale', () => {
    expect(contains(rect(0, 0, 10, 10), rect(8, 8, 11, 9))).toBe(false)
  })
})

describe('subdivide', () => {
  it('parte un bloque en parcelas consecutivas', () => {
    const parts = subdivide(rect(0, 0, 9, 3), 'x', [3, 6])
    expect(parts).toEqual([rect(0, 0, 3, 3), rect(3, 0, 9, 3)])
  })

  it('falla si las medidas no suman el bloque', () => {
    expect(() => subdivide(rect(0, 0, 9, 3), 'x', [3, 3])).toThrow(/suman 6/)
  })
})

describe('computeOpenSides', () => {
  const areaRect = rect(-20, -20, 20, 20)

  it('una isla aislada tiene los 4 lados abiertos', () => {
    expect(computeOpenSides(rect(-4, -3, 4, 3), [], areaRect).sort()).toEqual([
      'east',
      'north',
      'south',
      'west',
    ])
  })

  it('una esquina con vecinos al sur y al oeste abre al norte y al este', () => {
    const plot = rect(0, 0, 4, 4)
    const neighbors = [rect(0, 4, 4, 7), rect(-3, 0, 0, 4)]
    expect(computeOpenSides(plot, neighbors, areaRect).sort()).toEqual(['east', 'north'])
  })

  it('un lado pegado al límite de la zona de exposición no está abierto', () => {
    const plot = rect(-20, -3, -17, 3)
    expect(computeOpenSides(plot, [], areaRect)).not.toContain('west')
  })
})
