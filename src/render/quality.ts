export type QualityLevel = 'alta' | 'media' | 'baja'

/** De mayor a menor coste; el monitor de rendimiento baja un escalón cada vez. */
export const QUALITY_ORDER: readonly QualityLevel[] = ['alta', 'media', 'baja']

/**
 * Postproceso: `completo` (oclusión + bloom + gradación + SMAA), `ligero` (sin oclusión) o
 * `ninguno` (el renderer aplica AgX directamente: sin pasadas a pantalla completa).
 */
export type PostLevel = 'completo' | 'ligero' | 'ninguno'

export interface QualityPreset {
  label: string
  dpr: [min: number, max: number]
  shadowMapSize: number
  post: PostLevel
  aoQuality: 'performance' | 'low' | 'medium' | 'high' | 'ultra'
  aoHalfRes: boolean
  anisotropy: number
  /** Focos con luz real: cada uno encarece el sombreado de todos los píxeles de la escena. */
  spotLights: boolean
  /**
   * Distancia (m) a la que se ocultan producto y atrezo de ~0,5 m; las piezas mayores aguantan
   * más en proporción a su tamaño (ver DetailCulling).
   */
  detailDistance: number
}

export const QUALITY: Record<QualityLevel, QualityPreset> = {
  alta: {
    label: 'Alta',
    dpr: [1, 1.5],
    shadowMapSize: 4096,
    post: 'completo',
    aoQuality: 'medium',
    aoHalfRes: false,
    anisotropy: 8,
    spotLights: true,
    detailDistance: Infinity,
  },
  media: {
    label: 'Media',
    dpr: [1, 1.25],
    shadowMapSize: 2048,
    post: 'ligero',
    aoQuality: 'low',
    aoHalfRes: true,
    anisotropy: 4,
    // Medido: los 11 focos reales cuestan ~10 ms por fotograma; solo en alta.
    spotLights: false,
    detailDistance: 32,
  },
  baja: {
    label: 'Baja',
    dpr: [0.75, 0.9],
    shadowMapSize: 1024,
    post: 'ninguno',
    aoQuality: 'low',
    aoHalfRes: true,
    anisotropy: 1,
    spotLights: false,
    detailDistance: 16,
  },
}

const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i
/** Gráficas integradas o de gama baja (Intel HD/UHD, móviles…). Iris Xe y Apple van aparte. */
const LOW_GPU = /intel.*\b(hd|uhd)\b|mali|adreno|powervr|videocore|\bgma\b/i
const MID_GPU = /iris|radeon\(tm\) graphics|radeon graphics|vega \d+ graphics|geforce (mx|gt )/i

function gpuName(): string {
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    if (!gl) return 'sin webgl2'
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const name = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return String(name)
  } catch {
    return ''
  }
}

/**
 * Calidad con la que arranca la feria. `?calidad=alta|media|baja` la fija; si no, se estima con
 * la GPU, los núcleos y la memoria del equipo. Después el monitor de rendimiento sigue bajando
 * escalones si los fps no acompañan; en equipos claramente modestos se empieza ya en baja
 * (una primera impresión a 10 fps es peor que ver menos detalle).
 */
export function initialQuality(): QualityLevel {
  if (typeof window === 'undefined') return 'alta'
  const forced = new URLSearchParams(window.location.search).get('calidad')
  if (forced && (QUALITY_ORDER as readonly string[]).includes(forced)) return forced as QualityLevel

  const gpu = gpuName()
  const cores = navigator.hardwareConcurrency ?? 8
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  const touch = window.matchMedia?.('(pointer: coarse)').matches ?? false

  if (SOFTWARE_GPU.test(gpu) || gpu === 'sin webgl2') return 'baja'
  if (LOW_GPU.test(gpu) || cores <= 4 || memory <= 4 || touch) return 'baja'
  if (MID_GPU.test(gpu) || cores <= 6) return 'media'
  return 'alta'
}
