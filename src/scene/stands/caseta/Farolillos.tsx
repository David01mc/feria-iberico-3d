import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  CatmullRomCurve3,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type InstancedMesh,
} from 'three'
import type { Vec3 } from '../../../materials/geometry'
import { LANTERN_STYLES, lanternTexture, type LanternStyle } from './textures'

const RADIUS = 0.13

export interface Garland {
  from: Vec3
  to: Vec3
  /** Cuánto cuelga el cable en el centro (m). */
  sag: number
}

/** Punto del cable (parábola con la flecha en el centro), t ∈ [0, 1]. */
function along({ from, to, sag }: Garland, t: number): Vector3 {
  return new Vector3(
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t - 4 * sag * t * (1 - t),
    from[2] + (to[2] - from[2]) * t,
  )
}

/**
 * Guirnaldas de farolillos de papel: cable con catenaria y farolillos rojos, blancos y naranjas
 * alternos, que brillan un poco como si llevaran bombilla. Tres mallas instanciadas en total.
 */
export function Farolillos({
  garlands,
  spacing = 0.36,
}: {
  garlands: Garland[]
  spacing?: number
}) {
  const { byStyle, cables } = useMemo(() => {
    const byStyle: Record<LanternStyle, Vector3[]> = { rojo: [], blanco: [], naranja: [] }
    const cables: Vector3[][] = []
    let k = 0
    for (const g of garlands) {
      const length = new Vector3(...g.from).distanceTo(new Vector3(...g.to))
      const count = Math.max(2, Math.round(length / spacing))
      for (let i = 1; i < count; i++) {
        const p = along(g, i / count)
        p.y -= RADIUS * 0.95
        byStyle[LANTERN_STYLES[k++ % LANTERN_STYLES.length]!].push(p)
      }
      cables.push(Array.from({ length: 13 }, (_, i) => along(g, i / 12)))
    }
    return { byStyle, cables }
  }, [garlands, spacing])

  const cableGeometries = useMemo(
    () => cables.map((pts) => new TubeGeometry(new CatmullRomCurve3(pts), 24, 0.004, 5)),
    [cables],
  )
  useEffect(() => () => cableGeometries.forEach((c) => c.dispose()), [cableGeometries])
  const cableMaterial = useMemo(
    () => new MeshStandardMaterial({ color: '#2b2b2b', roughness: 0.6 }),
    [],
  )
  useEffect(() => () => cableMaterial.dispose(), [cableMaterial])

  return (
    <group name="farolillos">
      {cableGeometries.map((geometry, i) => (
        <mesh key={i} geometry={geometry} material={cableMaterial} />
      ))}
      {LANTERN_STYLES.map((style) => (
        <LanternInstances key={style} style={style} positions={byStyle[style]} />
      ))}
    </group>
  )
}

function LanternInstances({ style, positions }: { style: LanternStyle; positions: Vector3[] }) {
  const ref = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => new SphereGeometry(RADIUS, 28, 18).scale(1, 0.86, 1), [])
  const material = useMemo(() => {
    const map = lanternTexture(style)
    return new MeshStandardMaterial({
      map,
      emissiveMap: map,
      emissive: '#ffffff',
      emissiveIntensity: 0.32,
      roughness: 0.9,
    })
  }, [style])
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new Object3D()
    positions.forEach((p, i) => {
      dummy.position.copy(p)
      // Cada farolillo gira un poco sobre su eje: los lunares no se alinean.
      dummy.rotation.set(0, i * 2.39, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [positions])

  if (positions.length === 0) return null
  return (
    <instancedMesh
      key={positions.length}
      ref={ref}
      args={[geometry, material, positions.length]}
      castShadow={false}
    />
  )
}
