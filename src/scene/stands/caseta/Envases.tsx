import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  CylinderGeometry,
  Euler,
  Matrix4,
  MeshPhysicalMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type InstancedMesh,
  type Material,
} from 'three'
import type { Vec3 } from '../../../materials/geometry'
import type { Placement } from '../../products/arrange'
import {
  cheeseLabelTexture,
  cheeseRindTexture,
  frozenTexture,
  packTexture,
  type FrozenKind,
  type PackKind,
} from './textures'

/*
 * Envases de Piel de Toro como cajas con su etiqueta: bandejas de plástico transparente con el
 * producto a la vista, loncheados, el queso de cabra al vino en rueda y las cajas congeladas.
 * Cada tipo es una malla instanciada con un material por cara.
 */

/** Tamaño [ancho, alto, fondo] de cada envase expuesto de pie, con la etiqueta al frente (+z). */
export const PACK_SIZE: Record<PackKind, Vec3> = {
  gourmet: [0.13, 0.25, 0.035],
  serrano: [0.15, 0.18, 0.012],
  fiesta: [0.25, 0.17, 0.045],
  rolls: [0.2, 0.115, 0.035],
}

/** Color de los cantos de cada envase (plástico claro o cartón de la marca). */
const PACK_EDGE: Record<PackKind, string> = {
  gourmet: '#dfe4e4',
  serrano: '#8a0d14',
  fiesta: '#dfe4e4',
  rolls: '#dfe4e4',
}

export const CHEESE = { radius: 0.1, thickness: 0.09 }
export const FROZEN_SIZE: Vec3 = [0.22, 0.05, 0.16]

function useInstanced(items: Placement[]) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new Matrix4()
    const q = new Quaternion()
    const e = new Euler()
    const s = new Vector3(1, 1, 1)
    const p = new Vector3()
    items.forEach((item, i) => {
      q.setFromEuler(e.set(...(item.rotation ?? [0, 0, 0])))
      mesh.setMatrixAt(i, m.compose(p.set(...item.position), q, s))
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])
  return ref
}

function Instances({
  geometry,
  materials,
  items,
}: {
  geometry: BufferGeometry
  materials: Material[]
  items: Placement[]
}) {
  const ref = useInstanced(items)
  useEffect(
    () => () => {
      geometry.dispose()
      new Set(materials).forEach((m) => m.dispose())
    },
    [geometry, materials],
  )
  if (items.length === 0) return null
  return (
    <instancedMesh
      key={items.length}
      ref={ref}
      args={[geometry, materials, items.length]}
      castShadow
      receiveShadow
    />
  )
}

const plastic = (color: string) =>
  new MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 })

/** Envases de pie: `position` es el centro de la base, la etiqueta mira a +z. */
export function PackInstances({ kind, items }: { kind: PackKind; items: Placement[] }) {
  const [w, h, d] = PACK_SIZE[kind]
  const geometry = useMemo(() => new BoxGeometry(w, h, d).translate(0, h / 2, 0), [w, h, d])
  const materials = useMemo(() => {
    const edge = plastic(PACK_EDGE[kind])
    const label = new MeshPhysicalMaterial({
      map: packTexture(kind),
      roughness: 0.35,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
    })
    return [edge, edge, edge, edge, label, edge]
  }, [kind])
  return <Instances geometry={geometry} materials={materials} items={items} />
}

/** Queso de cabra al vino en rueda, de canto y con la etiqueta redonda al frente (+z). */
export function CheeseWheels({ items }: { items: Placement[] }) {
  const { radius, thickness } = CHEESE
  const geometry = useMemo(
    () =>
      new CylinderGeometry(radius, radius, thickness, 48)
        .rotateX(Math.PI / 2)
        .translate(0, radius, 0),
    [radius, thickness],
  )
  const materials = useMemo(() => {
    const rind = cheeseRindTexture().clone()
    rind.repeat.set(3, 1)
    rind.needsUpdate = true
    const side = new MeshPhysicalMaterial({ map: rind, roughness: 0.7 })
    const label = new MeshPhysicalMaterial({
      map: cheeseLabelTexture(),
      roughness: 0.4,
      clearcoat: 0.5,
    })
    // Tras girar el cilindro, la tapa superior (+y) queda mirando a +z.
    return [side, label, side]
  }, [])
  return <Instances geometry={geometry} materials={materials} items={items} />
}

/** Cajas de tapas congeladas tumbadas (etiqueta en la tapa, se ven a través del arcón). */
export function FrozenBoxes({ kind, items }: { kind: FrozenKind; items: Placement[] }) {
  const [w, h, d] = FROZEN_SIZE
  const geometry = useMemo(() => new BoxGeometry(w, h, d).translate(0, h / 2, 0), [w, h, d])
  const materials = useMemo(() => {
    const edge = plastic('#8a0d14')
    const top = new MeshPhysicalMaterial({ map: frozenTexture(kind), roughness: 0.45 })
    return [edge, edge, top, edge, edge, edge]
  }, [kind])
  return <Instances geometry={geometry} materials={materials} items={items} />
}
