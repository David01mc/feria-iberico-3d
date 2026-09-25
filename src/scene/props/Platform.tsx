import { useMemo } from 'react'
import { worldBox, worldRoundedBox, type Vec3 } from '../../materials/geometry'
import { resolveMaterial, tileOf, useMaterials, type MaterialRef } from '../../materials/library'
import { useDisposeGeometries } from './useGeometries'

const EDGE = 0.02

export interface PlatformProps {
  width: number
  depth: number
  height?: number
  surface?: MaterialRef
  edge?: MaterialRef
  position?: Vec3
  rotationY?: number
}

/** Tarima elevada del stand con remate perimetral de aluminio. `position` es el centro en el suelo. */
export function Platform({
  width,
  depth,
  height = 0.1,
  surface = 'deck',
  edge = 'aluminium',
  position,
  rotationY = 0,
}: PlatformProps) {
  const library = useMaterials()
  const surfaceMaterial = resolveMaterial(library, surface)
  const edgeMaterial = resolveMaterial(library, edge)
  const tile = tileOf(surfaceMaterial)

  const geo = useMemo(
    () => ({
      deck: worldBox(width - 2 * EDGE, height, depth - 2 * EDGE, tile),
      edgeX: worldRoundedBox(width, height + 0.004, EDGE, 0.003),
      edgeZ: worldRoundedBox(EDGE, height + 0.004, depth - 2 * EDGE, 0.003),
    }),
    [width, depth, height, tile],
  )
  useDisposeGeometries(geo)

  const y = (height + 0.004) / 2
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh geometry={geo.deck} material={surfaceMaterial} position={[0, height / 2, 0]} receiveShadow castShadow />
      {[-1, 1].map((s) => (
        <mesh key={`x${s}`} geometry={geo.edgeX} material={edgeMaterial} position={[0, y, s * (depth / 2 - EDGE / 2)]} />
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`z${s}`} geometry={geo.edgeZ} material={edgeMaterial} position={[s * (width / 2 - EDGE / 2), y, 0]} />
      ))}
    </group>
  )
}
