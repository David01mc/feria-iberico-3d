import { useMemo, type ReactNode } from 'react'
import { worldRoundedBox, type Vec3 } from '../../materials/geometry'
import { resolveMaterial, tileOf, useMaterials, type MaterialRef } from '../../materials/library'
import { useDisposeGeometries } from './useGeometries'

const PLINTH_H = 0.1
const TOP_T = 0.04
const OVERHANG = 0.03
const RECESS = 0.04

export interface CounterProps {
  width: number
  depth?: number
  height?: number
  body?: MaterialRef
  top?: MaterialRef
  position?: Vec3
  rotationY?: number
  /** Gráfica o rótulo del frente: origen en el centro de la cara frontal, +z hacia fuera. */
  front?: ReactNode
}

/** Mostrador: zócalo retranqueado, cuerpo y encimera volada con cantos redondeados. */
export function Counter({
  width,
  depth = 0.6,
  height = 1.05,
  body = 'lacquerWhite',
  top = 'oak',
  position,
  rotationY = 0,
  front,
}: CounterProps) {
  const library = useMaterials()
  const bodyMaterial = resolveMaterial(library, body)
  const topMaterial = resolveMaterial(library, top)
  const bodyH = height - PLINTH_H - TOP_T
  const bodyTile = tileOf(bodyMaterial)
  const topTile = tileOf(topMaterial)

  const geo = useMemo(
    () => ({
      plinth: worldRoundedBox(width - 2 * RECESS, PLINTH_H, depth - 2 * RECESS, 0.004),
      body: worldRoundedBox(width, bodyH, depth, 0.006, bodyTile),
      top: worldRoundedBox(width + 2 * OVERHANG, TOP_T, depth + 2 * OVERHANG, 0.008, topTile),
    }),
    [width, depth, bodyH, bodyTile, topTile],
  )
  useDisposeGeometries(geo)

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh geometry={geo.plinth} material={library.rubber} position={[0, PLINTH_H / 2, -RECESS / 2]} receiveShadow />
      <mesh geometry={geo.body} material={bodyMaterial} position={[0, PLINTH_H + bodyH / 2, 0]} castShadow receiveShadow />
      <mesh geometry={geo.top} material={topMaterial} position={[0, height - TOP_T / 2, 0]} castShadow receiveShadow />
      {front && <group position={[0, PLINTH_H + bodyH / 2, depth / 2 + 0.002]}>{front}</group>}
    </group>
  )
}
