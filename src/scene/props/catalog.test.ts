import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MODEL_KEYS, MODELS } from './catalog'

const root = (path: string) => fileURLToPath(new URL(`../../../${path}`, import.meta.url))

describe('catálogo de mobiliario 3D', () => {
  it.each(MODEL_KEYS)('%s tiene su GLB generado en public/assets/models', (key) => {
    expect(existsSync(root(`public/assets/models/${MODELS[key].file}`))).toBe(true)
  })

  it('cataloga todos los modelos de Poly Haven que descarga el manifiesto', () => {
    const manifest = JSON.parse(readFileSync(root('scripts/assets.manifest.json'), 'utf8')) as {
      models: { id: string; raw?: boolean }[]
    }
    const catalogued = MODEL_KEYS.map((key) => MODELS[key].file)
    // Los `raw` son materia prima de blender/macetas.py: no se publican por separado.
    for (const { id } of manifest.models.filter((m) => !m.raw))
      expect(catalogued).toContain(`ph/${id}.glb`)
  })
})
