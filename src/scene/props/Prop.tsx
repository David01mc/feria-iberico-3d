import { useGLTF } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import type { BufferGeometry, Material, Mesh, MeshPhysicalMaterial, Object3D } from 'three'
import { boxProjectUV, type Vec3 } from '../../materials/geometry'
import { isMaterialKey, tileOf, useMaterials, useTintedMaterial } from '../../materials/library'
import { DETAIL, useDetail } from '../../render/optimize'
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

/**
 * Materiales con transmisión (vidrio, líquidos de los modelos de Poly Haven) convertidos a su
 * equivalente barato: la transmisión real re-renderiza la escena entera en cada fotograma.
 */
const realtimeCache = new WeakMap<Material, Material>()

function realtimeMaterial(material: Material): Material {
  const physical = material as MeshPhysicalMaterial
  if (!physical.transmission) return material
  let result = realtimeCache.get(material)
  if (!result) {
    const copy = physical.clone()
    copy.transmission = 0
    if (/glass/i.test(material.name)) {
      copy.transparent = true
      copy.opacity = 0.45
      copy.depthWrite = false
      copy.userData.noShadow = true
    } else {
      // El vino dentro de la botella: opaco y brillante.
      copy.transparent = false
      copy.roughness = Math.min(copy.roughness, 0.15)
    }
    realtimeCache.set(material, (result = copy))
  }
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
  const ref = useRef<Object3D>(null)
  useDetail(ref)

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
      } else {
        mesh.material = realtimeMaterial(mesh.material as Material)
      }
      mesh.castShadow = castShadow && !(mesh.material as Material).userData.noShadow
      mesh.receiveShadow = true
    })
    // Atrezo: se fusiona aparte y se oculta de lejos (ver StaticMerge y DetailCulling).
    root.userData[DETAIL] = true
    return root
  }, [scene, library, brand, remap, castShadow])

  return (
    <primitive ref={ref} object={object} position={position} rotation-y={rotationY} scale={scale} />
  )
}

export const preloadProp = (model: ModelKey) => useGLTF.preload(modelUrl(model))
