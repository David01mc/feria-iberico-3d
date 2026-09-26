import { Text } from '@react-three/drei'
import { ExtrudeGeometry, Path, Shape, ShapeGeometry } from 'three'
import { standFrame } from '../../config/geometry'
import { MIELES } from '../../config/layouts'
import type { StandConfig } from '../../config/types'
import { FONT, fontUrl } from '../../materials/assets'
import { useMaterials, useTintedMaterial } from '../../materials/library'
import { Block } from '../props/Block'
import { Counter } from '../props/Counter'
import { Platform } from '../props/Platform'
import { Prop } from '../props/Prop'
import { Spotlight } from '../props/Spotlight'
import { HoneyJar } from './HoneyJar'
import { StandPlacement } from './StandPlacement'

const M = MIELES
const HEX_RADIUS = 0.275
const HEX_INNER = 0.215
const HEX_DEPTH = 0.16

function hexagon(radius: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = Math.PI / 2 + (i * Math.PI) / 3
    return [Math.cos(angle) * radius, Math.sin(angle) * radius] as const
  })
}

function honeycombGeometry() {
  const shape = new Shape()
  const outer = hexagon(HEX_RADIUS)
  shape.moveTo(...outer[0]!)
  for (const [x, y] of outer.slice(1)) shape.lineTo(x, y)
  shape.closePath()
  const hole = new Path()
  const inner = hexagon(HEX_INNER).reverse()
  hole.moveTo(...inner[0]!)
  for (const [x, y] of inner.slice(1)) hole.lineTo(x, y)
  hole.closePath()
  shape.holes.push(hole)
  const ring = new ExtrudeGeometry(shape, { depth: HEX_DEPTH, bevelEnabled: false, steps: 1 })
  ring.translate(0, 0, -HEX_DEPTH / 2)
  const backShape = new Shape()
  const back = hexagon(HEX_INNER)
  backShape.moveTo(...back[0]!)
  for (const [x, y] of back.slice(1)) backShape.lineTo(x, y)
  backShape.closePath()
  return { ring, backing: new ShapeGeometry(backShape) }
}

const HEX = honeycombGeometry()
const FRONT_JARS = [-0.87, -0.43, 0.43, 0.87]
const BACK_JARS = [-1.02, -0.68, -0.34, 0, 0.34, 0.68, 1.02]

/** Puesto de miel cruda con colmenar de madera, tarros y cubierta de lona clara. */
export function MielesStand({ stand }: { stand: StandConfig }) {
  const { company } = stand
  const { palette } = company
  const { width, depth } = standFrame(stand.plot, stand.front)
  const materials = useMaterials()
  const amber = useTintedMaterial('lacquerWhite', palette.secondary)
  const dark = useTintedMaterial('lacquerBlack', palette.primary)
  const canvas = useTintedMaterial('linen', palette.paper)
  const cellBack = useTintedMaterial('hessian', '#9c733b')
  const counterTop = M.floor + M.counter.height
  const t = M.wallThickness

  return (
    <StandPlacement stand={stand}>
      <Platform
        width={width - 2 * M.floorInset}
        depth={depth - 2 * M.floorInset}
        height={M.floor}
        surface="pine"
        edge="oak"
      />

      {/* Trasera y lateral este retraídos de las parcelas contiguas. */}
      <Block
        size={[width - 2 * M.wallInset, M.wallHeight, t]}
        position={[0, M.wallHeight / 2, -depth / 2 + M.wallInset + t / 2]}
        material={canvas}
      />
      <Block
        size={[t, M.wallHeight, depth - 2 * M.wallInset]}
        position={[width / 2 - M.wallInset - t / 2, M.wallHeight / 2, 0]}
        material={canvas}
      />

      {/* Bastidor y cubierta de pino bajo el límite de altura. */}
      {[-1.28, 1.28].flatMap((x) =>
        [-1.28, 1.28].map((z) => (
          <Block
            key={`${x}-${z}`}
            size={[0.09, M.frameHeight, 0.09]}
            position={[x, M.frameHeight / 2, z]}
            material="pine"
          />
        )),
      )}
      <Block size={[2.66, 0.07, 2.58]} position={[0, 3.12, 0]} material={canvas} />
      {[-1.28, 1.28].map((z) => (
        <Block key={`viga-${z}`} size={[2.62, 0.1, 0.1]} position={[0, 3.17, z]} material="pine" />
      ))}

      {/* Fachada legible desde el Pasillo Sur. */}
      <Block size={[2.53, 0.37, 0.07]} position={[0, 2.88, 1.34]} material={dark}>
        <Text
          font={fontUrl(company.font)}
          fontSize={0.18}
          color={palette.paper}
          anchorX="center"
          anchorY="middle"
          position={[0, 0.06, 0.039]}
        >
          {company.name}
        </Text>
        <Text
          font={FONT.uiBold}
          fontSize={0.053}
          letterSpacing={0.1}
          color={palette.accent}
          anchorX="center"
          anchorY="middle"
          position={[0, -0.105, 0.04]}
        >
          MIEL CRUDA · LAS HURDES
        </Text>
      </Block>
      {[-0.95, -0.47, 0, 0.47, 0.95].map((x, i) => (
        <group key={x} position={[x, 2.66 - (i % 2) * 0.08, 1.25]}>
          <Block
            size={[0.006, 0.29, 0.006]}
            position={[0, 0.145, 0]}
            material="steelBlack"
            radius={0}
          />
          <mesh material={materials.ledWarm}>
            <sphereGeometry args={[0.034, 8, 6]} />
          </mesh>
        </group>
      ))}

      {/* Doce celdas hexagonales con diferentes cosechas. */}
      {M.honeycomb.rows.flatMap((y, row) =>
        M.honeycomb.columns.map((baseX, column) => {
          const x = baseX + (row % 2 ? 0.13 : 0)
          return (
            <group key={`${row}-${column}`} position={[x, y, M.honeycomb.z]}>
              <mesh geometry={HEX.backing} position={[0, 0, -0.068]} material={cellBack} />
              <mesh geometry={HEX.ring} material={materials.pine} castShadow receiveShadow />
              <Prop
                model="tarroMielKenney"
                position={[0, -0.19, 0.08]}
                rotationY={((row + column) % 3 - 1) * 0.28}
                scale={0.82}
              />
            </group>
          )
        }),
      )}

      <Counter
        width={M.counter.size[0]}
        depth={M.counter.size[1]}
        height={M.counter.height}
        body="pine"
        top="oak"
        position={[M.counter.center[0], M.floor, M.counter.center[1]]}
        front={
          <Text
            font={fontUrl(company.font)}
            fontSize={0.2}
            color={palette.primary}
            anchorX="center"
            anchorY="middle"
          >
            Miel de la Dehesa
          </Text>
        }
      />
      {BACK_JARS.map((x, i) => (
        <Prop
          key={`detras-${x}`}
          model="tarroMielKenney"
          position={[x, counterTop, 0.52]}
          rotationY={(i % 3 - 1) * 0.3}
          scale={0.68}
        />
      ))}
      {FRONT_JARS.map((x, i) => (
        <HoneyJar
          key={`frente-${x}`}
          position={[x, counterTop, 0.91]}
          variety={(i + 1) % 3}
          large
        />
      ))}
      <Prop model="tarroMielConPalito" position={[0, counterTop, 0.82]} scale={0.82} />
      <Block size={[0.55, 0.04, 0.09]} position={[0, 0.27, 1.075]} material={amber}>
        <Text
          font={FONT.uiBold}
          fontSize={0.045}
          color={palette.paper}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.048]}
        >
          100 % ARTESANA
        </Text>
      </Block>
      <Spotlight position={[0, 3.06, 0.18]} target={[0, 1.2, 0.65]} intensity={20} angle={0.65} />
    </StandPlacement>
  )
}
