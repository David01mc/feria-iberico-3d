import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { standFrame } from '../../config/geometry'
import { JAMON } from '../../config/layouts'
import type { StandConfig } from '../../config/types'
import { FONT, fontUrl } from '../../materials/assets'
import { useTintedMaterial } from '../../materials/library'
import { alongLine, TINTS, withTints } from '../products/arrange'
import { HamOnStand } from '../products/HamOnStand'
import { ProductInstances } from '../products/ProductInstances'
import { Block } from '../props/Block'
import { Counter } from '../props/Counter'
import { LightBox } from '../props/LightBox'
import { Platform } from '../props/Platform'
import { Prop } from '../props/Prop'
import { Spotlight } from '../props/Spotlight'
import { StandPlacement } from './StandPlacement'

const J = JAMON
const BEAM_Y = J.pergolaTop - J.beam.height / 2
/** Los ganchos de los jamones cuelgan de la cara inferior de las vigas. */
const HOOK_Y = J.pergolaTop - J.beam.height
const POST_H = J.pergolaTop - J.floor
const BAR_TOP = J.floor + J.bar.height
const STATION_TOP = J.floor + J.stationHeight
/** Centro vertical del cuerpo de un mostrador (zócalo 0,10 + cuerpo sin encimera de 0,04). */
const bodyCenter = (height: number) => 0.1 + (height - 0.14) / 2
const SPOT_Y = HOOK_Y - 0.14

/**
 * Casa Bellotar · isla de 48 m²: bodega de jamones bajo una pérgola de roble oscuro con
 * 18 jamones colgados, barra de degustación, dos puestos de corte, tótem y corona de marca.
 */
export function JamonStand({ stand }: { stand: StandConfig }) {
  const { company } = stand
  const { palette } = company
  const brandFont = fontUrl(company.font)
  const { width, depth } = standFrame(stand.plot, stand.front)
  const lacquer = useTintedMaterial('lacquerWhite', palette.primary)
  const gold = useTintedMaterial('steelBrushed', palette.accent)

  const hams = useMemo(
    () =>
      withTints(
        J.hamRows.flatMap((z, row) =>
          alongLine([J.hamSpan[0], HOOK_Y, z], [J.hamSpan[1], HOOK_Y, z], J.hamsPerRow, {
            rotationJitter: 0.5,
            seed: 10 + row,
          }),
        ),
        TINTS.curing,
        21,
      ),
    [],
  )

  const [px, pz] = [J.posts[1]![0], J.posts[2]![1]]
  const [crownW, crownH, crownD] = J.crown.size
  const crownY = J.pergolaTop + crownH / 2

  const barBrand = (
    <Text font={brandFont} fontSize={0.2} color={palette.accent} anchorX="center" anchorY="middle">
      {company.name}
    </Text>
  )

  return (
    <StandPlacement stand={stand}>
      <Platform width={width} depth={depth} height={J.floor} surface="deck" />

      {/* Pérgola: postes, vigas perimetrales, vigas de colgar y viguetas. */}
      {J.posts.map(([x, z]) => (
        <Block
          key={`poste${x}${z}`}
          size={[J.postSize, POST_H, J.postSize]}
          position={[x, J.floor + POST_H / 2, z]}
          material="darkWood"
        />
      ))}
      {[-pz, pz].map((z) => (
        <Block
          key={`vx${z}`}
          size={[2 * px + J.postSize, J.beam.height, J.beam.width]}
          position={[0, BEAM_Y, z]}
          material="darkWood"
        />
      ))}
      {[-px, px].map((x) => (
        <Block
          key={`vz${x}`}
          size={[J.beam.width, J.beam.height, 2 * pz - J.postSize]}
          position={[x, BEAM_Y, 0]}
          material="darkWood"
        />
      ))}
      {J.hamRows.map((z) => (
        <Block
          key={`vj${z}`}
          size={[2 * px, J.beam.height * 0.9, 0.12]}
          position={[0, BEAM_Y, z]}
          material="darkWood"
        />
      ))}
      {Array.from({ length: 9 }, (_, i) => -3.2 + i * 0.8).map((x) => (
        <Block
          key={`vg${x}`}
          size={[0.07, 0.1, 2 * pz]}
          position={[x, J.pergolaTop - 0.05, 0]}
          material="darkWood"
        />
      ))}
      <ProductInstances product="jamonColgado" items={hams} />

      {/* Corona de marca sobre la pérgola. */}
      <Block
        size={[crownW, crownH, crownD]}
        position={[0, crownY, 0]}
        material={lacquer}
        radius={0.01}
      >
        {[crownH / 2 - 0.02, -crownH / 2 + 0.02].map((y) => (
          <Block
            key={y}
            size={[crownW + 0.02, 0.03, crownD + 0.02]}
            position={[0, y, 0]}
            material={gold}
            castShadow={false}
          />
        ))}
        {[0, Math.PI].map((r) => (
          <group key={`c${r}`} rotation-y={r}>
            <Text
              font={brandFont}
              fontSize={0.28}
              letterSpacing={0.06}
              color={palette.accent}
              anchorX="center"
              anchorY="middle"
              position={[0, 0, crownD / 2 + 0.004]}
            >
              {company.name.toUpperCase()}
            </Text>
          </group>
        ))}
        {[Math.PI / 2, -Math.PI / 2].map((r) => (
          <group key={`l${r}`} rotation-y={r}>
            <Text
              font={FONT.uiBold}
              fontSize={0.1}
              letterSpacing={0.2}
              color={palette.paper}
              anchorX="center"
              anchorY="middle"
              position={[0, 0, crownW / 2 + 0.004]}
            >
              {company.tagline.toUpperCase()}
            </Text>
          </group>
        ))}
      </Block>

      {/* Barra de degustación con taburetes a ambos lados. */}
      <Counter
        width={J.bar.size[0]}
        depth={J.bar.size[1]}
        height={J.bar.height}
        body={lacquer}
        top="darkWood"
        position={[0, J.floor, 0]}
        front={barBrand}
      />
      <group
        position={[0, J.floor + bodyCenter(J.bar.height), -J.bar.size[1] / 2 - 0.002]}
        rotation-y={Math.PI}
      >
        {barBrand}
      </group>
      {[-1.1, 0.2, 1.5].map((x) => (
        <ProductInstances
          key={x}
          product="platoJamon"
          items={[{ position: [x, BAR_TOP, 0], rotation: [0, x, 0] }]}
        />
      ))}
      <Prop model="botellasVino" position={[-2.05, BAR_TOP, 0.1]} />
      {J.stools.flatMap((x) =>
        [-1, 1].map((side) => (
          <Prop
            key={`t${x}${side}`}
            model="tabureteBarra"
            position={[x, J.floor, side * 0.88]}
            rotationY={side > 0 ? Math.PI : 0}
          />
        )),
      )}

      {/* Puestos de corte a cuchillo. */}
      {J.stations.map(([x, z]) => (
        <group key={`corte${x}`}>
          <Counter
            width={J.stationSize[0]}
            depth={J.stationSize[1]}
            height={J.stationHeight}
            body="lacquerBlack"
            top="oak"
            position={[x, J.floor, z]}
          />
          <HamOnStand at={[x - 0.15, STATION_TOP, z - 0.02]} />
          <ProductInstances
            product="platoJamon"
            items={[{ position: [x + 0.52, STATION_TOP, z + 0.12] }]}
          />
          <Spotlight position={[x, SPOT_Y, pz - 0.1]} target={[x, STATION_TOP, z]} light={false} />
        </group>
      ))}

      {/* Tótem luminoso de doble cara. */}
      <group position={[J.totem.center[0], 0, J.totem.center[1]]}>
        <Block
          size={[J.totem.size[0], 0.1, J.totem.size[1]]}
          position={[0, J.floor + 0.05, 0]}
          material="lacquerBlack"
        />
        <Block
          size={[1.0, J.totem.height - 0.3, 0.32]}
          position={[0, J.floor + 0.1 + (J.totem.height - 0.3) / 2, 0]}
          material={lacquer}
          radius={0.01}
        />
        {[0, Math.PI].map((r) => (
          <group key={r} rotation-y={r}>
            <LightBox
              width={0.78}
              height={2.7}
              depth={0.03}
              color={palette.paper}
              intensity={0.9}
              position={[0, J.floor + 2.0, 0.175]}
            >
              <Text
                font={brandFont}
                fontSize={0.3}
                color={palette.primary}
                anchorX="center"
                anchorY="middle"
                rotation-z={Math.PI / 2}
              >
                {company.name}
              </Text>
            </LightBox>
            <Text
              font={FONT.uiBold}
              fontSize={0.075}
              letterSpacing={0.25}
              color={palette.accent}
              anchorX="center"
              anchorY="middle"
              position={[0, J.floor + 3.6, 0.162]}
            >
              {`DESDE ${company.founded}`}
            </Text>
          </group>
        ))}
      </group>

      {/* Barricas con vino, olivo y luz de la barra. */}
      <Prop model="barrica" position={[J.barrels[0]![0], J.floor, J.barrels[0]![1]]} />
      <Prop
        model="botellasVino"
        position={[J.barrels[0]![0] - 0.3, J.floor + 0.872, J.barrels[0]![1]]}
      />
      <Prop
        model="barrica"
        position={[J.barrels[1]![0], J.floor, J.barrels[1]![1]]}
        rotationY={1.2}
      />
      <Prop model="jarra" position={[J.barrels[1]![0], J.floor + 0.872, J.barrels[1]![1]]} />
      <Prop model="olivo" position={[J.plant[0], J.floor, J.plant[1]]} />
      <Spotlight position={[0, SPOT_Y, 0]} target={[0, BAR_TOP, 0]} intensity={30} angle={0.75} />
      {[-2.2, -0.8, 0.8, 2.2].map((x) => (
        <Spotlight
          key={`fx${x}`}
          position={[x, SPOT_Y, -pz + 0.1]}
          target={[x * 0.6, 0.6, -1.4]}
          light={false}
        />
      ))}
    </StandPlacement>
  )
}
