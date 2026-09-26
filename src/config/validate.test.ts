import { describe, expect, it } from 'vitest'
import { FAIR } from './fair'
import { rect } from './geometry'
import type { FairConfig } from './types'
import { sizeCategory, validateFair } from './validate'

const codes = (fair: FairConfig) => validateFair(fair).map((issue) => issue.code)

describe('sizeCategory', () => {
  it('clasifica por superficie', () => {
    expect(sizeCategory(9)).toBe('pequeño')
    expect(sizeCategory(18)).toBe('mediano')
    expect(sizeCategory(48)).toBe('grande')
  })
})

describe('FAIR (Salón Dehesa 2026)', () => {
  it('es una configuración válida', () => {
    expect(validateFair(FAIR)).toEqual([])
  })

  it('clasifica los puestos de ibéricos, bebidas, tapas, aceitunas y vermut por superficie', () => {
    const sizes = FAIR.stands.map((s) => s.size).sort()
    expect(sizes).toEqual([
      'grande',
      'grande',
      'grande',
      'mediano',
      'mediano',
      'mediano',
      'mediano',
      'pequeño',
    ])
  })

  it('tiene un stand de cada producto', () => {
    expect(FAIR.stands.map((s) => s.kind).sort()).toEqual([
      'cervezas',
      'croquetas',
      'embutidos',
      'jamon',
      'quesos',
      'sidras',
      'tapas',
      'vinos',
    ])
  })

  it('el stand de vinos es una península: tres lados a pasillo', () => {
    const vinos = FAIR.stands.find((s) => s.kind === 'vinos')!
    expect(vinos.layout).toBe('peninsula')
    expect(vinos.openSides).toHaveLength(3)
  })

  it('rodea la parcela de cada expositor con vecinos para dar contexto', () => {
    expect(FAIR.neighbors.length).toBeGreaterThan(40)
  })
})

describe('validateFair', () => {
  const withStand = (patch: Partial<FairConfig['stands'][number]>): FairConfig => ({
    ...FAIR,
    stands: FAIR.stands.map((s, i) => (i === 0 ? { ...s, ...patch } : s)),
  })

  it('detecta parcelas solapadas', () => {
    const quesos = FAIR.stands.find((s) => s.kind === 'quesos')!
    const broken: FairConfig = {
      ...FAIR,
      neighbors: [
        ...FAIR.neighbors,
        {
          code: 'X-99',
          plot: quesos.plot,
          openSides: [],
          carpet: '#000',
          accent: '#000',
          sector: 'Test',
        },
      ],
    }
    expect(codes(broken)).toContain('overlap')
  })

  it('detecta un tamaño comercial que no corresponde a la superficie', () => {
    expect(codes(withStand({ size: 'pequeño' }))).toContain('size-mismatch')
  })

  it('detecta lados abiertos que no dan a pasillo', () => {
    expect(codes(withStand({ openSides: ['north'] }))).toContain('open-sides')
  })

  it('detecta un frente principal que da a un lado cerrado', () => {
    const quesos = FAIR.stands.findIndex((s) => s.kind === 'quesos')
    const broken: FairConfig = {
      ...FAIR,
      stands: FAIR.stands.map((s, i) => (i === quesos ? { ...s, front: 'south' } : s)),
    }
    expect(codes(broken)).toContain('front-closed')
  })

  it('detecta un tipo de planta que no encaja con sus lados abiertos', () => {
    const vinos = FAIR.stands.findIndex((s) => s.kind === 'vinos')
    const as = (layout: FairConfig['stands'][number]['layout']): FairConfig => ({
      ...FAIR,
      stands: FAIR.stands.map((s, i) => (i === vinos ? { ...s, layout } : s)),
    })
    expect(codes(as('peninsula'))).not.toContain('layout-mismatch')
    expect(codes(as('isla'))).toContain('layout-mismatch')
    expect(codes(as('esquina'))).toContain('layout-mismatch')
  })

  it('detecta parcelas fuera de la zona de exposición', () => {
    expect(codes(withStand({ plot: rect(40, 0, 48, 6) }))).toContain('out-of-area')
  })

  it('detecta códigos de parcela duplicados', () => {
    const [a, b] = FAIR.stands
    const dup: FairConfig = {
      ...FAIR,
      stands: FAIR.stands.map((s) => (s.id === b!.id ? { ...s, code: a!.code } : s)),
    }
    expect(codes(dup)).toContain('duplicate-code')
  })
})
