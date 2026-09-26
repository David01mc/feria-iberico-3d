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
   * librería PBR. `polyhaven`: modelo CC0 con sus propias texturas. `macetas`: plantas
   * compuestas o modeladas en blender/macetas.py; también conservan sus materiales.
   */
  source: 'blender' | 'polyhaven' | 'macetas'
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
  plantaGrande: {
    label: 'Planta grande en maceta de barro',
    file: 'ph/potted_plant_01.glb',
    source: 'polyhaven',
  },
  lamparaColgante: {
    label: 'Lámpara colgante',
    file: 'ph/modern_ceiling_lamp_01.glb',
    source: 'polyhaven',
  },
  jarra: { label: 'Jarra de cerámica', file: 'ph/jug_01.glb', source: 'polyhaven' },

  // ── Espacio Maridaje (blender/models_maridaje.py) ──
  copaVino: { label: 'Copa de vino tinto', file: 'custom/copa_vino.glb', source: 'blender' },
  vasoSidra: { label: 'Vaso de sidra', file: 'custom/vaso_sidra.glb', source: 'blender' },
  vasoCerveza: { label: 'Caña de cerveza', file: 'custom/vaso_cerveza.glb', source: 'blender' },
  torreGrifos: {
    label: 'Torre de tiro de tres grifos',
    file: 'custom/torre_grifos.glb',
    source: 'blender',
  },
  barrilCerveza: { label: 'Barril de 30 l', file: 'custom/barril_cerveza.glb', source: 'blender' },
  barraFacetada: {
    label: 'Barra facetada de sidrería',
    file: 'custom/barra_facetada.glb',
    source: 'blender',
    surfaces: { tapa: { center: [0, 1.1, 0.01], size: [1.9, 0.75] } },
  },
  mostradorCajon: {
    label: 'Mostrador de cajón de pino',
    file: 'custom/mostrador_cajon.glb',
    source: 'blender',
    surfaces: { tapa: { center: [0, 1.0, 0], size: [1.05, 0.55] } },
  },
  pale: { label: 'Palé europeo', file: 'custom/pale.glb', source: 'blender' },
  sofa: { label: 'Sofá de cuero negro', file: 'custom/sofa.glb', source: 'blender' },
  butaca: { label: 'Butaca de cuero negro', file: 'custom/butaca.glb', source: 'blender' },
  mesaBaja: {
    label: 'Mesa baja lacada',
    file: 'custom/mesa_baja.glb',
    source: 'blender',
    surfaces: { tapa: { center: [0, 0.4, 0], size: [0.85, 0.5] } },
  },
  urna: {
    label: 'Urna de metacrilato',
    file: 'custom/urna_metacrilato.glb',
    source: 'blender',
    surfaces: { peana: { center: [0, 0.02, 0], size: [0.24, 0.24] } },
  },
  tabureteTapizado: {
    label: 'Taburete tapizado',
    file: 'custom/taburete_tapizado.glb',
    source: 'blender',
  },

  // ── Caseta de Piel de Toro (blender/models_caseta.py) ──
  paellero: {
    label: 'Paellero de gas de sobremesa',
    file: 'custom/paellero.glb',
    source: 'blender',
    surfaces: { quemador: { center: [0, 0.12, 0], size: [0.46, 0.46] } },
  },
  arconCongelador: {
    label: 'Arcón congelador con tapas de cristal',
    file: 'custom/arcon_congelador.glb',
    source: 'blender',
    surfaces: { fondo: { center: [0, 0.5, 0], size: [1.18, 0.56] } },
  },

  // ── Macetas (blender/macetas.py): variedad para no repetir la misma planta en toda la feria ──
  macetaCalathea: {
    label: 'Calathea en jarrón blanco',
    file: 'macetas/maceta_calathea.glb',
    source: 'macetas',
  },
  macetaAnthurium: {
    label: 'Anthurium en jarrón de loza azul',
    file: 'macetas/maceta_anthurium.glb',
    source: 'macetas',
  },
  macetaHelecho: {
    label: 'Helecho en jarrón alto',
    file: 'macetas/maceta_helecho.glb',
    source: 'macetas',
  },
  arbolDinero: {
    label: 'Árbol del dinero en macetero',
    file: 'macetas/arbol_dinero.glb',
    source: 'macetas',
  },
  macetaGeranios: {
    label: 'Geranios en maceta de barro',
    file: 'macetas/maceta_geranios.glb',
    source: 'macetas',
  },
  /** Origen en la pared (z = 0) y la maceta hacia +z. */
  macetaGeraniosPared: {
    label: 'Geranios en maceta azul de pared',
    file: 'macetas/maceta_geranios_pared.glb',
    source: 'macetas',
  },
  olivo: { label: 'Olivo en maceta', file: 'macetas/olivo.glb', source: 'macetas' },
  limonero: { label: 'Limonero en maceta', file: 'macetas/limonero.glb', source: 'macetas' },
  /** Plantas del jardín vertical (2,7 × 1,95 m): origen en la pared, centro del borde inferior. */
  jardinVertical: {
    label: 'Plantas de jardín vertical',
    file: 'macetas/jardin_vertical.glb',
    source: 'macetas',
  },
} as const satisfies Record<string, ModelEntry>

export type ModelKey = keyof typeof MODELS

export const MODEL_KEYS = Object.keys(MODELS) as ModelKey[]

export const modelUrl = (key: ModelKey) => asset(`models/${MODELS[key].file}`)
