import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import type { BufferGeometry, Material, Mesh } from 'three'
import { boxProjectUV, type Vec3 } from '../../materials/geometry'
import { isMaterialKey, tileOf, useMaterials, useTintedMaterial } from '../../materials/library'
import { MODELS, modelUrl, type ModelKey } from './catalog'

/** Geometrías con UV reproyectadas, compartidas entre instancias del mismo modelo. */
const projectedCache = new WeakMap<BufferGeometry, Map<number, BufferGeometry>>()

function projected(geometry: BufferGeometry, tile: number): BufferGeometry {
  let byTile = projectedCache.get(geometry)
  if (!byTile) projectedCache.set(geometry, (byTile = new Map()))
  let result = byTile.get(tile)
  if (!result) byTile.set(tile, (result = boxProjectUV(geometry.clone(), tile)))
  return result
}

export interface PropProps {
  model: ModelKey
  position?: Vec3
  rotationY?: number
  scale?: number | Vec3
  /** Color corporativo para las piezas `brand` de los muebles a medida. */
  brandColor?: string
  castShadow?: boolean
}

/**
 * Instancia un mueble del catálogo. En los modelos de Blender sustituye cada material por el
 * de la librería con el mismo nombre (reproyectando UV a escala real) y tiñe las piezas `brand`.
 */
export function Prop({
  model,
  position,
  rotationY = 0,
  scale = 1,
  brandColor = '#8c8c8c',
  castShadow = true,
}: PropProps) {
  const { scene } = useGLTF(modelUrl(model))
  const library = useMaterials()
  const brand = useTintedMaterial('lacquerWhite', brandColor)
  const remap = MODELS[model].source === 'blender'

  const object = useMemo(() => {
    const root = scene.clone(true)
    root.traverse((node) => {
      const mesh = node as Mesh
      if (!mesh.isMesh) return
      if (remap) {
        const name = (mesh.material as Material).name
        const replacement = name === 'brand' ? brand : isMaterialKey(name) ? library[name] : null
        if (replacement) {
          mesh.material = replacement
          if (replacement.userData.tile)
            mesh.geometry = projected(mesh.geometry, tileOf(replacement))
        }
      }
      mesh.castShadow = castShadow && !(mesh.material as Material).userData.noShadow
      mesh.receiveShadow = true
    })
    return root
  }, [scene, library, brand, remap, castShadow])

  return <primitive object={object} position={position} rotation-y={rotationY} scale={scale} />
}

export const preloadProp = (model: ModelKey) => useGLTF.preload(modelUrl(model))
