import { useMemo, type ReactNode } from 'react'
import { worldRoundedBox, type Vec3 } from '../../materials/geometry'
import { resolveMaterial, tileOf, useMaterials, type MaterialRef } from '../../materials/library'
import { useDisposeGeometries } from './useGeometries'

const BOARD_T = 0.028
const POST = 0.045

/** Altura (y) de la cara superior de cada balda, de abajo arriba. */
export function shelfLevels(height: number, shelves: number): number[] {
  if (shelves < 2) return [height - 0.02]
  const bottom = 0.1
  const top = height - 0.02
  return Array.from({ length: shelves }, (_, i) => bottom + (i * (top - bottom)) / (shelves - 1))
}

export interface ShelvingProps {
  width: number
  height: number
  depth?: number
  shelves?: number
  frame?: MaterialRef
  boards?: MaterialRef
  /** Trasera opcional (p. ej. pizarra o lacado de marca). */
  back?: MaterialRef
  position?: Vec3
  rotationY?: number
  /** Contenido de cada balda: origen en el centro de su cara superior. */
  renderShelf?: (level: number, index: number) => ReactNode
}

/** Estantería abierta de montantes y baldas, para exponer producto de cara al pasillo (+z). */
export function Shelving({
  width,
  height,
  depth = 0.4,
  shelves = 4,
  frame = 'roughWood',
  boards = 'roughWood',
  back,
  position,
  rotationY = 0,
  renderShelf,
}: ShelvingProps) {
  const library = useMaterials()
  const frameMaterial = resolveMaterial(library, frame)
  const boardMaterial = resolveMaterial(library, boards)
  const backMaterial = back ? resolveMaterial(library, back) : null
  const levels = shelfLevels(height, shelves)
  const frameTile = tileOf(frameMaterial)
  const boardTile = tileOf(boardMaterial)
  const backTile = backMaterial ? tileOf(backMaterial) : 1

  const geo = useMemo(
    () => ({
      post: worldRoundedBox(POST, height, POST, 0.006, frameTile),
      board: worldRoundedBox(width, BOARD_T, depth, 0.005, boardTile),
      back: worldRoundedBox(width - 2 * POST, height - 0.04, 0.012, 0.003, backTile),
    }),
    [width, height, depth, frameTile, boardTile, backTile],
  )
  useDisposeGeometries(geo)

  const px = width / 2 - POST / 2
  const pz = depth / 2 - POST / 2

  return (
    <group position={position} rotation-y={rotationY}>
      {[-px, px].flatMap((x) =>
        [-pz, pz].map((z) => (
          <mesh
            key={`${x}${z}`}
            geometry={geo.post}
            material={frameMaterial}
            position={[x, height / 2, z]}
            castShadow
            receiveShadow
          />
        )),
      )}
      {levels.map((level, i) => (
        <group key={level}>
          <mesh
            geometry={geo.board}
            material={boardMaterial}
            position={[0, level - BOARD_T / 2, 0]}
            castShadow
            receiveShadow
          />
          {renderShelf && <group position={[0, level, 0]}>{renderShelf(level, i)}</group>}
        </group>
      ))}
      {backMaterial && (
        <mesh
          geometry={geo.back}
          material={backMaterial}
          position={[0, height / 2, -depth / 2 + 0.006]}
          receiveShadow
        />
      )}
    </group>
  )
}
