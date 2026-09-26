import { useMemo } from 'react'
import { center, depth, width } from '../../config/geometry'
import type { HallConfig } from '../../config/types'
import { worldPlane } from '../../materials/geometry'
import { PBR, usePbr } from '../../materials/pbr'

/** Moqueta ferial de pasillos: relieve de fieltro y color definido por la organización. */
export function Carpet({ hall }: { hall: HallConfig }) {
  const maps = usePbr(PBR.carpet)
  const area = hall.exhibitionArea
  const [cx, cz] = center(area)
  const geometry = useMemo(() => worldPlane(width(area), depth(area), PBR.carpet.tile), [area])

  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2} position={[cx, 0.006, cz]} receiveShadow>
      <meshStandardMaterial
        {...maps}
        color={hall.carpetColor}
        roughness={1}
        normalScale={[0.9, 0.9]}
        envMapIntensity={0.35}
      />
    </mesh>
  )
}
