import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { standFrame } from '../../config/geometry'
import { EMBUTIDOS } from '../../config/layouts'
import type { StandConfig } from '../../config/types'
import { FONT, fontUrl } from '../../materials/assets'
import type { Vec3 } from '../../materials/geometry'
import { alongLine, TINTS, withTints } from '../products/arrange'
import type { ProductKey } from '../products/catalog'
import { ProductInstances } from '../products/ProductInstances'
import { Block } from '../props/Block'
import { Counter } from '../props/Counter'
import { LightBox } from '../props/LightBox'
import { Platform } from '../props/Platform'
import { Prop } from '../props/Prop'
import { Shelving } from '../props/Shelving'
import { Spotlight } from '../props/Spotlight'
import { StandPlacement } from './StandPlacement'

const E = EMBUTIDOS
const BEAM_H = 0.22
const BEAM_Y = E.beamTop - BEAM_H / 2
const RAIL_R = 0.03
/** Qué cuelga de cada varal, de atrás adelante, y cuántas piezas. */
const CURTAIN: { product: ProductKey; count: number }[] = [
  { product: 'salchichon', count: 11 },
  { product: 'chorizoVela', count: 13 },
  { product: 'chorizoSarta', count: 12 },
  { product: 'chorizoSarta', count: 12 },
]
/** Frontis apoyado sobre las vigas: 3,0 + mitad del rótulo (0,48 m) → cabe en los 3,5 m. */
const SIGN_Y = E.beamTop + 0.25
const FRONT_TOP = E.floor + E.frontCounter.height
const SIDE_TOP = E.floor + E.sideCounter.height

/** Frontis de madera apoyado sobre una viga (por encima de la cortina de embutidos). */
function BeamSign({
  position,
  rotationY = 0,
  width,
  stand,
}: {
  position: Vec3
  rotationY?: number
  width: number
  stand: StandConfig
}) {
  const { company } = stand
  const { palette } = company
  const height = 0.48
  return (
    <group position={position} rotation-y={rotationY}>
      <LightBox
        width={width}
        height={height}
        depth={0.05}
        frame="darkWood"
        color={palette.paper}
        intensity={0.35}
      >
        <Text
          font={fontUrl(company.font)}
          fontSize={0.13}
          color={palette.primary}
          anchorX="center"
          anchorY="middle"
          position={[0, 0.05, 0]}
        >
          {company.name.toUpperCase()}
        </Text>
        <Text
          font={FONT.uiBold}
          fontSize={0.055}
          letterSpacing={0.22}
          color={palette.secondary}
          anchorX="center"
          anchorY="middle"
          position={[0, -0.12, 0]}
        >
          {`CHACINA IBÉRICA · DESDE ${company.founded}`}
        </Text>
      </LightBox>
    </group>
  )
}

/**
 * Embutidos Sierra Candela · 18 m² en esquina: secadero de ladrillo visto con varales de los
 * que cuelga una cortina de chorizos y salchichones, mostrador de azulejo en L y estantería.
 */
export function EmbutidosStand({ stand }: { stand: StandConfig }) {
  const { width, depth } = standFrame(stand.plot, stand.front)
  const t = E.wallThickness
  const [postX, postZ] = E.post
  const railLength = E.rails.to - E.rails.from

  const curtain = useMemo(
    () =>
      E.rails.z.map((z, i) =>
        withTints(
          alongLine(
            [E.rails.from + 0.15, E.rails.y - RAIL_R, z],
            [E.rails.to - 0.1, E.rails.y - RAIL_R, z],
            CURTAIN[i]!.count,
            {
              rotationJitter: 0.7,
              seed: 30 + i,
            },
          ),
          TINTS.curing,
          40 + i,
        ),
      ),
    [],
  )

  const [fx, fz] = E.frontCounter.center
  const [sx, sz] = E.sideCounter.center

  return (
    <StandPlacement stand={stand}>
      <Platform
        width={width - 2 * E.floorInset}
        depth={depth - 2 * E.floorInset}
        height={E.floor}
        surface="darkWood"
      />

      {/* Muros de ladrillo, poste de esquina y vigas. */}
      <Block
        size={[width - 2 * E.wallInset - t, E.wallHeight, t]}
        position={[-t / 2, E.wallHeight / 2, -depth / 2 + E.wallInset + t / 2]}
        material="brick"
      />
      <Block
        size={[t, E.wallHeight, depth - 2 * E.wallInset]}
        position={[width / 2 - E.wallInset - t / 2, E.wallHeight / 2, 0]}
        material="brick"
      />
      <Block
        size={[E.postSize, E.beamTop, E.postSize]}
        position={[postX, E.beamTop / 2, postZ]}
        material="darkWood"
      />
      <Block
        size={[width / 2 - t - postX, BEAM_H, 0.14]}
        position={[(postX + width / 2 - t) / 2, BEAM_Y, postZ]}
        material="darkWood"
      />
      <Block
        size={[0.14, BEAM_H, postZ + depth / 2 - t]}
        position={[postX, BEAM_Y, (postZ - depth / 2 + t) / 2]}
        material="darkWood"
      />

      {/* Varales y cortina de embutidos. */}
      {E.rails.z.map((z, i) => (
        <group key={`v${z}`}>
          <Block
            size={[railLength, RAIL_R * 2, RAIL_R * 2]}
            position={[(E.rails.from + E.rails.to) / 2, E.rails.y, z]}
            material="roughWood"
            radius={RAIL_R * 0.9}
          />
          <ProductInstances product={CURTAIN[i]!.product} items={curtain[i]!} />
        </group>
      ))}

      {/* Mostrador de azulejo en L. */}
      <Counter
        width={E.frontCounter.size[0]}
        depth={E.frontCounter.size[1]}
        height={E.frontCounter.height}
        body="tiles"
        top="oak"
        position={[fx, E.floor, fz]}
      />
      <ProductInstances
        product="tablaEmbutidos"
        items={[{ position: [fx - 0.25, FRONT_TOP, fz], rotation: [0, 0.08, 0] }]}
      />
      <ProductInstances
        product="lomo"
        items={[{ position: [fx + 0.75, FRONT_TOP, fz - 0.06], rotation: [0, -0.15, 0] }]}
      />
      <ProductInstances
        product="cecina"
        items={[{ position: [fx - 1.05, FRONT_TOP, fz + 0.02], rotation: [0, 0.25, 0] }]}
      />
      <Counter
        width={E.sideCounter.size[1]}
        depth={E.sideCounter.size[0]}
        height={E.sideCounter.height}
        body="tiles"
        top="oak"
        position={[sx, E.floor, sz]}
        rotationY={-Math.PI / 2}
      />
      <ProductInstances
        product="lomo"
        items={alongLine([sx, SIDE_TOP, sz - 0.75], [sx, SIDE_TOP, sz + 0.05], 2, {
          baseRotation: [0, Math.PI / 2, 0],
          rotationJitter: 0.1,
          seed: 5,
        })}
      />
      <ProductInstances
        product="cecina"
        items={[{ position: [sx, SIDE_TOP, sz + 0.55], rotation: [0, 1.4, 0] }]}
      />
      <Prop model="jarra" position={[sx + 0.05, SIDE_TOP, sz + 0.88]} />

      {/* Estantería del fondo con lomos y cecinas. */}
      <Shelving
        width={E.shelf.size[0]}
        height={E.shelf.height}
        depth={E.shelf.size[1]}
        shelves={4}
        frame="darkWood"
        boards="roughWood"
        position={[E.shelf.center[0], E.floor, E.shelf.center[1]]}
        renderShelf={(_level, index) =>
          index === 3 ? (
            <>
              <Prop model="cesta" position={[-0.6, 0, 0]} />
              <Prop model="cesta" position={[0.3, 0, 0]} rotationY={0.3} />
            </>
          ) : (
            <ProductInstances
              product={index % 2 === 0 ? 'lomo' : 'cecina'}
              items={alongLine([-0.85, 0, 0], [0.85, 0, 0], index % 2 === 0 ? 5 : 4, {
                baseRotation: [0, index % 2 === 0 ? Math.PI / 2 : 0, 0],
                rotationJitter: 0.15,
                seed: 60 + index,
              })}
            />
          )
        }
      />
      <Prop model="barrica" position={[E.barrel[0], E.floor, E.barrel[1]]} rotationY={0.6} />
      <Prop
        model="cajaMadera"
        position={[E.barrel[0] - 0.05, E.floor + 0.872, E.barrel[1]]}
        scale={0.45}
        rotationY={0.2}
      />

      {/* Rótulos colgados hacia los dos pasillos y luz de acento. */}
      <BeamSign stand={stand} width={2.4} position={[(postX + width / 2 - t) / 2, SIGN_Y, postZ]} />
      <BeamSign
        stand={stand}
        width={2.0}
        position={[postX, SIGN_Y, 0.25]}
        rotationY={-Math.PI / 2}
      />
      <Spotlight
        position={[fx - 0.7, E.beamTop - BEAM_H - 0.14, postZ - 0.12]}
        target={[fx - 0.5, FRONT_TOP, fz]}
        intensity={18}
        angle={0.55}
      />
      <Spotlight
        position={[fx + 0.9, E.beamTop - BEAM_H - 0.14, postZ - 0.12]}
        target={[fx + 0.4, 1.9, -0.45]}
        light={false}
      />
    </StandPlacement>
  )
}
