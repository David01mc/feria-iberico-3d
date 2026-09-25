import { useEffect, useMemo, type ReactNode } from 'react'
import { MeshStandardMaterial } from 'three'
import { worldRoundedBox, type Vec3 } from '../../materials/geometry'
import { resolveMaterial, useMaterials, type MaterialRef } from '../../materials/library'
import { useDisposeGeometries } from './useGeometries'

export interface LightBoxProps {
  width: number
  height: number
  depth?: number
  /** Color de la lona retroiluminada. */
  color?: string
  /** Brillo de la lona (>1 produce un halo suave con el bloom). */
  intensity?: number
  frame?: MaterialRef
  position?: Vec3
  rotationY?: number
  /** Gráfica sobre la lona: origen en el centro de la cara frontal, +z hacia fuera. */
  children?: ReactNode
}

/** Caja de luz: marco de aluminio y lona textil retroiluminada, el rótulo típico de feria. */
export function LightBox({
  width,
  height,
  depth = 0.08,
  color = '#fbf4e8',
  intensity = 1.1,
  frame = 'aluminium',
  position,
  rotationY = 0,
  children,
}: LightBoxProps) {
  const library = useMaterials()
  const frameMaterial = resolveMaterial(library, frame)
  const geo = useMemo(
    () => ({ frame: worldRoundedBox(width, height, depth, 0.01) }),
    [width, height, depth],
  )
  useDisposeGeometries(geo)
  const fabric = useMemo(
    () => new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.9 }),
    [color, intensity],
  )
  useEffect(() => () => fabric.dispose(), [fabric])

  const inset = 0.035
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh geometry={geo.frame} material={frameMaterial} castShadow />
      <mesh position={[0, 0, depth / 2 + 0.001]} material={fabric}>
        <planeGeometry args={[width - 2 * inset, height - 2 * inset]} />
      </mesh>
      {children && <group position={[0, 0, depth / 2 + 0.004]}>{children}</group>}
    </group>
  )
}
