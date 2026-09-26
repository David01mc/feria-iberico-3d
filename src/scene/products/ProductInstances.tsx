import { useGLTF } from '@react-three/drei'
import { useLayoutEffect, useRef } from 'react'
import {
  Color,
  Euler,
  Matrix4,
  MeshPhysicalMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type InstancedMesh,
  type Material,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
} from 'three'
import { withKTX2 } from '../../materials/ktx2'
import type { Placement } from './arrange'
import {
  PRODUCTS,
  productUrl,
  type ProductEntry,
  type ProductFinish,
  type ProductKey,
} from './catalog'

interface ProductMesh {
  geometry: BufferGeometry
  material: Material
}

/** Malla y material de cada producto, compartidos por todas sus instancias. */
const meshes = new WeakMap<Object3D, ProductMesh>()

/** Material físico con las texturas horneadas y una capa de brillo (grasa, aceite, barniz). */
function withFinish(source: MeshStandardMaterial, finish: ProductFinish): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    name: `${source.name}+acabado`,
    color: source.color.clone(),
    map: source.map,
    normalMap: source.normalMap,
    normalScale: source.normalScale.clone(),
    roughness: source.roughness,
    roughnessMap: source.roughnessMap,
    metalness: source.metalness,
    metalnessMap: source.metalnessMap,
    clearcoat: finish.clearcoat ?? 0,
    clearcoatRoughness: finish.clearcoatRoughness ?? 0.3,
  })
}

/** Extrae la única malla del GLB de un producto (con su transformación aplicada). */
export function useProductMesh(key: ProductKey): ProductMesh {
  const { scene } = useGLTF(productUrl(key), true, true, withKTX2)
  let entry = meshes.get(scene)
  if (!entry) {
    scene.updateMatrixWorld(true)
    let mesh: Mesh | undefined
    scene.traverse((node) => {
      if (!mesh && (node as Mesh).isMesh) mesh = node as Mesh
    })
    if (!mesh) throw new Error(`El modelo del producto "${key}" no contiene ninguna malla`)
    const { finish } = PRODUCTS[key] as ProductEntry
    const source = mesh.material as MeshStandardMaterial
    entry = {
      geometry: mesh.geometry.clone().applyMatrix4(mesh.matrixWorld),
      material: finish ? withFinish(source, finish) : source,
    }
    meshes.set(scene, entry)
  }
  return entry
}

export interface ProductInstancesProps {
  product: ProductKey
  items: Placement[]
  castShadow?: boolean
}

/** Pinta todas las piezas de un producto en una sola llamada de dibujo. */
export function ProductInstances({ product, items, castShadow = true }: ProductInstancesProps) {
  const { geometry, material } = useProductMesh(product)
  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const matrix = new Matrix4()
    const position = new Vector3()
    const rotation = new Quaternion()
    const euler = new Euler()
    const scale = new Vector3()
    const color = new Color()
    const tinted = items.some((item) => item.tint)
    items.forEach((item, i) => {
      position.set(...item.position)
      if (item.quaternion) rotation.set(...item.quaternion)
      else rotation.setFromEuler(euler.set(...(item.rotation ?? [0, 0, 0])))
      scale.setScalar(item.scale ?? 1)
      mesh.setMatrixAt(i, matrix.compose(position, rotation, scale))
      if (tinted) mesh.setColorAt(i, color.set(item.tint ?? '#ffffff'))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])

  if (items.length === 0) return null
  return (
    <instancedMesh
      key={items.length}
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={castShadow}
      receiveShadow
    />
  )
}

/** Los productos llevan sus texturas horneadas en KTX2 (ver scripts/ktx2.mjs). */
export const preloadProduct = (key: ProductKey) =>
  useGLTF.preload(productUrl(key), true, true, withKTX2)
