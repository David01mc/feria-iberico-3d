import { useMemo, type ReactNode } from 'react'
import { worldBox, worldRoundedBox, type Vec3 } from '../../materials/geometry'
import { resolveMaterial, tileOf, useMaterials, type MaterialRef } from '../../materials/library'
import { useDisposeGeometries } from './useGeometries'

export interface BlockProps {
  /** [ancho x, alto y, fondo z] en metros. */
  size: Vec3
  /** Centro del bloque. */
  position?: Vec3
  rotationY?: number
  material: MaterialRef
  /** Radio de los cantos (0 = arista viva). */
  radius?: number
  castShadow?: boolean
  children?: ReactNode
}

/** Pieza constructiva (pared, pilar, viga, rótulo) con textura a escala real. */
export function Block({
  size: [w, h, d],
  position,
  rotationY = 0,
  material,
  radius = 0.004,
  castShadow = true,
  children,
}: BlockProps) {
  const library = useMaterials()
  const resolved = resolveMaterial(library, material)
  const tile = tileOf(resolved)
  const geo = useMemo(
    () => ({ box: radius > 0 ? worldRoundedBox(w, h, d, radius, tile) : worldBox(w, h, d, tile) }),
    [w, h, d, radius, tile],
  )
  useDisposeGeometries(geo)

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh geometry={geo.box} material={resolved} castShadow={castShadow} receiveShadow />
      {children}
    </group>
  )
}
