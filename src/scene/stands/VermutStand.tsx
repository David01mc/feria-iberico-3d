import { Text } from '@react-three/drei'
import { standFrame } from '../../config/geometry'
import { VERMUT } from '../../config/layouts'
import type { StandConfig } from '../../config/types'
import { FONT, fontUrl } from '../../materials/assets'
import { useTintedMaterial } from '../../materials/library'
import { Block } from '../props/Block'
import { Counter } from '../props/Counter'
import { Platform } from '../props/Platform'
import { Spotlight } from '../props/Spotlight'
import { StandPlacement } from './StandPlacement'
import { OliveDish, VermutBottle, VermutGlass } from './VermutDrinks'

const V = VERMUT
const SHELF_BOTTLES = [-0.91, -0.45, 0, 0.45, 0.91]
const BULBS = [-1.06, -0.53, 0, 0.53, 1.06]

/** Barra pequeña de aperitivo con estructura de pino, toldo y bombillas colgantes. */
export function VermutStand({ stand }: { stand: StandConfig }) {
  const { company } = stand
  const { palette } = company
  const { width, depth } = standFrame(stand.plot, stand.front)
  const navy = useTintedMaterial('lacquerBlack', palette.primary)
  const red = useTintedMaterial('lacquerWhite', palette.secondary)
  const navyCanvas = useTintedMaterial('linen', palette.primary)
  const creamCanvas = useTintedMaterial('linen', palette.paper)
  const t = V.wallThickness
  const counterTop = V.floor + V.counter.height

  return (
    <StandPlacement stand={stand}>
      <Platform
        width={width - 2 * V.floorInset}
        depth={depth - 2 * V.floorInset}
        height={V.floor}
        surface="darkWood"
        edge="oak"
      />

      {/* Las tres paredes dejan separación con el puesto de aceitunas y los módulos traseros. */}
      <Block
        size={[width - 2 * V.wallInset - 2 * t, V.wallHeight, t]}
        position={[0, V.wallHeight / 2, -depth / 2 + V.wallInset + t / 2]}
        material={navy}
      />
      {[-1, 1].map((side) => (
        <Block
          key={`pared-${side}`}
          size={[t, V.wallHeight, depth - 2 * V.wallInset]}
          position={[side * (width / 2 - V.wallInset - t / 2), V.wallHeight / 2, 0]}
          material={navy}
        />
      ))}

      {/* Cuatro postes y bastidor abierto, como la instalación de pino de la referencia. */}
      {V.frameX.flatMap((x) =>
        V.frameZ.map((z) => (
          <Block
            key={`poste-${x}-${z}`}
            size={[0.09, V.frameHeight, 0.09]}
            position={[x, V.frameHeight / 2, z]}
            material="pine"
          />
        )),
      )}
      {V.frameZ.map((z) => (
        <Block
          key={`viga-frente-${z}`}
          size={[2.56, 0.11, 0.11]}
          position={[0, V.frameHeight - 0.055, z]}
          material="pine"
        />
      ))}
      {V.frameX.map((x) => (
        <Block
          key={`viga-lado-${x}`}
          size={[0.09, 0.11, 2.45]}
          position={[x, V.frameHeight - 0.055, 0]}
          material="pine"
        />
      ))}

      {/* Toldo rayado y rótulo legible desde la Avenida Central. */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={`toldo-${i}`}
          position={[-1.05 + i * 0.42, 2.67, 1.11]}
          rotation-x={0.25}
          material={i % 2 ? creamCanvas : navyCanvas}
          castShadow
        >
          <boxGeometry args={[0.418, 0.014, 0.66]} />
        </mesh>
      ))}
      <Block size={[2.49, 0.35, 0.065]} position={[0, 2.96, 1.365]} material={navy}>
        <Text
          font={fontUrl(company.font)}
          fontSize={0.185}
          color={palette.paper}
          anchorX="center"
          anchorY="middle"
          position={[0, 0.045, 0.039]}
        >
          {company.name}
        </Text>
        <Text
          font={FONT.uiBold}
          fontSize={0.061}
          letterSpacing={0.1}
          color={palette.accent}
          anchorX="center"
          anchorY="middle"
          position={[0, -0.105, 0.04]}
        >
          ROJO · BLANCO · RESERVA
        </Text>
      </Block>

      {/* Bombillas suspendidas del bastidor; un solo foco real ilumina la barra. */}
      {BULBS.map((x, i) => {
        const bulbY = i % 2 ? 2.48 : 2.6
        const wireTop = V.frameHeight - 0.11
        const wireLength = wireTop - bulbY
        return (
          <group key={`bombilla-${x}`}>
            <Block
              size={[0.008, wireLength, 0.008]}
              position={[x, bulbY + wireLength / 2, i % 2 ? 0.32 : -0.02]}
              material="steelBlack"
              radius={0}
            />
            <mesh position={[x, bulbY, i % 2 ? 0.32 : -0.02]}>
              <sphereGeometry args={[0.065, 12, 10]} />
              <meshStandardMaterial color="#ffd782" emissive="#ffb84d" emissiveIntensity={4} />
            </mesh>
          </group>
        )
      })}

      {/* Botellas de la casa en dos baldas; la carta queda encima del producto. */}
      <Text
        font={FONT.uiBold}
        fontSize={0.14}
        letterSpacing={0.09}
        color={palette.paper}
        anchorX="center"
        anchorY="middle"
        position={[0, 2.51, -1.326]}
      >
        EL APERITIVO DE SIEMPRE
      </Text>
      {V.shelf.levels.map((y, row) => (
        <group key={y}>
          <Block
            size={[V.shelf.width, 0.05, V.shelf.depth]}
            position={[0, y - 0.025, V.shelf.z]}
            material="pine"
          />
          {SHELF_BOTTLES.map((x, i) => (
            <VermutBottle
              key={`${row}-${x}`}
              position={[x, y, V.shelf.z]}
              blanco={(i + row) % 3 === 1}
            />
          ))}
        </group>
      ))}

      {/* Mostrador de pino con botellas de muestra, vasos y aceitunas. */}
      <Counter
        width={V.counter.size[0]}
        depth={V.counter.size[1]}
        height={V.counter.height}
        body="pine"
        top="darkWood"
        position={[V.counter.center[0], V.floor, V.counter.center[1]]}
        front={
          <Text
            font={fontUrl(company.font)}
            fontSize={0.18}
            color={palette.primary}
            anchorX="center"
            anchorY="middle"
          >
            {company.name}
          </Text>
        }
      />
      <VermutBottle position={[-1.02, counterTop, 0.62]} label />
      <VermutBottle position={[1.02, counterTop, 0.62]} blanco label />
      {[-0.52, 0, 0.52].map((x) => (
        <VermutGlass key={x} position={[x, counterTop, 1.01]} />
      ))}
      <OliveDish position={[0.91, counterTop, 1.01]} />
      <Block size={[0.62, 0.045, 0.08]} position={[0, 0.31, 1.162]} material={red}>
        <Text
          font={FONT.uiBold}
          fontSize={0.044}
          color={palette.paper}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.046]}
        >
          REUS · DESDE 1954
        </Text>
      </Block>
      <Spotlight position={[0, 3.02, 0.23]} target={[0, 1.05, 0.89]} intensity={21} angle={0.63} />
    </StandPlacement>
  )
}
