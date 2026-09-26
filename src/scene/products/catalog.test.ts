import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PRODUCT_KEYS, PRODUCTS, productMeta } from './catalog'

const root = (path: string) => fileURLToPath(new URL(`../../../${path}`, import.meta.url))

describe('catálogo de productos ibéricos', () => {
  it.each(PRODUCT_KEYS)('%s tiene su GLB y sus medidas', (key) => {
    expect(existsSync(root(`public/assets/models/products/${PRODUCTS[key].file}.glb`))).toBe(true)
    const { size } = productMeta(key)
    expect(size.every((v) => v > 0)).toBe(true)
  })

  it('los productos tienen tamaños reales', () => {
    const ham = productMeta('jamonCortado').size
    expect(ham[0]).toBeGreaterThan(0.7)
    expect(ham[0]).toBeLessThan(0.95)
    const croqueta = productMeta('croqueta').size
    expect(Math.max(...croqueta)).toBeGreaterThan(0.04)
    expect(Math.max(...croqueta)).toBeLessThan(0.08)
    const wheel = productMeta('quesoCurado').size
    expect(wheel[1]).toBeCloseTo(0.1, 1)
  })

  it('el jamón empezado declara dónde se apoya y dónde se sujeta la pezuña', () => {
    const { anchors } = productMeta('jamonCortado')
    expect(anchors.apoyo).toBeDefined()
    expect(anchors.pezuna).toBeDefined()
  })
})
