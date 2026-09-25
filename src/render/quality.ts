export type QualityLevel = 'alta' | 'media' | 'baja'

/** De mayor a menor coste; el monitor de rendimiento baja un escalón cada vez. */
export const QUALITY_ORDER: readonly QualityLevel[] = ['alta', 'media', 'baja']

export interface QualityPreset {
  label: string
  dpr: [min: number, max: number]
  shadowMapSize: number
  ao: boolean
  aoQuality: 'performance' | 'low' | 'medium' | 'high' | 'ultra'
  aoHalfRes: boolean
  bloom: boolean
  anisotropy: number
}

export const QUALITY: Record<QualityLevel, QualityPreset> = {
  alta: {
    label: 'Alta',
    dpr: [1, 1.5],
    shadowMapSize: 4096,
    ao: true,
    aoQuality: 'medium',
    aoHalfRes: false,
    bloom: true,
    anisotropy: 8,
  },
  media: {
    label: 'Media',
    dpr: [1, 1.25],
    shadowMapSize: 2048,
    ao: true,
    aoQuality: 'medium',
    aoHalfRes: true,
    bloom: true,
    anisotropy: 4,
  },
  baja: {
    label: 'Baja',
    dpr: [0.8, 1],
    shadowMapSize: 1024,
    ao: false,
    aoQuality: 'low',
    aoHalfRes: true,
    bloom: false,
    anisotropy: 2,
  },
}
