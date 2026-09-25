import { useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import { NoColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import { QUALITY } from '../render/quality'
import { useAppStore } from '../state/store'
import { asset } from './assets'

/**
 * Conjunto de texturas PBR descargado (ver scripts/assets.manifest.json).
 * - `arm`: Poly Haven, un único mapa empaquetado (R = AO, G = rugosidad, B = metal).
 * - `split`: ambientCG, mapas de rugosidad y AO por separado.
 */
export interface PbrSet {
  id: string
  /** Metros que cubre una repetición de la textura (ver materials/geometry.ts). */
  tile: number
  kind: 'arm' | 'split'
}

export const PBR = {
  hallFloor: { id: 'concrete_floor_02', tile: 3.5, kind: 'arm' },
  wallConcrete: { id: 'painted_concrete', tile: 3, kind: 'arm' },
  carpet: { id: 'Carpet012', tile: 1.2, kind: 'split' },
  oak: { id: 'oak_veneer_01', tile: 1.5, kind: 'arm' },
  deck: { id: 'wood_floor_deck', tile: 2, kind: 'arm' },
  roughWood: { id: 'rough_wood', tile: 1.5, kind: 'arm' },
  darkWood: { id: 'dark_wood', tile: 1.5, kind: 'arm' },
  plaster: { id: 'plastered_wall', tile: 2.5, kind: 'arm' },
  brick: { id: 'red_brick_03', tile: 2, kind: 'arm' },
  tiles: { id: 'interior_tiles', tile: 1, kind: 'arm' },
  terracotta: { id: 'terracotta_floor_tiles', tile: 1.5, kind: 'arm' },
  hessian: { id: 'hessian_230', tile: 0.6, kind: 'arm' },
  linen: { id: 'rough_linen', tile: 0.8, kind: 'arm' },
} as const satisfies Record<string, PbrSet>

export interface PbrMaps {
  map?: Texture
  normalMap: Texture
  roughnessMap: Texture
  aoMap: Texture
}

function texturePaths(
  set: PbrSet,
  withColor: boolean,
): Record<keyof PbrMaps, string> | Omit<Record<keyof PbrMaps, string>, 'map'> {
  const file = (name: string) => asset(`textures/${set.id}/${name}.jpg`)
  const maps = {
    normalMap: file('nor'),
    roughnessMap: file(set.kind === 'arm' ? 'arm' : 'rough'),
    aoMap: file(set.kind === 'arm' ? 'arm' : 'ao'),
  }
  return withColor ? { map: file('diff'), ...maps } : maps
}

/**
 * Carga (con caché) los mapas de un conjunto PBR, listos para esparcir en un
 * `meshStandardMaterial`. `color: false` omite el albedo para teñir con `color`.
 */
export function usePbr(set: PbrSet, { color = true }: { color?: boolean } = {}): PbrMaps {
  const gl = useThree((s) => s.gl)
  const quality = useAppStore((s) => s.quality)
  const anisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), QUALITY[quality].anisotropy)
  const paths = useMemo(() => texturePaths(set, color), [set, color])
  const textures = useTexture(paths) as unknown as PbrMaps

  useLayoutEffect(() => {
    for (const [key, texture] of Object.entries(textures) as [keyof PbrMaps, Texture][]) {
      texture.wrapS = texture.wrapT = RepeatWrapping
      texture.colorSpace = key === 'map' ? SRGBColorSpace : NoColorSpace
      texture.anisotropy = anisotropy
      texture.needsUpdate = true
    }
  }, [textures, anisotropy])

  return textures
}
