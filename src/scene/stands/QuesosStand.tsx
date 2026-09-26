import { Text } from '@react-three/drei'
import { standFrame } from '../../config/geometry'
import { QUESOS } from '../../config/layouts'
import type { StandConfig } from '../../config/types'
import { FONT, fontUrl } from '../../materials/assets'
import { alongLine, wheelStack } from '../products/arrange'
import { ProductInstances } from '../products/ProductInstances'
import { MODELS } from '../props/catalog'
import { Block } from '../props/Block'
import { Counter } from '../props/Counter'
import { Platform } from '../props/Platform'
import { Prop } from '../props/Prop'
import { Shelving } from '../props/Shelving'
import { Spotlight } from '../props/Spotlight'
import { StandPlacement } from './StandPlacement'

const Q = QUESOS
const WHEEL = { radius: 0.108, height: 0.1 }
/** Altura de la cuerda de las lámparas: el modelo mide 1,17 m del gancho a la base. */
const LAMP_Y = Q.lampBeam.y - 0.09 - 1.17
const COUNTER_TOP = Q.floor + Q.counter.height
const TRAY = MODELS.vitrinaRefrigerada.surfaces.bandeja

/** Contenido de cada balda de maduración (de abajo arriba). */
function cheeseShelf(unit: number) {
  return (_level: number, index: number) => {
    const seed = unit * 10 + index
    switch (index) {
      case 0:
      case 2:
        return (
          <ProductInstances
            product={index === 0 ? 'quesoCurado' : 'quesoPimenton'}
            items={wheelStack([0, 0, 0], { ...WHEEL, layers: [7, 6], seed })}
          />
        )
      case 1:
        return (
          <ProductInstances
            product={unit === 0 ? 'quesoPimenton' : 'quesoCurado'}
            items={wheelStack([0, 0, 0], { ...WHEEL, layers: [7, 6], seed })}
          />
        )
      default:
        return (
          <>
            <Prop model="cesta" position={[-0.5, 0, 0]} />
            <ProductInstances
              product="torta"
              items={alongLine([0, 0, 0], [0.75, 0, 0], 3, { rotationJitter: 3, seed })}
            />
          </>
        )
    }
  }
}

/**
 * Quesería Cerro Albar · 18 m² en línea: quesería artesana encalada con suelo de barro,
 * dintel de madera, estanterías de maduración, vitrina refrigerada y mostrador de cata.
 */
export function QuesosStand({ stand }: { stand: StandConfig }) {
  const { company } = stand
  const { palette } = company
  const brandFont = fontUrl(company.font)
  const { width, depth } = standFrame(stand.plot, stand.front)
  const t = Q.wallThickness
  const [vx, vz] = Q.vitrina
  const [cx, cz] = Q.counter.center

  return (
    <StandPlacement stand={stand}>
      <Platform
        width={width - 2 * Q.floorInset}
        depth={depth - 2 * Q.floorInset}
        height={Q.floor}
        surface="terracotta"
      />

      {/* Paredes encaladas, pilares y dintel de madera. */}
      <Block
        size={[width - 2 * Q.wallInset - 2 * t, Q.wallHeight, t]}
        position={[0, Q.wallHeight / 2, -depth / 2 + Q.wallInset + t / 2]}
        material="plaster"
      />
      {[-1, 1].map((s) => (
        <Block
          key={`m${s}`}
          size={[t, Q.wallHeight, depth - 2 * Q.wallInset]}
          position={[s * (width / 2 - Q.wallInset - t / 2), Q.wallHeight / 2, 0]}
          material="plaster"
        />
      ))}
      {Q.pillars.map(([x, z]) => (
        <Block
          key={`pl${x}`}
          size={[Q.pillarSize, Q.pillarHeight, Q.pillarSize]}
          position={[x, Q.pillarHeight / 2, z]}
          material="plaster"
        />
      ))}
      <Block
        size={[width - 2 * Q.wallInset, Q.lintel.height, Q.lintel.depth]}
        position={[0, Q.pillarHeight + Q.lintel.height / 2, Q.lintel.z]}
        material="roughWood"
      >
        <Text
          font={FONT.uiBold}
          fontSize={0.1}
          letterSpacing={0.3}
          color={palette.paper}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, Q.lintel.depth / 2 + 0.003]}
        >
          {`QUESERÍA ARTESANA · DESDE ${company.founded}`}
        </Text>
      </Block>
      <Block
        size={[width - 2 * t, 0.18, 0.14]}
        position={[0, Q.lampBeam.y, Q.lampBeam.z]}
        material="roughWood"
      />

      {/* Rótulo pintado en la pared del fondo. */}
      <group position={[0, 0, -depth / 2 + Q.wallInset + t + 0.003]}>
        <Text
          font={brandFont}
          fontSize={0.36}
          color={palette.primary}
          anchorX="center"
          anchorY="middle"
          position={[0, 2.64, 0]}
        >
          {company.name}
        </Text>
        <Text
          font={FONT.ui}
          fontSize={0.1}
          letterSpacing={0.12}
          color={palette.ink}
          anchorX="center"
          anchorY="middle"
          position={[0, 2.38, 0]}
        >
          {`${company.tagline} · ${company.origin}`.toUpperCase()}
        </Text>
      </group>

      {/* Estanterías de maduración. */}
      {Q.shelves.map(([x, z], unit) => (
        <Shelving
          key={`e${x}`}
          width={Q.shelfSize[0]}
          height={Q.shelfHeight}
          depth={Q.shelfSize[1]}
          shelves={4}
          position={[x, Q.floor, z]}
          renderShelf={cheeseShelf(unit)}
        />
      ))}

      {/* Vitrina refrigerada surtida. */}
      <Prop model="vitrinaRefrigerada" position={[vx, Q.floor, vz]} brandColor={palette.primary} />
      <group position={[vx + TRAY.center[0], Q.floor + TRAY.center[1], vz + TRAY.center[2]]}>
        <ProductInstances
          product="quesoCortado"
          items={[{ position: [-0.45, 0, 0], rotation: [0, 2.3, 0] }]}
        />
        <ProductInstances
          product="cunaQueso"
          items={alongLine([-0.15, 0, 0.1], [0.25, 0, 0.1], 3, { rotationJitter: 0.4, seed: 4 })}
        />
        <ProductInstances product="torta" items={[{ position: [0.5, 0, -0.05] }]} />
        <ProductInstances
          product="quesoPimenton"
          items={[{ position: [0.05, 0, -0.14], rotation: [0, 0.4, 0] }]}
        />
      </group>

      {/* Mostrador de cata. */}
      <Counter
        width={Q.counter.size[0]}
        depth={Q.counter.size[1]}
        height={Q.counter.height}
        body="plaster"
        top="oak"
        position={[cx, Q.floor, cz]}
      />
      <Prop model="tablaServir" position={[cx - 0.35, COUNTER_TOP, cz]} />
      <ProductInstances
        product="cunaQueso"
        items={alongLine(
          [cx - 0.45, COUNTER_TOP + 0.03, cz],
          [cx - 0.25, COUNTER_TOP + 0.03, cz],
          2,
          { rotationJitter: 0.6, seed: 8 },
        )}
      />
      <ProductInstances
        product="quesoCortado"
        items={[{ position: [cx + 0.2, COUNTER_TOP, cz - 0.05], rotation: [0, -0.8, 0] }]}
      />
      <Prop model="cajaQueso" position={[cx + 0.55, COUNTER_TOP, cz + 0.12]} rotationY={0.3} />
      <Prop model="jarra" position={[cx + 0.55, COUNTER_TOP, cz - 0.15]} />

      {/* Caja de madera con ruedas, pizarra y lámparas. */}
      <Prop
        model="cajaMadera"
        position={[Q.crate.center[0], Q.floor, Q.crate.center[1]]}
        rotationY={Math.PI / 2}
      />
      <ProductInstances
        product="quesoCurado"
        items={alongLine(
          [Q.crate.center[0], Q.floor + 0.342, Q.crate.center[1] - 0.25],
          [Q.crate.center[0], Q.floor + 0.342, Q.crate.center[1] + 0.25],
          2,
          { rotationJitter: 3, seed: 6 },
        )}
      />
      <Prop
        model="pizarra"
        position={[Q.board[0], Q.floor, Q.board[1]]}
        rotationY={0.35}
        scale={0.9}
      />
      {[vx, cx].map((x) => (
        <Prop key={`l${x}`} model="lamparaColgante" position={[x, LAMP_Y, Q.lampBeam.z]} />
      ))}
      {/* Un único foco real (baña las dos estanterías); los demás solo decoran. */}
      <Spotlight
        position={[0, Q.pillarHeight - 0.12, Q.lintel.z - 0.2]}
        target={[0, 1.1, -1.1]}
        intensity={26}
        angle={0.95}
        penumbra={0.8}
      />
      {Q.shelves.map(([x]) => (
        <Spotlight
          key={`s${x}`}
          position={[x * 0.9, Q.pillarHeight - 0.12, Q.lintel.z - 0.2]}
          target={[x, 1.2, -1.1]}
          light={false}
        />
      ))}
    </StandPlacement>
  )
}
