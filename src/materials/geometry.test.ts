import { Matrix4, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import {
  beamMatrix,
  boxProjectUV,
  mergeBoxes,
  worldBox,
  worldPlane,
  worldRoundedBox,
} from './geometry'

describe('worldBox', () => {
  it('escala las UV de cada cara a metros / tile', () => {
    const uv = worldBox(4, 2, 1, 2).getAttribute('uv')
    // Cara superior (+y): índices 8..11, u a lo ancho (4 m) y v a lo hondo (1 m).
    const us = [8, 9, 10, 11].map((i) => uv.getX(i))
    const vs = [8, 9, 10, 11].map((i) => uv.getY(i))
    expect(Math.max(...us)).toBeCloseTo(2)
    expect(Math.max(...vs)).toBeCloseTo(0.5)
  })
})

describe('boxProjectUV', () => {
  it('proyecta las UV desde la cara dominante, en metros / tile', () => {
    // Plano horizontal de 4 × 2 m: debe proyectarse desde arriba (u = x, v = z).
    const geometry = worldPlane(4, 2).rotateX(-Math.PI / 2)
    const uv = boxProjectUV(geometry, 2).getAttribute('uv')
    const us = Array.from({ length: uv.count }, (_, i) => uv.getX(i))
    const vs = Array.from({ length: uv.count }, (_, i) => uv.getY(i))
    expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(2)
    expect(Math.max(...vs) - Math.min(...vs)).toBeCloseTo(1)
  })
})

describe('worldRoundedBox', () => {
  it('crea una caja con cantos redondeados de las medidas pedidas', () => {
    const geometry = worldRoundedBox(1.2, 0.04, 0.6, 0.01, 1)
    geometry.computeBoundingBox()
    const box = geometry.boundingBox!
    expect(box.max.x - box.min.x).toBeCloseTo(1.2)
    expect(box.max.y - box.min.y).toBeCloseTo(0.04)
    expect(geometry.getAttribute('uv')).toBeDefined()
  })
})

describe('worldPlane', () => {
  it('repite la textura según el tamaño', () => {
    const uv = worldPlane(10, 4, 2).getAttribute('uv')
    const us = Array.from({ length: uv.count }, (_, i) => uv.getX(i))
    expect(Math.max(...us)).toBeCloseTo(5)
  })
})

describe('mergeBoxes', () => {
  it('une las cajas en una geometría con color por vértice', () => {
    const geo = mergeBoxes([
      { size: [1, 1, 1], position: [0, 0, 0], color: '#ff0000' },
      { size: [2, 1, 1], position: [5, 0, 0], rotationY: Math.PI / 2 },
    ])
    expect(geo.getAttribute('position').count).toBe(48)
    expect(geo.getAttribute('color').count).toBe(48)
  })

  it('devuelve una geometría vacía si no hay cajas', () => {
    expect(mergeBoxes([]).getAttribute('position')).toBeUndefined()
  })
})

describe('beamMatrix', () => {
  it('convierte un cubo unitario en una barra entre dos puntos', () => {
    const m = beamMatrix(new Vector3(0, 0, 0), new Vector3(0, 0, 4), 0.2, new Matrix4())
    const tip = new Vector3(0, 0.5, 0).applyMatrix4(m)
    expect(tip.x).toBeCloseTo(0)
    expect(tip.y).toBeCloseTo(0)
    expect(tip.z).toBeCloseTo(4)
  })
})
