import { asset } from '../../materials/assets'
import type { Vec3 } from '../../materials/geometry'

/** Superficie horizontal de un mueble donde se colocan productos (coordenadas locales). */
export interface Surface {
  center: Vec3
  size: [width: number, depth: number]
}

export interface ModelEntry {
  label: string
  /** Ruta bajo public/assets/models. */
  file: string
  /**
   * `blender`: modelado a medida (blender/build_models.py); sus materiales se sustituyen por la
   * librería PBR. `polyhaven`: modelo CC0 con sus propias texturas.
   */
  source: 'blender' | 'polyhaven'
  surfaces?: Record<string, Surface>
  anchors?: Record<string, Vec3>
}

/*
 * Catálogo de mobiliario 3D. Las superficies y anclajes de los modelos de Blender se
 * corresponden con las cotas de blender/build_models.py (Blender Z-arriba → three Y-arriba:
 * [x, y, z]_three = [x, z, −y]_blender).
 */
export const MODELS = {
  vitrinaRefrigerada: {
    label: 'Vitrina refrigerada 1,5 m',
    file: 'custom/vitrina_refrigerada.glb',
    source: 'blender',
    surfaces: { bandeja: { center: [0, 0.87, 0.08], size: [1.4, 0.55] } },
  },
  vitrinaCaliente: {
    label: 'Expositor calefactado',
    file: 'custom/vitrina_caliente.glb',
    source: 'blender',
    surfaces: {
      inferior: { center: [0, 0.085, 0], size: [0.64, 0.39] },
      superior: { center: [0, 0.285, -0.03], size: [0.64, 0.31] },
    },
  },
  freidora: { label: 'Freidora profesional', file: 'custom/freidora.glb', source: 'blender' },
  jamonero: {
    label: 'Jamonero de roble',
    file: 'custom/jamonero.glb',
    source: 'blender',
    anchors: { cuna: [-0.14, 0.17, 0], mordaza: [0.21, 0.3, 0] },
  },

  tabureteBarra: {
    label: 'Taburete de barra',
    file: 'ph/bar_chair_round_01.glb',
    source: 'polyhaven',
  },
  tabureteMetal: {
    label: 'Taburete industrial',
    file: 'ph/metal_stool_02.glb',
    source: 'polyhaven',
  },
  pizarra: {
    label: 'Pizarra de caballete',
    file: 'ph/standing_chalkboard_01.glb',
    source: 'polyhaven',
  },
  cesta: { label: 'Cesta de mimbre', file: 'ph/wicker_basket_01.glb', source: 'polyhaven' },
  botellasVino: { label: 'Botellas de vino', file: 'ph/wine_bottles_01.glb', source: 'polyhaven' },
  barrica: { label: 'Barrica de roble', file: 'ph/wine_barrel_01.glb', source: 'polyhaven' },
  cajaQueso: { label: 'Caja de queso', file: 'ph/CheeseBox_01.glb', source: 'polyhaven' },
  cajaMadera: { label: 'Caja de madera', file: 'ph/wooden_crate_01.glb', source: 'polyhaven' },
  tablaServir: {
    label: 'Tabla de servir',
    file: 'ph/carved_wooden_plate.glb',
    source: 'polyhaven',
  },
  cuenco: { label: 'Cuenco de madera', file: 'ph/wooden_bowl_01.glb', source: 'polyhaven' },
  planta: { label: 'Planta en maceta', file: 'ph/potted_plant_02.glb', source: 'polyhaven' },
  plantaAlta: { label: 'Planta alta', file: 'ph/potted_plant_04.glb', source: 'polyhaven' },
  lamparaColgante: {
    label: 'Lámpara colgante',
    file: 'ph/modern_ceiling_lamp_01.glb',
    source: 'polyhaven',
  },
  jarra: { label: 'Jarra de cerámica', file: 'ph/jug_01.glb', source: 'polyhaven' },
} as const satisfies Record<string, ModelEntry>

export type ModelKey = keyof typeof MODELS

export const MODEL_KEYS = Object.keys(MODELS) as ModelKey[]

export const modelUrl = (key: ModelKey) => asset(`models/${MODELS[key].file}`)
