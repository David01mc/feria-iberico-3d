import { useMemo } from 'react'
import { center, depth, width } from '../../config/geometry'
import type { HallConfig } from '../../config/types'
import { mergeBoxes, worldPlane, type BoxPart } from '../../materials/geometry'
import { PBR, usePbr } from '../../materials/pbr'
import { ribbedPanelBump } from '../../materials/procedural'

const WALL_T = 0.4
/** Altura del zócalo de hormigón; por encima, panel sándwich grecado. */
const PLINTH_H = 4
const ENTRANCE = { width: 10, height: 4.6 }

/** Envolvente del pabellón: solera, muros, cubierta, lucernarios, pilares y acceso. */
export function HallShell({ hall }: { hall: HallConfig }) {
  const { bounds, height } = hall
  const w = width(bounds)
  const d = depth(bounds)
  const [cx, cz] = center(bounds)

  const floorMaps = usePbr(PBR.hallFloor)
  const concreteMaps = usePbr(PBR.wallConcrete)
  const ribs = ribbedPanelBump(4)

  const geometries = useMemo(() => {
    const wallRing = (y0: number, h: number): BoxPart[] => [
      { size: [w + 2 * WALL_T, h, WALL_T], position: [cx, y0 + h / 2, bounds.z0 - WALL_T / 2] },
      { size: [w + 2 * WALL_T, h, WALL_T], position: [cx, y0 + h / 2, bounds.z1 + WALL_T / 2] },
      { size: [WALL_T, h, d], position: [bounds.x0 - WALL_T / 2, y0 + h / 2, cz] },
      { size: [WALL_T, h, d], position: [bounds.x1 + WALL_T / 2, y0 + h / 2, cz] },
    ]

    // Pilares HEB adosados a los muros largos (alineados con las cerchas) y a los testeros.
    const columns: BoxPart[] = []
    const heb = (x: number, z: number, rotationY: number) => {
      columns.push({ size: [0.45, height, 0.04], position: [x, height / 2, z], rotationY })
      columns.push({ size: [0.03, height, 0.42], position: [x, height / 2, z], rotationY })
    }
    for (
      let x = cx - Math.floor((w / 2 - 1) / hall.trussSpacing) * hall.trussSpacing;
      x < bounds.x1;
      x += hall.trussSpacing
    ) {
      heb(x, bounds.z0 + 0.25, 0)
      heb(x, bounds.z1 - 0.25, 0)
    }
    for (let z = bounds.z0 + 6; z < bounds.z1 - 1; z += 6) {
      heb(bounds.x0 + 0.25, z, Math.PI / 2)
      heb(bounds.x1 - 0.25, z, Math.PI / 2)
    }

    // Juntas de retracción de la solera cada 6 m.
    const joints: BoxPart[] = []
    for (let x = bounds.x0 + 6; x < bounds.x1; x += 6) {
      joints.push({ size: [0.012, 0.002, d], position: [x, 0.001, cz] })
    }
    for (let z = bounds.z0 + 6; z < bounds.z1; z += 6) {
      joints.push({ size: [w, 0.002, 0.012], position: [cx, 0.001, z] })
    }

    // Carpintería del acceso acristalado (muro sur).
    const mullions: BoxPart[] = []
    const doorZ = bounds.z1 - 0.06
    for (let i = 0; i <= 8; i++) {
      const x = cx - ENTRANCE.width / 2 + (i * ENTRANCE.width) / 8
      mullions.push({
        size: [0.08, ENTRANCE.height, 0.12],
        position: [x, ENTRANCE.height / 2, doorZ],
      })
    }
    mullions.push({
      size: [ENTRANCE.width + 0.4, 0.3, 0.2],
      position: [cx, ENTRANCE.height + 0.15, doorZ],
    })
    mullions.push({ size: [ENTRANCE.width, 0.06, 0.12], position: [cx, 2.4, doorZ] })

    return {
      floor: worldPlane(w, d, PBR.hallFloor.tile),
      plinth: mergeBoxes(wallRing(0, PLINTH_H), PBR.wallConcrete.tile),
      cladding: mergeBoxes(wallRing(PLINTH_H, height - PLINTH_H), 1),
      roof: worldPlane(w, d, 1),
      columns: mergeBoxes(columns),
      joints: mergeBoxes(joints),
      mullions: mergeBoxes(mullions),
    }
  }, [bounds, cx, cz, d, height, w, hall.trussSpacing])

  return (
    <group name="hall-shell">
      <mesh
        geometry={geometries.floor}
        rotation-x={-Math.PI / 2}
        position={[cx, 0, cz]}
        receiveShadow
      >
        <meshStandardMaterial
          {...floorMaps}
          color="#c4c0b8"
          roughness={0.82}
          normalScale={[0.5, 0.5]}
          envMapIntensity={0.8}
        />
      </mesh>
      <mesh geometry={geometries.joints}>
        <meshStandardMaterial color="#5f5a53" roughness={1} />
      </mesh>

      <mesh geometry={geometries.plinth} receiveShadow>
        <meshStandardMaterial {...concreteMaps} color="#b3aea5" roughness={1} />
      </mesh>
      <mesh geometry={geometries.cladding}>
        <meshStandardMaterial
          color="#d9dcdf"
          roughness={0.55}
          metalness={0.25}
          bumpMap={ribs}
          bumpScale={2.5}
        />
      </mesh>

      <mesh geometry={geometries.roof} rotation-x={Math.PI / 2} position={[cx, height, cz]}>
        <meshStandardMaterial
          color="#8d9297"
          roughness={0.6}
          metalness={0.3}
          bumpMap={ribs}
          bumpScale={2}
        />
      </mesh>
      {/* Lucernarios longitudinales sobre los pasillos norte y sur. */}
      {[-9.5, 9.5].map((z) => (
        <mesh key={z} rotation-x={Math.PI / 2} position={[cx, height - 0.05, z]}>
          <planeGeometry args={[w - 10, 2.2]} />
          <meshStandardMaterial color="#000000" emissive="#f6f7f8" emissiveIntensity={1.6} />
        </mesh>
      ))}

      <mesh geometry={geometries.columns} castShadow>
        <meshStandardMaterial vertexColors color="#d4d6d8" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Acceso principal: luz de día entrando por la fachada acristalada. */}
      <mesh position={[cx, ENTRANCE.height / 2, bounds.z1 - 0.02]} rotation-y={Math.PI}>
        <planeGeometry args={[ENTRANCE.width, ENTRANCE.height]} />
        <meshStandardMaterial color="#000000" emissive="#f3efe6" emissiveIntensity={1.35} />
      </mesh>
      <mesh geometry={geometries.mullions}>
        <meshStandardMaterial vertexColors color="#3a3d41" roughness={0.4} metalness={0.7} />
      </mesh>
    </group>
  )
}
