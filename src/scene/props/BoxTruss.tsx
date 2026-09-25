import { useLayoutEffect, useMemo, useRef } from 'react'
import { Matrix4, Vector3, type InstancedMesh } from 'three'
import { beamMatrix, type Vec3 } from '../../materials/geometry'
import { resolveMaterial, useMaterials, type MaterialRef } from '../../materials/library'

const CHORD_D = 0.048
const LACING_D = 0.018
const LACING_STEP = 0.5

/**
 * Barras de una celosía cuadrada de aluminio (truss de 29 cm, el estándar de las ferias):
 * cuatro cordones y un zigzag de diagonales en cada cara.
 */
export function trussMembers(a: Vector3, b: Vector3, size: number): Matrix4[] {
  const dir = new Vector3().subVectors(b, a)
  const length = dir.length()
  dir.normalize()
  const helper = Math.abs(dir.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0)
  const u = new Vector3().crossVectors(dir, helper).normalize()
  const v = new Vector3().crossVectors(dir, u)
  const h = size / 2 - CHORD_D / 2
  const corners = [
    [h, h],
    [h, -h],
    [-h, -h],
    [-h, h],
  ].map(([cu, cv]) => new Vector3().addScaledVector(u, cu!).addScaledVector(v, cv!))

  const at = (corner: Vector3, t: number) => a.clone().addScaledVector(dir, t).add(corner)
  const members: Matrix4[] = corners.map((c) => beamMatrix(at(c, 0), at(c, length), CHORD_D))

  const segments = Math.max(1, Math.round(length / LACING_STEP))
  const step = length / segments
  corners.forEach((corner, k) => {
    const next = corners[(k + 1) % corners.length]!
    for (let i = 0; i < segments; i++) {
      const [from, to] = i % 2 === 0 ? [corner, next] : [next, corner]
      members.push(beamMatrix(at(from, i * step), at(to, (i + 1) * step), LACING_D))
    }
  })
  return members
}

export interface BoxTrussProps {
  from: Vec3
  to: Vec3
  size?: number
  material?: MaterialRef
}

/** Tramo recto de truss entre dos puntos (una sola llamada de dibujo). */
export function BoxTruss({ from, to, size = 0.29, material = 'aluminium' }: BoxTrussProps) {
  const library = useMaterials()
  const ref = useRef<InstancedMesh>(null)
  const [ax, ay, az] = from
  const [bx, by, bz] = to
  const members = useMemo(
    () => trussMembers(new Vector3(ax, ay, az), new Vector3(bx, by, bz), size),
    [ax, ay, az, bx, by, bz, size],
  )

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    members.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [members])

  return (
    <instancedMesh
      key={members.length}
      ref={ref}
      args={[undefined, undefined, members.length]}
      material={resolveMaterial(library, material)}
      castShadow
    >
      <cylinderGeometry args={[0.5, 0.5, 1, 10]} />
    </instancedMesh>
  )
}

export interface TrussFrameProps {
  width: number
  depth: number
  height: number
  position?: Vec3
  rotationY?: number
}

/** Pórtico de truss: cuatro patas con placa base y un marco superior (el "techo" técnico de un stand). */
export function TrussFrame({ width, depth, height, position, rotationY = 0 }: TrussFrameProps) {
  const library = useMaterials()
  const x = width / 2
  const z = depth / 2
  const top = height - 0.145
  const legs: Vec3[] = [
    [-x, 0, -z],
    [x, 0, -z],
    [x, 0, z],
    [-x, 0, z],
  ]
  return (
    <group position={position} rotation-y={rotationY}>
      {legs.map(([lx, , lz]) => (
        <group key={`${lx}${lz}`}>
          <BoxTruss from={[lx, 0.01, lz]} to={[lx, height, lz]} />
          <mesh position={[lx, 0.005, lz]} material={library.steelBlack} receiveShadow>
            <boxGeometry args={[0.45, 0.01, 0.45]} />
          </mesh>
        </group>
      ))}
      <BoxTruss from={[-x + 0.145, top, -z]} to={[x - 0.145, top, -z]} />
      <BoxTruss from={[-x + 0.145, top, z]} to={[x - 0.145, top, z]} />
      <BoxTruss from={[-x, top, -z + 0.145]} to={[-x, top, z - 0.145]} />
      <BoxTruss from={[x, top, -z + 0.145]} to={[x, top, z - 0.145]} />
    </group>
  )
}
