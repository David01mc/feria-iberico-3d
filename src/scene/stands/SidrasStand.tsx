import { Text } from '@react-three/drei'
import { standFrame } from '../../config/geometry'
import { SIDRAS } from '../../config/layouts'
import type { StandConfig } from '../../config/types'
import { FONT, fontUrl } from '../../materials/assets'
import { useTintedMaterial } from '../../materials/library'
import { ProductInstances } from '../products/ProductInstances'
import { Block } from '../props/Block'
import { Counter } from '../props/Counter'
import { Platform } from '../props/Platform'
import { Prop } from '../props/Prop'
import { Spotlight } from '../props/Spotlight'
import { MossPanel } from './MossPanel'
import { StandPlacement } from './StandPlacement'

const S = SIDRAS
const FASCIA_Z = S.ceiling.z[1] + 0.07

/** Llagar asturiano: toneles de madera, jardín vertical y barra de degustación. */
export function SidrasStand({ stand }: { stand: StandConfig }) {
  const { company } = stand
  const { palette } = company
  const { width, depth } = standFrame(stand.plot, stand.front)
  const green = useTintedMaterial('lacquerWhite', palette.primary)

  return (
    <StandPlacement stand={stand}>
      <Platform
        width={width - 2 * S.floorInset}
        depth={depth - 2 * S.floorInset}
        height={S.floor}
        surface="pine"
        edge="darkWood"
      />

      {/* Paredes claras y techo de madera: la fachada queda abierta a dos pasillos. */}
      <Block
        size={[width - 2 * S.wallInset - S.wallThickness, S.wallHeight, S.wallThickness]}
        position={[
          S.wallThickness / 2,
          S.wallHeight / 2,
          -depth / 2 + S.wallInset + S.wallThickness / 2,
        ]}
        material="plaster"
      />
      <Block
        size={[S.wallThickness, S.wallHeight, depth - 2 * S.wallInset]}
        position={[-width / 2 + S.wallInset + S.wallThickness / 2, S.wallHeight / 2, 0]}
        material="pine"
      />
      <Block
        size={[width - 2 * S.wallInset, S.ceiling.thickness, S.ceiling.z[1] - S.ceiling.z[0]]}
        position={[0, S.ceiling.y, (S.ceiling.z[0] + S.ceiling.z[1]) / 2]}
        material="darkWood"
      />
      {[-2.72, 2.72].map((x) => (
        <Block
          key={x}
          size={[0.1, 0.14, 1.85]}
          position={[x, S.ceiling.y - 0.13, -0.57]}
          material="oak"
        />
      ))}

      {/* Un rótulo corto y legible desde el pasillo, enmarcado por madera. */}
      <Block size={[width - 0.22, 0.42, 0.11]} position={[0, 2.67, FASCIA_Z]} material={green}>
        <Text
          font={fontUrl(company.font)}
          fontSize={0.29}
          color={palette.paper}
          anchorX="center"
          anchorY="middle"
          position={[0, 0.035, 0.06]}
        >
          {company.name}
        </Text>
        <Text
          font={FONT.uiBold}
          fontSize={0.07}
          letterSpacing={0.18}
          color={palette.accent}
          anchorX="center"
          anchorY="middle"
          position={[0, -0.13, 0.06]}
        >
          SIDRA NATURAL · ASTURIAS
        </Text>
      </Block>

      {/* Zona de producción: dos toneles y una placa de origen sobre el fondo. */}
      <Block
        size={[2.55, 0.69, 0.045]}
        position={[-1.54, 2.08, -depth / 2 + S.wallInset + S.wallThickness + 0.04]}
        material="darkWood"
      >
        <Text
          font={fontUrl(company.font)}
          fontSize={0.25}
          color={palette.paper}
          anchorX="center"
          anchorY="middle"
          position={[0, 0.12, 0.027]}
        >
          Llagar Pumarín
        </Text>
        <Text
          font={FONT.uiBold}
          fontSize={0.073}
          letterSpacing={0.12}
          color={palette.accent}
          anchorX="center"
          anchorY="middle"
          position={[0, -0.17, 0.027]}
        >
          {company.origin.toUpperCase()}
        </Text>
      </Block>
      {S.barrels.map(([x, z]) => (
        <group key={x}>
          <Prop model="barrica" position={[x, S.floor, z]} scale={1.15} />
          <Block
            size={[0.62, 0.09, 0.025]}
            position={[x, S.floor + 0.52, z + 0.43]}
            material={green}
          >
            <Text
              font={FONT.uiBold}
              fontSize={0.068}
              color={palette.paper}
              anchorX="center"
              anchorY="middle"
              position={[0, 0, 0.014]}
            >
              SIDRA NATURAL
            </Text>
          </Block>
        </group>
      ))}

      {/* Jardín vertical con relieve y marco, integrado en la pared del fondo. */}
      <MossPanel
        width={S.moss.x[1] - S.moss.x[0]}
        height={S.moss.y[1] - S.moss.y[0]}
        position={[
          (S.moss.x[0] + S.moss.x[1]) / 2,
          (S.moss.y[0] + S.moss.y[1]) / 2,
          -depth / 2 + S.wallThickness + 0.1,
        ]}
      />
      <Block
        size={[S.ledge.x[1] - S.ledge.x[0], 0.12, S.ledge.depth]}
        position={[(S.ledge.x[0] + S.ledge.x[1]) / 2, S.ledge.height, S.ledge.z]}
        material="oak"
      />
      {S.ledge.x.map((x) => (
        <Block
          key={x}
          size={[0.09, S.ledge.height - S.floor, 0.12]}
          position={[x, (S.ledge.height + S.floor) / 2, S.ledge.z - 0.18]}
          material="darkWood"
        />
      ))}
      <Block
        size={[S.ledge.x[1] - S.ledge.x[0], 0.16, 0.045]}
        position={[
          (S.ledge.x[0] + S.ledge.x[1]) / 2,
          S.ledge.height - 0.12,
          S.ledge.z + S.ledge.depth / 2 - 0.01,
        ]}
        material="darkWood"
      >
        <Text
          font={FONT.uiBold}
          fontSize={0.075}
          letterSpacing={0.12}
          color={palette.paper}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.026]}
        >
          DEGUSTACIÓN DE SIDRA
        </Text>
      </Block>
      {S.stools.map(([x, z]) => (
        <Prop
          key={x}
          model="tabureteTapizado"
          position={[x, S.floor, z]}
          brandColor={palette.secondary}
        />
      ))}
      <ProductInstances
        product="botellaSidra"
        items={[0.72, 0.94, 1.16, 2.62].map((x) => ({
          position: [x, S.ledge.height + 0.06, S.ledge.z - 0.12],
        }))}
      />
      {S.stools.map(([x]) => (
        <Prop key={x} model="vasoSidra" position={[x, S.ledge.height + 0.06, S.ledge.z + 0.12]} />
      ))}

      {/* Barra de tablas oscuras con cesta de manzanas y vasos para degustar. */}
      <Counter
        width={S.bar.size[0]}
        depth={S.bar.size[1]}
        height={S.bar.height}
        body="darkWood"
        top="oak"
        position={[S.bar.center[0], S.floor, S.bar.center[1]]}
        front={
          <Text
            font={FONT.uiBold}
            fontSize={0.12}
            color={palette.paper}
            anchorX="center"
            anchorY="middle"
          >
            SIDRA DE LLAGAR
          </Text>
        }
      />
      {[-0.66, -0.33, 0, 0.33, 0.66].map((dx) => (
        <Block
          key={dx}
          size={[0.025, 0.72, 0.025]}
          position={[
            S.bar.center[0] + dx,
            S.floor + 0.56,
            S.bar.center[1] + S.bar.size[1] / 2 + 0.018,
          ]}
          material="oak"
        />
      ))}
      <ProductInstances
        product="botellaSidra"
        items={[
          { position: [S.bar.center[0] - 0.53, S.floor + S.bar.height, S.bar.center[1] - 0.12] },
          { position: [S.bar.center[0] + 0.53, S.floor + S.bar.height, S.bar.center[1] - 0.12] },
        ]}
      />
      <Prop
        model="vasoSidra"
        position={[S.bar.center[0] + 0.1, S.floor + S.bar.height, S.bar.center[1] + 0.12]}
      />
      <Prop
        model="cesta"
        position={[S.bar.center[0], S.floor + S.bar.height, S.bar.center[1] - 0.1]}
      />
      <ProductInstances
        product="manzana"
        items={[
          {
            position: [
              S.bar.center[0] - 0.1,
              S.floor + S.bar.height + 0.04,
              S.bar.center[1] - 0.15,
            ],
          },
          {
            position: [
              S.bar.center[0] + 0.1,
              S.floor + S.bar.height + 0.04,
              S.bar.center[1] - 0.15,
            ],
          },
          {
            position: [
              S.bar.center[0] - 0.1,
              S.floor + S.bar.height + 0.04,
              S.bar.center[1] - 0.05,
            ],
          },
          {
            position: [
              S.bar.center[0] + 0.1,
              S.floor + S.bar.height + 0.04,
              S.bar.center[1] - 0.05,
            ],
          },
        ]}
      />
      <Prop model="planta" position={[S.plant[0], S.floor, S.plant[1]]} scale={0.75} />
      <Spotlight
        position={[-1.05, 2.7, 0.05]}
        target={[-1.05, 1.1, 0.3]}
        intensity={20}
        angle={0.75}
      />
    </StandPlacement>
  )
}
