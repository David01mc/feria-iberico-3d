import { Text } from '@react-three/drei'
import { standFrame } from '../../config/geometry'
import { VINOS } from '../../config/layouts'
import type { StandConfig } from '../../config/types'
import { FONT, fontUrl } from '../../materials/assets'
import { useTintedMaterial } from '../../materials/library'
import { ProductInstances } from '../products/ProductInstances'
import { Block } from '../props/Block'
import { Counter } from '../props/Counter'
import { LightBox } from '../props/LightBox'
import { Platform } from '../props/Platform'
import { Prop } from '../props/Prop'
import { Spotlight } from '../props/Spotlight'
import { StandPlacement } from './StandPlacement'

const V = VINOS

/** Bodega blanca y negra con tres vitrinas de vino y un lounge lateral. */
export function VinosStand({ stand }: { stand: StandConfig }) {
  const { company } = stand
  const { palette } = company
  const { width, depth } = standFrame(stand.plot, stand.front)
  const black = useTintedMaterial('lacquerBlack', palette.primary)
  const gold = useTintedMaterial('steelBrushed', palette.accent)

  return (
    <StandPlacement stand={stand}>
      <Platform
        width={width - 2 * V.floorInset}
        depth={depth - 2 * V.floorInset}
        height={V.floor}
        surface="darkWood"
        edge={gold}
      />

      {/* Pared caligráfica y vitrinas retroiluminadas. */}
      <Block
        size={[V.wall.x[1] - V.wall.x[0], V.wall.height, V.wall.depth]}
        position={[(V.wall.x[0] + V.wall.x[1]) / 2, V.wall.height / 2, V.wall.z + V.wall.depth / 2]}
        material={black}
      />
      {V.windows.x.map((x, i) => (
        <group key={x}>
          <LightBox
            width={V.windows.width}
            height={V.windows.height}
            depth={0.05}
            color={palette.paper}
            position={[x, V.windows.bottom + V.windows.height / 2, V.wall.z + V.wall.depth + 0.026]}
          >
            <Text
              font={FONT.uiBold}
              fontSize={0.085}
              color={palette.primary}
              anchorX="center"
              anchorY="middle"
              position={[0, 0.43, 0.002]}
            >
              {company.products[i]?.toUpperCase()}
            </Text>
          </LightBox>
          <Block
            size={[0.64, 0.035, 0.25]}
            position={[x, V.windows.bottom + 0.19, -2.43]}
            material={gold}
          />
          <ProductInstances
            product={i === 2 ? 'botellaCava' : 'botellaVino'}
            items={[
              { position: [x - 0.2, V.windows.bottom + 0.21, -2.43] },
              { position: [x, V.windows.bottom + 0.21, -2.43] },
              { position: [x + 0.2, V.windows.bottom + 0.21, -2.43] },
            ]}
          />
        </group>
      ))}

      {/* Lounge contra el único lado cerrado. */}
      <Block
        size={[V.lounge.wall, V.lounge.height, depth]}
        position={[V.lounge.x[0] + V.lounge.wall / 2, V.lounge.height / 2, 0]}
        material={black}
      />
      <Block
        size={[V.lounge.x[1] - V.lounge.x[0], V.lounge.wall, V.lounge.z[1] - V.lounge.z[0]]}
        position={[
          (V.lounge.x[0] + V.lounge.x[1]) / 2,
          V.lounge.ceiling,
          (V.lounge.z[0] + V.lounge.z[1]) / 2,
        ]}
        material={black}
      />
      <Prop
        model="sofa"
        position={[V.sofa.center[0], V.floor, V.sofa.center[1]]}
        rotationY={Math.PI / 2}
      />
      <Prop
        model="mesaBaja"
        position={[V.table.center[0], V.floor, V.table.center[1]]}
        rotationY={Math.PI / 2}
      />
      {V.armchairs.map(([x, z]) => (
        <Prop key={z} model="butaca" position={[x, V.floor, z]} rotationY={-Math.PI / 2} />
      ))}
      <Prop
        model="copaVino"
        position={[V.table.center[0], V.floor + 0.4, V.table.center[1] - 0.17]}
      />
      <Prop
        model="copaVino"
        position={[V.table.center[0], V.floor + 0.4, V.table.center[1] + 0.17]}
      />

      {/* Bandeja superior blanca y rótulo sobre el frente. */}
      <Block
        size={[V.canopy.x[1] - V.canopy.x[0], V.canopy.height, V.canopy.z[1] - V.canopy.z[0]]}
        position={[
          (V.canopy.x[0] + V.canopy.x[1]) / 2,
          V.canopy.bottom + V.canopy.height / 2,
          (V.canopy.z[0] + V.canopy.z[1]) / 2,
        ]}
        material="lacquerWhite"
      />
      <Text
        font={fontUrl(company.font)}
        fontSize={0.32}
        color={palette.primary}
        anchorX="center"
        anchorY="middle"
        position={[1.1, V.canopy.bottom + 0.34, V.canopy.z[1] + 0.006]}
      >
        {company.name}
      </Text>
      <Text
        font={FONT.uiBold}
        fontSize={0.09}
        color={palette.accent}
        anchorX="center"
        anchorY="middle"
        position={[1.1, V.canopy.bottom + 0.11, V.canopy.z[1] + 0.008]}
      >
        {company.origin.toUpperCase()}
      </Text>

      {/* Barra de cata abierta al pasillo. */}
      <Counter
        width={V.counter.size[0]}
        depth={V.counter.size[1]}
        height={V.counter.height}
        body={black}
        top="ceramicWhite"
        position={[V.counter.center[0], V.floor, V.counter.center[1]]}
        front={
          <Text
            font={fontUrl(company.font)}
            fontSize={0.16}
            color={palette.accent}
            anchorX="center"
            anchorY="middle"
          >
            {company.name}
          </Text>
        }
      />
      {[-0.7, 0, 0.7].map((dx) => (
        <Prop
          key={dx}
          model="tabureteTapizado"
          position={[V.counter.center[0] + dx, V.floor, V.counter.center[1] + 0.7]}
          brandColor={palette.primary}
        />
      ))}
      <ProductInstances
        product="botellaVino"
        items={[-0.7, 0.55].map((dx) => ({
          position: [
            V.counter.center[0] + dx,
            V.floor + V.counter.height,
            V.counter.center[1] - 0.1,
          ],
        }))}
      />
      {[-0.35, 0, 0.35].map((dx) => (
        <Prop
          key={dx}
          model="copaVino"
          position={[
            V.counter.center[0] + dx,
            V.floor + V.counter.height,
            V.counter.center[1] + 0.12,
          ]}
        />
      ))}
      <Block
        size={[V.giftBoxes.size[0], 0.7, V.giftBoxes.size[1]]}
        position={[V.giftBoxes.center[0], V.floor + 0.35, V.giftBoxes.center[1]]}
        material={black}
      />
      <Prop model="urna" position={[V.giftBoxes.center[0], V.floor + 0.7, V.giftBoxes.center[1]]} />
      <ProductInstances
        product="botellaCava"
        items={[
          {
            position: [V.giftBoxes.center[0], V.floor + 0.72, V.giftBoxes.center[1]],
          },
        ]}
      />
      <Spotlight
        position={[1, 2.93, 0.8]}
        target={[1, V.floor + 1, 1.9]}
        intensity={22}
        angle={0.7}
      />
    </StandPlacement>
  )
}
