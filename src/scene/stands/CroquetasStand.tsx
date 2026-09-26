import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { standFrame } from '../../config/geometry'
import { CROQUETAS } from '../../config/layouts'
import type { StandConfig } from '../../config/types'
import { FONT, fontUrl } from '../../materials/assets'
import { useTintedMaterial } from '../../materials/library'
import { gridOnSurface, TINTS, withTints } from '../products/arrange'
import { ProductInstances } from '../products/ProductInstances'
import { MODELS } from '../props/catalog'
import { Block } from '../props/Block'
import { Counter } from '../props/Counter'
import { LightBox } from '../props/LightBox'
import { Platform } from '../props/Platform'
import { Prop } from '../props/Prop'
import { Spotlight } from '../props/Spotlight'
import { StandPlacement } from './StandPlacement'

const C = CROQUETAS
const FRONT_TOP = C.floor + C.frontCounter.height
/** Expositor calefactado sobre el mostrador de venta, a la izquierda. */
const VITRINA_AT: [number, number, number] = [
  C.frontCounter.center[0] - 0.55,
  FRONT_TOP,
  C.frontCounter.center[1],
]
const BACK_TOP = C.floor + C.backCounter.height
const ROOF_Y = C.wallHeight
const LAMP_Y = ROOF_Y - 0.04 - 1.17
const MENU = [
  ['Jamón ibérico', '2,50 €'],
  ['Cecina de León', '2,50 €'],
  ['Queso curado', '2,20 €'],
  ['Chorizo ibérico', '2,20 €'],
  ['Cucurucho de 6', '12 €'],
]

/**
 * Doña Brava Croquetería · kiosco de 9 m²: street-food moderno en mostaza y negro, rótulo
 * de neón, expositor calefactado lleno de croquetas, freidora y carta retroiluminada.
 */
export function CroquetasStand({ stand }: { stand: StandConfig }) {
  const { company } = stand
  const { palette } = company
  const { width, depth } = standFrame(stand.plot, stand.front)
  const mustard = useTintedMaterial('lacquerWhite', palette.primary)
  const cream = useTintedMaterial('lacquerWhite', palette.paper)
  const t = C.wallThickness
  const [fx, fz] = C.frontCounter.center
  const [bx, bz] = C.backCounter.center

  const croquetas = useMemo(() => {
    const { inferior, superior } = MODELS.vitrinaCaliente.surfaces
    const tray = (surface: typeof inferior | typeof superior, seed: number) =>
      gridOnSurface(
        {
          center: [
            VITRINA_AT[0] + surface.center[0],
            VITRINA_AT[1] + surface.center[1],
            VITRINA_AT[2] + surface.center[2],
          ],
          size: surface.size,
        },
        { spacing: [0.068, 0.036], margin: 0.02, jitter: 0.003, rotationJitter: 0.12, seed },
      )
    return withTints([...tray(inferior, 13), ...tray(superior, 14)], TINTS.frying, 15)
  }, [])

  const header = { y: ROOF_Y + C.header.height / 2, z: C.header.z }

  return (
    <StandPlacement stand={stand}>
      <Platform width={width} depth={depth} height={C.floor} surface="tiles" />

      {/* Caja del kiosco: paredes mostaza, techo y frontis negros. */}
      <Block
        size={[width, C.wallHeight, t]}
        position={[0, C.wallHeight / 2, -depth / 2 + t / 2]}
        material={mustard}
      />
      {[-1, 1].map((s) => (
        <Block
          key={`p${s}`}
          size={[t, C.wallHeight, depth]}
          position={[s * (width / 2 - t / 2), C.wallHeight / 2, 0]}
          material={mustard}
        />
      ))}
      <Block size={[width, 0.08, depth]} position={[0, ROOF_Y + 0.04, 0]} material="lacquerBlack" />
      <Block
        size={[width, C.header.height, C.header.depth]}
        position={[0, header.y, header.z]}
        material="lacquerBlack"
        radius={0.01}
      >
        <Text
          font={fontUrl(company.font)}
          fontSize={0.3}
          anchorX="center"
          anchorY="middle"
          position={[0, 0.06, C.header.depth / 2 + 0.004]}
        >
          Doña Brava
          <meshStandardMaterial
            color="#000000"
            emissive={palette.accent}
            emissiveIntensity={5}
            toneMapped
          />
        </Text>
        <Text
          font={FONT.uiBold}
          fontSize={0.065}
          letterSpacing={0.4}
          color={palette.primary}
          anchorX="center"
          anchorY="middle"
          position={[0, -0.2, C.header.depth / 2 + 0.004]}
        >
          CROQUETERÍA
        </Text>
      </Block>

      {/* Toldo a rayas bajo el frontis. */}
      {Array.from({ length: 8 }, (_, i) => -width / 2 + t + (i + 0.5) * ((width - 2 * t) / 8)).map(
        (x, i) => (
          <mesh
            key={`toldo${i}`}
            position={[x, ROOF_Y - 0.16, header.z - 0.12]}
            rotation-x={0.4}
            material={i % 2 ? cream : mustard}
            castShadow
          >
            <boxGeometry args={[(width - 2 * t) / 8, 0.012, 0.5]} />
          </mesh>
        ),
      )}

      {/* Mostrador de venta con expositor, cucuruchos y medias croquetas. */}
      <Counter
        width={C.frontCounter.size[0]}
        depth={C.frontCounter.size[1]}
        height={C.frontCounter.height}
        body={mustard}
        top="steelBrushed"
        position={[fx, C.floor, fz]}
        front={
          <Text
            font={FONT.uiBold}
            fontSize={0.075}
            letterSpacing={0.18}
            color={palette.secondary}
            anchorX="center"
            anchorY="middle"
          >
            {company.tagline.toUpperCase()}
          </Text>
        }
      />
      <Prop model="vitrinaCaliente" position={VITRINA_AT} />
      <ProductInstances product="croqueta" items={croquetas} />
      <ProductInstances
        product="cucurucho"
        items={[0.2, 0.42, 0.64].map((x, i) => ({
          position: [fx + x, FRONT_TOP, fz + 0.08],
          rotation: [0, i * 1.7, 0],
        }))}
      />
      <Prop model="tablaServir" position={[fx + 1.0, FRONT_TOP, fz]} />
      <ProductInstances
        product="croquetaAbierta"
        items={[
          { position: [fx + 0.95, FRONT_TOP + 0.02, fz - 0.04] },
          { position: [fx + 1.05, FRONT_TOP + 0.02, fz + 0.05], rotation: [0, 1, 0] },
        ]}
      />

      {/* Zona de freidura y carta retroiluminada. */}
      <Counter
        width={C.backCounter.size[0]}
        depth={C.backCounter.size[1]}
        height={C.backCounter.height}
        body="lacquerBlack"
        top="steelBrushed"
        position={[bx, C.floor, bz]}
      />
      <Prop model="freidora" position={[bx - 0.7, BACK_TOP, bz]} />
      <Prop model="cuenco" position={[bx + 0.25, BACK_TOP, bz]} />
      <Prop model="jarra" position={[bx + 0.8, BACK_TOP, bz]} />
      <LightBox
        width={1.3}
        height={0.82}
        depth={0.04}
        color="#23201c"
        intensity={0.25}
        position={[0.45, 1.98, -depth / 2 + t + 0.02]}
      >
        <Text
          font={fontUrl(company.font)}
          fontSize={0.1}
          color={palette.primary}
          anchorX="center"
          anchorY="middle"
          position={[0, 0.29, 0]}
        >
          Nuestra carta
        </Text>
        {MENU.map(([dish, price], i) => (
          <group key={dish} position={[0, 0.15 - i * 0.1, 0]}>
            <Text
              font={FONT.ui}
              fontSize={0.052}
              color={palette.paper}
              anchorX="left"
              anchorY="middle"
              position={[-0.55, 0, 0]}
            >
              {dish}
            </Text>
            <Text
              font={FONT.uiBold}
              fontSize={0.052}
              color={palette.primary}
              anchorX="right"
              anchorY="middle"
              position={[0.55, 0, 0]}
            >
              {price}
            </Text>
          </group>
        ))}
      </LightBox>

      {/* Lámparas colgantes y foco sobre el expositor. */}
      {C.lamps.map(([x, z]) => (
        <Prop key={`l${x}`} model="lamparaColgante" position={[x, LAMP_Y, z]} />
      ))}
      <Spotlight
        position={[fx - 0.2, ROOF_Y - 0.18, 0.2]}
        target={[VITRINA_AT[0], FRONT_TOP + 0.2, fz]}
        intensity={14}
        angle={0.6}
      />
    </StandPlacement>
  )
}
