import { useLayoutEffect, useMemo, useRef } from 'react'
import { Matrix4, Object3D, Vector3, type InstancedMesh } from 'three'
import { center, depth, width } from '../../config/geometry'
import type { HallConfig } from '../../config/types'
import { beamMatrix } from '../../materials/geometry'

type Beam = [a: Vector3, b: Vector3, thickness: number]

const PANEL = 3
const LAMP_SPACING_Z = 6

/** Cerchas Pratt, correas, arriostramiento y campanas LED colgadas del cordón inferior. */
export function RoofStructure({ hall }: { hall: HallConfig }) {
  const { bounds, height, trussBottom, trussSpacing } = hall
  const [cx] = center(bounds)

  const { beams, lamps } = useMemo(() => {
    const beams: Beam[] = []
    const lamps: Vector3[] = []
    const top = height - 0.5
    const z0 = bounds.z0
    const z1 = bounds.z1
    const span = depth(bounds)
    const panels = Math.round(span / PANEL)
    const step = span / panels

    const trussXs: number[] = []
    const half = width(bounds) / 2
    for (
      let x = cx - Math.floor((half - 1) / trussSpacing) * trussSpacing;
      x < bounds.x1;
      x += trussSpacing
    ) {
      trussXs.push(x)
    }

    for (const x of trussXs) {
      beams.push([new Vector3(x, trussBottom, z0), new Vector3(x, trussBottom, z1), 0.22])
      beams.push([new Vector3(x, top, z0), new Vector3(x, top, z1), 0.24])
      for (let k = 0; k <= panels; k++) {
        const z = z0 + k * step
        beams.push([new Vector3(x, trussBottom, z), new Vector3(x, top, z), 0.1])
        if (k < panels) {
          const zn = z + step
          const rising = k < panels / 2
          beams.push(
            rising
              ? [new Vector3(x, trussBottom, z), new Vector3(x, top, zn), 0.09]
              : [new Vector3(x, top, z), new Vector3(x, trussBottom, zn), 0.09],
          )
        }
      }
      for (let z = z0 + LAMP_SPACING_Z / 2 + 1.5; z < z1 - 1; z += LAMP_SPACING_Z) {
        lamps.push(new Vector3(x, trussBottom - 0.9, z))
      }
    }

    // Correas longitudinales sobre el cordón superior y arriostramiento inferior.
    const xa = bounds.x0
    const xb = bounds.x1
    for (let k = 0; k <= panels; k++) {
      const z = z0 + k * step
      beams.push([new Vector3(xa, top + 0.2, z), new Vector3(xb, top + 0.2, z), 0.16])
      if (k % 3 === 0)
        beams.push([new Vector3(xa, trussBottom, z), new Vector3(xb, trussBottom, z), 0.07])
    }

    return { beams, lamps }
  }, [bounds, cx, height, trussBottom, trussSpacing])

  const steelRef = useRef<InstancedMesh>(null)
  const housingRef = useRef<InstancedMesh>(null)
  const diffuserRef = useRef<InstancedMesh>(null)
  const rodRef = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const matrix = new Matrix4()
    const dummy = new Object3D()
    beams.forEach(([a, b, t], i) => steelRef.current?.setMatrixAt(i, beamMatrix(a, b, t, matrix)))
    lamps.forEach((p, i) => {
      dummy.position.copy(p)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      housingRef.current?.setMatrixAt(i, dummy.matrix)
      dummy.position.set(p.x, p.y - 0.19, p.z)
      dummy.rotation.set(Math.PI / 2, 0, 0)
      dummy.updateMatrix()
      diffuserRef.current?.setMatrixAt(i, dummy.matrix)
      rodRef.current?.setMatrixAt(
        i,
        beamMatrix(p, new Vector3(p.x, trussBottom, p.z), 0.02, matrix),
      )
    })
    for (const mesh of [steelRef, housingRef, diffuserRef, rodRef]) {
      if (!mesh.current) continue
      mesh.current.instanceMatrix.needsUpdate = true
      mesh.current.computeBoundingSphere()
    }
  }, [beams, lamps, trussBottom])

  return (
    <group name="roof-structure">
      <instancedMesh
        ref={steelRef}
        args={[undefined, undefined, beams.length]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshStandardMaterial color="#e3e5e7" roughness={0.55} metalness={0.35} />
      </instancedMesh>
      <instancedMesh ref={housingRef} args={[undefined, undefined, lamps.length]}>
        <cylinderGeometry args={[0.2, 0.34, 0.38, 24, 1, true]} />
        <meshStandardMaterial color="#2c2f33" roughness={0.45} metalness={0.8} side={2} />
      </instancedMesh>
      <instancedMesh ref={diffuserRef} args={[undefined, undefined, lamps.length]}>
        <circleGeometry args={[0.32, 24]} />
        <meshStandardMaterial color="#000000" emissive="#fff4e0" emissiveIntensity={6} />
      </instancedMesh>
      <instancedMesh ref={rodRef} args={[undefined, undefined, lamps.length]}>
        <boxGeometry />
        <meshStandardMaterial color="#9ca0a4" roughness={0.5} metalness={0.8} />
      </instancedMesh>
    </group>
  )
}
