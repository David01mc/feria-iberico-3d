import { useLoader, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import { NoColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import { QUALITY } from '../render/quality'
import { useAppStore } from '../state/store'
import { asset } from './assets'
import { ktx2Loader } from './ktx2'

/**
 * Conjunto de texturas PBR descargado (ver scripts/assets.manifest.json), publicado en KTX2.
 * - `arm`: Poly Haven, un único mapa empaquetado (R = AO, G = rugosidad, B = metal).
 * - `split`: ambientCG, mapas de rugosidad y AO por separado.
 */
export interface PbrSet {
  id: string
  /** Metros que cubre una repetición de la textura (ver materials/geometry.ts). */
  tile: number
  kind: 'arm' | 'split'
  /** `false`: sin mapa de color; solo se aprovecha el relieve y el material se tiñe con `color`. */
  albedo?: false
}

export const PBR = {
  hallFloor: { id: 'concrete_floor_02', tile: 3.5, kind: 'arm' },
  // El albedo original trae manchas de pintura verde.
  wallConcrete: { id: 'painted_concrete', tile: 3, kind: 'arm', albedo: false },
  carpet: { id: 'Carpet012', tile: 1.2, kind: 'split', albedo: false },
  oak: { id: 'oak_veneer_01', tile: 1.5, kind: 'arm' },
  deck: { id: 'wood_floor_deck', tile: 2, kind: 'arm' },
  roughWood: { id: 'rough_wood', tile: 1.5, kind: 'arm' },
  darkWood: { id: 'dark_wood', tile: 1.5, kind: 'arm' },
  plaster: { id: 'plastered_wall', tile: 2.5, kind: 'arm' },
  brick: { id: 'red_brick_03', tile: 2, kind: 'arm' },
  tiles: { id: 'interior_tiles', tile: 1, kind: 'arm' },
  terracotta: { id: 'terracotta_floor_tiles', tile: 1.5, kind: 'arm' },
  hessian: { id: 'hessian_230', tile: 0.6, kind: 'arm' },
  // El albedo original es un lino azul: se tiñe de crudo en la librería.
  linen: { id: 'rough_linen', tile: 0.8, kind: 'arm', albedo: false },
} as const satisfies Record<string, PbrSet>

export interface PbrMaps {
  map?: Texture
  normalMap: Texture
  roughnessMap: Texture
  aoMap: Texture
}

function texturePaths(
  set: PbrSet,
): Record<keyof PbrMaps, string> | Omit<Record<keyof PbrMaps, string>, 'map'> {
  const file = (name: string) => asset(`textures/${set.id}/${name}.ktx2`)
  const maps = {
    normalMap: file('nor'),
    roughnessMap: file(set.kind === 'arm' ? 'arm' : 'rough'),
    aoMap: file(set.kind === 'arm' ? 'arm' : 'ao'),
  }
  return set.albedo === false ? maps : { map: file('diff'), ...maps }
}

/** Ficheros distintos de un conjunto: el ARM hace de rugosidad y de AO y se carga una sola vez. */
const uniqueFiles = (set: PbrSet) => [...new Set(Object.values(texturePaths(set)))]

/**
 * Carga (con caché) los mapas de un conjunto PBR, listos para esparcir en un
 * `meshStandardMaterial`.
 */
export function usePbr(set: PbrSet): PbrMaps {
  const gl = useThree((s) => s.gl)
  const quality = useAppStore((s) => s.quality)
  const anisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), QUALITY[quality].anisotropy)
  const files = useMemo(() => uniqueFiles(set), [set])
  const loaded = useLoader(ktx2Loader, files)
  const textures = useMemo(() => {
    const byFile = new Map(files.map((file, i) => [file, loaded[i]]))
    return Object.fromEntries(
      Object.entries(texturePaths(set)).map(([key, file]) => [key, byFile.get(file)]),
    ) as unknown as PbrMaps
  }, [set, files, loaded])

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

/** Pide los mapas de un conjunto con la misma clave de caché que `usePbr`. */
export const preloadPbr = (set: PbrSet) => useLoader.preload(ktx2Loader, uniqueFiles(set))
