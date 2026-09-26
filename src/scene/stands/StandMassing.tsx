import { Text } from '@react-three/drei'
import { center, depth, width } from '../../config/geometry'
import { STAND_COLLIDERS } from '../../config/layouts'
import type { StandConfig } from '../../config/types'
import { fontUrl } from '../../materials/assets'
import { Block } from '../props/Block'
import { Platform } from '../props/Platform'
import { StandPlacement } from './StandPlacement'

/** Grosor por debajo del cual un obstáculo se lee como pared y se levanta a altura de muro. */
const WALL_MAX_THICKNESS = 0.25
const WALL_HEIGHT = 2.6
const FURNITURE_HEIGHT = 1.0

/**
 * Maqueta volumétrica provisional: tarima, paredes y muebles a partir de las colisiones del
 * layout, con el nombre del expositor. Sirve para revisar ocupación y encuadre antes de construir
 * la arquitectura definitiva de cada stand.
 */
export function StandMassing({ stand }: { stand: StandConfig }) {
  const { company } = stand
  const alongX = stand.front === 'north' || stand.front === 'south'
  const w = alongX ? width(stand.plot) : depth(stand.plot)
  const d = alongX ? depth(stand.plot) : width(stand.plot)

  return (
    <StandPlacement stand={stand}>
      <Platform width={w} depth={d} height={0.05} surface="lacquerWhite" />
      {STAND_COLLIDERS[stand.kind]().map((r, i) => {
        const [cx, cz] = center(r)
        const wall = Math.min(width(r), depth(r)) < WALL_MAX_THICKNESS
        const h = wall ? WALL_HEIGHT : FURNITURE_HEIGHT
        return (
          <Block
            key={i}
            size={[width(r), h, depth(r)]}
            position={[cx, 0.05 + h / 2, cz]}
            material={wall ? 'lacquerWhite' : 'lacquerBlack'}
          />
        )
      })}
      <Text
        font={fontUrl(company.font)}
        fontSize={0.35}
        color={company.palette.primary}
        anchorX="center"
        anchorY="middle"
        position={[0, 2.9, d / 2 - 0.2]}
      >
        {company.name}
      </Text>
    </StandPlacement>
  )
}
