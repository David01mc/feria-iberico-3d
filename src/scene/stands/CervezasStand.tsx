import { Text } from '@react-three/drei'
import { standFrame } from '../../config/geometry'
import { CERVEZAS } from '../../config/layouts'
import type { StandConfig } from '../../config/types'
import { FONT, fontUrl } from '../../materials/assets'
import { useTintedMaterial } from '../../materials/library'
import { ProductInstances } from '../products/ProductInstances'
import { Block } from '../props/Block'
import { Platform } from '../props/Platform'
import { Prop } from '../props/Prop'
import { Spotlight } from '../props/Spotlight'
import { StandPlacement } from './StandPlacement'

const C = CERVEZAS

/** Cervecera artesana: módulo de feria vestido con palés, tres grifos y cajas de pino. */
export function CervezasStand({ stand }: { stand: StandConfig }) {
  const { company } = stand
  const { palette } = company
  const { width, depth } = standFrame(stand.plot, stand.front)
  const red = useTintedMaterial('lacquerWhite', palette.primary)

  return (
    <StandPlacement stand={stand}>
      <Platform
        width={width - 2 * C.floorInset}
        depth={depth - 2 * C.floorInset}
        height={C.floor}
        surface="pine"
      />
      {/* La perfilería sigue siendo visible detrás del revestimiento de palés. */}
      <Block
        size={[width - 2 * C.sideInset, C.panelHeight, C.panelThickness]}
        position={[0, C.panelHeight / 2, -depth / 2 + C.panelInset + C.panelThickness / 2]}
        material="lacquerWhite"
      />
      <Block
        size={[C.panelThickness, C.panelHeight, depth - 2 * C.sideInset]}
        position={[width / 2 - C.sideInset - C.panelThickness / 2, C.panelHeight / 2, 0]}
        material="lacquerWhite"
      />
      {[-width / 2 + C.sideInset + 0.03, width / 2 - C.sideInset - 0.03].map((x) => (
        <Block
          key={x}
          size={[0.06, C.panelHeight, 0.06]}
          position={[x, C.panelHeight / 2, C.rearFrameZ]}
          material="aluminium"
        />
      ))}
      <Block
        size={[width - 2 * C.sideInset, 0.07, 0.07]}
        position={[0, C.panelHeight, C.rearFrameZ]}
        material="aluminium"
      />
      <Block
        size={[0.07, 0.07, depth - 2 * C.sideInset]}
        position={[width / 2 - C.sideInset - 0.035, C.panelHeight, 0]}
        material="aluminium"
      />

      {/* Palés verticales: tres columnas y tres alturas, con tablas mirando al pasillo. */}
      {Array.from({ length: C.palletWall.rows }, (_, row) =>
        Array.from({ length: C.palletWall.cols }, (_, col) => (
          <group
            key={`${row}-${col}`}
            position={[-1.2 + col * 1.2, 0.025 + (row + 0.5) * 0.8, C.palletWall.z]}
            rotation-x={Math.PI / 2}
          >
            <Prop model="pale" />
          </group>
        )),
      )}
      <Block size={[3.9, 0.5, 0.09]} position={[0, 2.7, -1.32]} material={red}>
        <Text
          font={fontUrl(company.font)}
          fontSize={0.33}
          color={palette.paper}
          anchorX="center"
          anchorY="middle"
          position={[0, 0.02, 0.052]}
        >
          {company.name.toUpperCase()}
        </Text>
      </Block>
      <Text
        font={FONT.uiBold}
        fontSize={0.1}
        color={palette.accent}
        anchorX="center"
        anchorY="middle"
        position={[0, 2.28, -1.24]}
      >
        {company.tagline.toUpperCase()}
      </Text>

      {/* Tres módulos de servicio con producto y cañas. */}
      {C.counters.map((x, i) => (
        <group key={x}>
          <Prop
            model="mostradorCajon"
            position={[x, 0.025, C.counterZ]}
            brandColor={palette.primary}
          />
          <Text
            font={FONT.uiBold}
            fontSize={0.085}
            color={palette.paper}
            anchorX="center"
            anchorY="middle"
            position={[x, 0.58, C.counterZ + 0.315]}
          >
            {company.products[i]?.toUpperCase()}
          </Text>
          <ProductInstances
            product="botellaCerveza"
            items={[
              {
                position: [x - 0.3, 1.025, C.counterZ - 0.1],
              },
            ]}
          />
          <Prop model="vasoCerveza" position={[x + 0.25, 1.025, C.counterZ + 0.05]} />
        </group>
      ))}
      <Prop
        model="torreGrifos"
        position={[C.counters[1]!, 1.025, C.counterZ - 0.05]}
        brandColor={palette.primary}
      />
      <Prop model="barrilCerveza" position={[2.3, 0.025, -0.67]} />

      {/* Jardineras de cajas y expositor junto al lateral abierto. */}
      {C.planters.map(([x, z], i) => (
        <group key={x}>
          <Prop model="cajaMadera" position={[x, 0.025, z]} scale={0.7} />
          <Prop
            model={i === 0 ? 'planta' : 'plantaGrande'}
            position={[x, 0.27, z]}
            scale={i === 0 ? 0.55 : 0.42}
          />
        </group>
      ))}
      {[-0.27, 0.27].flatMap((dx) =>
        [-0.19, 0.19].map((dz) => (
          <Block
            key={`${dx}-${dz}`}
            size={[0.035, C.rack.height, 0.035]}
            position={[C.rack.center[0] + dx, C.rack.height / 2, C.rack.center[1] + dz]}
            material="steelBlack"
          />
        )),
      )}
      {[0.45, 0.95, 1.45].map((y) => (
        <group key={y}>
          <Block
            size={[0.56, 0.035, 0.42]}
            position={[C.rack.center[0], y, C.rack.center[1]]}
            material="pine"
          />
          <ProductInstances
            product="botellaCerveza"
            items={[-0.16, 0, 0.16].map((dx) => ({
              position: [C.rack.center[0] + dx, y + 0.02, C.rack.center[1]],
            }))}
          />
        </group>
      ))}
      <Spotlight position={[0, 2.4, 0.2]} target={[0, 0.9, 0.7]} intensity={20} angle={0.9} />
    </StandPlacement>
  )
}
