import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import {
  Box3,
  BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  Sphere,
  Vector3,
  type BufferGeometry,
  type Material,
  type Object3D,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useAppStore } from '../state/store'
import { QUALITY } from './quality'

/*
 * Optimizaciones de escena para equipos modestos, independientes de cada stand:
 * - StaticMerge: fusiona por material la geometría estática de un stand (paredes, tarimas,
 *   mostradores, vigas…) en una sola malla. De cientos de llamadas de dibujo a unas decenas.
 * - DetailCulling: oculta producto y atrezo pequeños cuando la cámara se aleja, según la
 *   calidad. En la vista aérea son píxeles sueltos que cuestan lo mismo que de cerca.
 */

// ── Geometría estática fusionada ──────────────────────────────────────────────

/** Marca un objeto (y su subárbol) para que StaticMerge no lo toque. */
export const NO_MERGE = 'noMerge'
/**
 * Marca un subárbol de atrezo (muebles de GLB): se fusiona aparte, en mallas de detalle que
 * DetailCulling oculta de lejos como si fueran una pieza de medio metro.
 */
export const DETAIL = 'detail'

function mergeable(object: Object3D): object is Mesh {
  const mesh = object as Mesh
  if (!mesh.isMesh || (mesh as { isInstancedMesh?: boolean }).isInstancedMesh) return false
  if (!mesh.visible || Array.isArray(mesh.material) || !mesh.geometry?.attributes.position)
    return false
  const material = mesh.material as Material & { isTroikaTextMaterial?: boolean }
  // Los textos (troika) generan su geometría en diferido; lo transparente necesita su orden.
  return !material.isTroikaTextMaterial && !material.transparent && !('sync' in mesh)
}

const isText = (object: Object3D) =>
  Boolean(((object as Mesh).material as { isTroikaTextMaterial?: boolean })?.isTroikaTextMaterial)

interface Collected {
  fixed: Mesh[]
  detail: Mesh[]
  texts: Object3D[]
}

function collect(object: Object3D, out: Collected, inDetail = false) {
  if (object.userData[NO_MERGE]) return
  const detail = inDetail || Boolean(object.userData[DETAIL])
  if (isText(object)) out.texts.push(object)
  else if (mergeable(object)) (detail ? out.detail : out.fixed).push(object)
  for (const child of object.children) collect(child, out, detail)
}

/** Atributos cuantizados (GLB con KHR_mesh_quantization) a float: fusionables y sin recortes. */
function toFloat(geometry: BufferGeometry) {
  for (const name of KEPT_ATTRIBUTES) {
    const attr = geometry.getAttribute(name)
    if (!attr || (attr.array instanceof Float32Array && !attr.normalized)) continue
    const out = new Float32Array(attr.count * attr.itemSize)
    for (let i = 0; i < attr.count; i++)
      for (let k = 0; k < attr.itemSize; k++) out[i * attr.itemSize + k] = attr.getComponent(i, k)
    geometry.setAttribute(name, new BufferAttribute(out, attr.itemSize))
  }
  return geometry
}

const KEPT_ATTRIBUTES = ['position', 'normal', 'uv']

const signature = (mesh: Mesh) => {
  const g = mesh.geometry
  const attributes = KEPT_ATTRIBUTES.filter((a) => a in g.attributes).join(',')
  const material = (mesh.material as Material).uuid
  return `${material}|${mesh.castShadow}|${mesh.receiveShadow}|${g.index ? 'i' : 'n'}|${attributes}`
}

/**
 * Fusiona la geometría estática de sus hijos en una malla por material (en el primer montaje,
 * cuando todo está cargado). Los originales se ocultan; si el grupo se desmonta, se restauran.
 */
export function StaticMerge({ children, name }: { children: ReactNode; name?: string }) {
  const ref = useRef<Group>(null)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    root.updateWorldMatrix(true, true)
    const toLocal = root.matrixWorld.clone().invert()
    const found: Collected = { fixed: [], detail: [], texts: [] }
    for (const child of root.children) collect(child, found)

    const groups = new Map<string, { detail: boolean; meshes: Mesh[] }>()
    for (const [detail, meshes] of [
      [false, found.fixed],
      [true, found.detail],
    ] as const) {
      for (const mesh of meshes) {
        const key = `${detail}|${signature(mesh)}`
        const group = groups.get(key)
        if (group) group.meshes.push(mesh)
        else groups.set(key, { detail, meshes: [mesh] })
      }
    }
    // Rótulos: cuestan poco (una llamada cada uno) y dan la identidad de cada stand; solo se
    // ocultan los pequeños y muy lejos (4× la distancia de una pieza de su tamaño).
    for (const text of found.texts) {
      text.userData.detailBoost = TEXT_BOOST
      registry.add(text)
    }

    const merged: Mesh[] = []
    const hidden: Mesh[] = []
    const matrix = new Matrix4()
    for (const { detail, meshes: list } of groups.values()) {
      if (list.length < 2) continue
      const geometries = list.map((mesh) => {
        const g = mesh.geometry.clone()
        g.clearGroups()
        for (const attribute of Object.keys(g.attributes))
          if (!KEPT_ATTRIBUTES.includes(attribute)) g.deleteAttribute(attribute)
        return toFloat(g).applyMatrix4(matrix.multiplyMatrices(toLocal, mesh.matrixWorld))
      })
      const geometry = mergeGeometries(geometries, false) as BufferGeometry | null
      geometries.forEach((g) => g.dispose())
      if (!geometry) continue
      const first = list[0]!
      const mesh = new Mesh(geometry, first.material)
      mesh.name = `fusion:${(first.material as Material).name}`
      mesh.castShadow = first.castShadow
      mesh.receiveShadow = first.receiveShadow
      mesh.userData[NO_MERGE] = true
      root.add(mesh)
      merged.push(mesh)
      if (detail) {
        mesh.userData.detailRadius = REFERENCE_RADIUS
        registry.add(mesh)
      }
      for (const original of list) {
        original.visible = false
        hidden.push(original)
      }
    }

    return () => {
      for (const text of found.texts) registry.delete(text)
      for (const mesh of merged) {
        registry.delete(mesh)
        root.remove(mesh)
        mesh.geometry.dispose()
      }
      for (const original of hidden) original.visible = true
    }
  }, [])

  return (
    <group ref={ref} name={name}>
      {children}
    </group>
  )
}

// ── Detalle según la distancia ────────────────────────────────────────────────

/**
 * Piezas de ~0,5 m de radio desaparecen a `detailDistance`; las mayores aguantan en proporción
 * (un olivo se ve más lejos que un taburete) y las diminutas se van antes.
 */
const REFERENCE_RADIUS = 0.5
const TEXT_BOOST = 4

const registry = new Set<Object3D>()
const spheres = new WeakMap<Object3D, Sphere>()

/** Registra un objeto pequeño (producto, atrezo) para ocultarlo de lejos según la calidad. */
export function useDetail(ref: RefObject<Object3D | null>) {
  useEffect(() => {
    const object = ref.current
    if (!object) return
    registry.add(object)
    return () => {
      registry.delete(object)
      spheres.delete(object)
      object.visible = true
    }
  }, [ref])
}

/**
 * Esfera envolvente en coordenadas del mundo. La escena es estática: se calcula una vez (salvo
 * si aún está vacía, como un texto que no ha terminado de maquetarse).
 */
function worldSphere(object: Object3D): Sphere {
  let sphere = spheres.get(object)
  if (!sphere) {
    object.updateWorldMatrix(true, true)
    sphere = new Box3().setFromObject(object).getBoundingSphere(new Sphere())
    if (sphere.radius > 0) spheres.set(object, sphere)
  }
  return sphere
}

export function DetailCulling() {
  const distance = useAppStore((s) => QUALITY[s.quality].detailDistance)
  const last = useRef({ camera: new Matrix4(), distance: -1, size: -1 })
  const eye = useRef(new Vector3())

  useFrame(({ camera }) => {
    const prev = last.current
    if (
      prev.distance === distance &&
      prev.size === registry.size &&
      prev.camera.equals(camera.matrixWorld)
    )
      return
    prev.camera.copy(camera.matrixWorld)
    prev.distance = distance
    prev.size = registry.size
    camera.getWorldPosition(eye.current)
    for (const object of registry) {
      if (!Number.isFinite(distance)) {
        object.visible = true
        continue
      }
      const sphere = worldSphere(object)
      const radius = (object.userData.detailRadius as number | undefined) ?? sphere.radius
      const boost = (object.userData.detailBoost as number | undefined) ?? 1
      const scale = boost * Math.min(5, Math.max(0.5, radius / REFERENCE_RADIUS))
      object.visible = eye.current.distanceTo(sphere.center) - sphere.radius < distance * scale
    }
  })

  return null
}
