import { Text } from '@react-three/drei'
import { standFrame } from '../../config/geometry'
import { ACEITUNAS } from '../../config/layouts'
import type { StandConfig } from '../../config/types'
import { FONT, fontUrl } from '../../materials/assets'
import { useMaterials, useTintedMaterial } from '../../materials/library'
import { Block } from '../props/Block'
import { Platform } from '../props/Platform'
import { Spotlight } from '../props/Spotlight'
import { OliveBins } from './OliveBins'
import { StandPlacement } from './StandPlacement'

const A = ACEITUNAS
const JAR_COLORS = ['#85933b', '#a7a950', '#454035', '#786038', '#b5a454', '#69753c', '#333439']
const JAR_X = [-2.15, -1.5, -0.85, -0.2, 0.45, 1.1, 1.75]
const MENU = ['MANZANILLA', 'GORDAL', 'KALAMATA', 'NEGRAS', 'BANDERILLAS']

/** Tarro de cristal con aceitunas en salmuera y tapa metálica. */
function OliveJar({ position, color }: { position: [number, number, number]; color: string }) {
  const materials = useMaterials()
  return (
    <group position={position}>
      <mesh position={[0, 0.13, 0]} castShadow>
        <cylinderGeometry args={[0.096, 0.096, 0.25, 14]} />
        <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.55} />
      </mesh>
      <mesh position={[0, 0.135, 0]} material={materials.glass}>
        <cylinderGeometry args={[0.105, 0.105, 0.27, 14]} />
      </mesh>
      <mesh position={[0, 0.282, 0]} material={materials.steelBrushed} castShadow>
        <cylinderGeometry args={[0.108, 0.108, 0.025, 14]} />
      </mesh>
    </group>
  )
}

/** Mercado de aceitunas: cubetas a granel, pizarra de variedades y tarros para llevar. */
export function AceitunasStand({ stand }: { stand: StandConfig }) {
  const { company } = stand
  const { palette } = company
  const { width, depth } = standFrame(stand.plot, stand.front)
  const green = useTintedMaterial('lacquerWhite', palette.primary)
  const red = useTintedMaterial('lacquerWhite', palette.secondary)
  const t = A.wallThickness
  const displayTop = A.floor + A.display.bodyHeight
  const displayFront = A.display.center[1] + A.display.size[1] / 2

  return (
    <StandPlacement stand={stand}>
      <Platform
        width={width - 2 * A.floorInset}
        depth={depth - 2 * A.floorInset}
        height={A.floor}
        surface="terracotta"
        edge="darkWood"
      />

      {/* Trasera de mercado y lateral cerrado: ambos dentro de la parcela. */}
      <Block
        size={[width - 2 * A.wallInset - t, A.wallHeight, t]}
        position={[t / 2, A.wallHeight / 2, -depth / 2 + A.wallInset + t / 2]}
        material="plaster"
      />
      <Block
        size={[t, A.wallHeight, depth - 2 * A.wallInset]}
        position={[-width / 2 + A.wallInset + t / 2, A.wallHeight / 2, 0]}
        material="tiles"
      />
      <Block size={[width - 0.22, 0.11, 1.48]} position={[0, 3.29, -0.65]} material="oak" />
      <Block size={[4.8, 0.46, 0.08]} position={[0, 3.03, 0.12]} material={green}>
        <Text
          font={fontUrl(company.font)}
          fontSize={0.31}
          color={palette.paper}
          anchorX="center"
          anchorY="middle"
          position={[0, 0.055, 0.048]}
        >
          {company.name}
        </Text>
        <Text
          font={FONT.uiBold}
          fontSize={0.076}
          letterSpacing={0.14}
          color={palette.accent}
          anchorX="center"
          anchorY="middle"
          position={[0, -0.15, 0.049]}
        >
          ACEITUNAS Y ENCURTIDOS A GRANEL
        </Text>
      </Block>

      {/* Carta negra de mercado; detrás quedan los tarros y sus baldas de madera. */}
      <Block size={[5.12, 0.58, 0.055]} position={[0, 2.64, -1.275]} material="chalkboard">
        <Text
          font={FONT.uiBold}
          fontSize={0.105}
          letterSpacing={0.08}
          color={palette.accent}
          anchorX="center"
          anchorY="middle"
          position={[0, 0.16, 0.034]}
        >
          ELIGE TU MEZCLA
        </Text>
        {MENU.map((item, i) => (
          <Text
            key={item}
            font={FONT.uiBold}
            fontSize={0.071}
            color={palette.paper}
            anchorX="center"
            anchorY="middle"
            position={[-2.02 + i * 1.01, -0.035, 0.035]}
          >
            {item}
          </Text>
        ))}
        <Text
          font={FONT.ui}
          fontSize={0.074}
          color={palette.accent}
          anchorX="center"
          anchorY="middle"
          position={[0, -0.19, 0.035]}
        >
          DESDE 2,50 € / 100 G · PUEDES COMBINARLAS
        </Text>
      </Block>
      {A.backShelf.levels.map((y, row) => (
        <group key={y}>
          <Block
            size={[A.backShelf.width, 0.055, A.backShelf.depth]}
            position={[A.backShelf.center[0], y - 0.0275, A.backShelf.center[1]]}
            material="oak"
          />
          {JAR_X.map((x, i) => (
            <OliveJar
              key={`${row}-${x}`}
              position={[x, y, A.backShelf.center[1]]}
              color={JAR_COLORS[(i + row * 3) % JAR_COLORS.length]!}
            />
          ))}
        </group>
      ))}

      {/* Vitrina: madera oscura, diez cubetas y cristal ligero sin tapar el producto. */}
      <Block
        size={[A.display.size[0], A.display.bodyHeight, A.display.size[1]]}
        position={[A.display.center[0], A.floor + A.display.bodyHeight / 2, A.display.center[1]]}
        material="darkWood"
      />
      <Block
        size={[4.38, 0.55, 0.025]}
        position={[0, 0.59, displayFront + 0.014]}
        material={green}
      />
      <Text
        font={fontUrl(company.font)}
        fontSize={0.24}
        color={palette.paper}
        anchorX="center"
        anchorY="middle"
        position={[0, 0.67, displayFront + 0.032]}
      >
        {company.name}
      </Text>
      <Text
        font={FONT.uiBold}
        fontSize={0.085}
        color={palette.accent}
        anchorX="center"
        anchorY="middle"
        position={[0, 0.45, displayFront + 0.033]}
      >
        DE LA TIERRA · ALIÑADAS CADA DÍA
      </Text>
      <OliveBins />
      <Block
        size={[A.display.size[0] - 0.06, 0.54, 0.012]}
        position={[0, displayTop + 0.27, displayFront + 0.018]}
        material="glass"
        castShadow={false}
      />
      {[-1, 1].map((side) => (
        <Block
          key={side}
          size={[0.012, 0.54, A.display.size[1] - 0.06]}
          position={[
            side * (A.display.size[0] / 2 - 0.018),
            displayTop + 0.27,
            A.display.center[1],
          ]}
          material="glass"
          castShadow={false}
        />
      ))}
      <Block
        size={[A.display.size[0] - 0.05, 0.012, A.display.size[1] - 0.13]}
        position={[0, displayTop + 0.54, A.display.center[1] - 0.03]}
        material="glass"
        castShadow={false}
      />
      <Block
        size={[A.display.size[0], 0.035, 0.035]}
        position={[0, displayTop + 0.55, displayFront + 0.02]}
        material="steelBrushed"
      />

      {/* Mueble estrecho de tarros junto a la entrada lateral. */}
      {[-1, 1].map((side) => (
        <Block
          key={`rack-side-${side}`}
          size={[0.055, A.rack.height, A.rack.size[1]]}
          position={[
            A.rack.center[0] + side * (A.rack.size[0] / 2 - 0.0275),
            A.floor + A.rack.height / 2,
            A.rack.center[1],
          ]}
          material={red}
        />
      ))}
      <Block
        size={[A.rack.size[0] - 0.11, A.rack.height, 0.045]}
        position={[
          A.rack.center[0],
          A.floor + A.rack.height / 2,
          A.rack.center[1] - A.rack.size[1] / 2 + 0.0225,
        ]}
        material={red}
      />
      <Block
        size={[A.rack.size[0], 0.055, A.rack.size[1]]}
        position={[A.rack.center[0], A.floor + A.rack.height - 0.0275, A.rack.center[1]]}
        material={red}
      />
      <Block
        size={[A.rack.size[0] - 0.08, 0.38, 0.03]}
        position={[A.rack.center[0], 2.02, A.rack.center[1] + A.rack.size[1] / 2 + 0.018]}
        material={green}
      >
        <Text
          font={FONT.uiBold}
          fontSize={0.085}
          color={palette.paper}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.021]}
        >
          PARA LLEVAR
        </Text>
      </Block>
      {[0.52, 1.08, 1.64].map((y, i) => (
        <group key={y}>
          <Block
            size={[A.rack.size[0] - 0.08, 0.035, A.rack.size[1] - 0.07]}
            position={[A.rack.center[0], y - 0.02, A.rack.center[1] + 0.02]}
            material="oak"
          />
          <OliveJar
            position={[A.rack.center[0], y, A.rack.center[1] + 0.08]}
            color={JAR_COLORS[i * 2]!}
          />
        </group>
      ))}

      <Spotlight
        position={[-1.4, 3.12, -0.17]}
        target={[-1, 1.15, 0.7]}
        intensity={24}
        angle={0.65}
      />
      <Spotlight position={[1.4, 3.12, -0.17]} target={[1, 1.15, 0.7]} light={false} />
    </StandPlacement>
  )
}
