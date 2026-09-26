import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { FONT } from '../../materials/assets'
import type { Vec3 } from '../../materials/geometry'
import { alongLine, gridOnSurface, TINTS, wheelStack, withTints } from '../products/arrange'
import { HamOnStand } from '../products/HamOnStand'
import { ProductInstances } from '../products/ProductInstances'
import { BoxTruss } from '../props/BoxTruss'
import { MODELS, type Surface } from '../props/catalog'
import { Counter } from '../props/Counter'
import { Prop } from '../props/Prop'
import { Shelving } from '../props/Shelving'

const COUNTER_H = 1.05
/** Los ganchos cuelgan de la cara inferior del truss de 29 cm. */
const HOOK_Y = -0.145
const add = (a: Vec3, b: readonly number[]): Vec3 => [a[0] + b[0]!, a[1] + b[1]!, a[2] + b[2]!]

function Label({ x, children }: { x: number; children: string }) {
  return (
    <Text
      font={FONT.ui}
      fontSize={0.13}
      color="#4a4640"
      anchorX="center"
      anchorY="middle"
      position={[x, 0.003, 0.9]}
      rotation-x={-Math.PI / 2}
      maxWidth={2}
      textAlign="center"
    >
      {children}
    </Text>
  )
}

/** Piezas colgadas de un tramo de truss (jamones, sartas, salchichones). */
function HangingRow({
  from,
  to,
  product,
  count,
  seed,
}: {
  from: Vec3
  to: Vec3
  product: 'jamonColgado' | 'chorizoSarta' | 'chorizoVela' | 'salchichon'
  count: number
  seed: number
}) {
  const items = useMemo(
    () =>
      withTints(
        alongLine(add(from, [0, HOOK_Y, 0]), add(to, [0, HOOK_Y, 0]), count, {
          rotationJitter: 0.6,
          seed,
        }),
        TINTS.curing,
        seed,
      ),
    [from, to, count, seed],
  )
  return (
    <>
      <BoxTruss from={add(from, [-0.1, 0, 0])} to={add(to, [0.1, 0, 0])} />
      <ProductInstances product={product} items={items} />
    </>
  )
}

/**
 * Productos ibéricos en situación: así se verán en los stands (Fase 5), con el mobiliario y
 * las reglas de colocación reales.
 */
export function ProductShowcase() {
  const croquetas = useMemo(() => {
    const at: Vec3 = [5.6, COUNTER_H, 0]
    const { inferior, superior } = MODELS.vitrinaCaliente.surfaces
    const tray = (surface: Surface, seed: number) =>
      gridOnSurface(
        { center: add(at, surface.center), size: surface.size },
        { spacing: [0.068, 0.036], margin: 0.02, jitter: 0.003, rotationJitter: 0.12, seed },
      )
    return withTints([...tray(inferior, 3), ...tray(superior, 4)], TINTS.frying, 8)
  }, [])

  const cheeseShelf = (level: number, index: number) => {
    void level
    switch (index) {
      case 0:
        return (
          <ProductInstances
            product="quesoCurado"
            items={wheelStack([0, 0, 0], { radius: 0.108, height: 0.1, layers: [5, 4], seed: 2 })}
          />
        )
      case 1:
        return (
          <ProductInstances
            product="quesoPimenton"
            items={wheelStack([0, 0, 0], { radius: 0.108, height: 0.1, layers: [5], seed: 3 })}
          />
        )
      case 2:
        return (
          <>
            <ProductInstances
              product="quesoCortado"
              items={[{ position: [-0.42, 0, 0], rotation: [0, 0.6, 0] }]}
            />
            <ProductInstances
              product="torta"
              items={alongLine([-0.15, 0, 0], [0.55, 0, 0], 3, { rotationJitter: 3, seed: 4 })}
            />
          </>
        )
      default:
        return (
          <ProductInstances
            product="cunaQueso"
            items={alongLine([-0.55, 0, 0.02], [0.55, 0, 0.02], 7, {
              rotationJitter: 0.4,
              baseRotation: [0, Math.PI / 2, 0],
              seed: 5,
            })}
          />
        )
    }
  }

  return (
    <group name="product-showcase">
      {/* Jamón: loncheado a cuchillo y plato. */}
      <Counter width={1.5} depth={0.7} top="darkWood" position={[-9, 0, 0]} />
      <HamOnStand at={[-9.3, COUNTER_H, 0]} />
      <ProductInstances product="platoJamon" items={[{ position: [-8.55, COUNTER_H, 0.08] }]} />
      <Label x={-9}>Jamón al corte y plato</Label>

      <HangingRow
        from={[-7.4, 2.4, 0]}
        to={[-5.6, 2.4, 0]}
        product="jamonColgado"
        count={4}
        seed={1}
      />
      <Label x={-6.5}>Jamones colgados</Label>

      <Shelving
        width={1.4}
        height={1.7}
        depth={0.42}
        shelves={4}
        position={[-3.6, 0, 0]}
        renderShelf={cheeseShelf}
      />
      <Label x={-3.6}>Quesos: ruedas, cuñas y tortas</Label>

      <HangingRow
        from={[-1.5, 2.3, 0.15]}
        to={[0.1, 2.3, 0.15]}
        product="chorizoSarta"
        count={6}
        seed={2}
      />
      <HangingRow
        from={[-1.5, 2.3, -0.3]}
        to={[0.1, 2.3, -0.3]}
        product="salchichon"
        count={5}
        seed={3}
      />
      <HangingRow
        from={[-1.5, 2.3, -0.7]}
        to={[0.1, 2.3, -0.7]}
        product="chorizoVela"
        count={6}
        seed={4}
      />
      <Label x={-0.7}>Embutidos colgados</Label>

      <Counter width={1.4} depth={0.7} top="oak" position={[2.4, 0, 0]} />
      <ProductInstances
        product="tablaEmbutidos"
        items={[{ position: [2.05, COUNTER_H, 0.05], rotation: [0, 0.15, 0] }]}
      />
      <ProductInstances
        product="lomo"
        items={[{ position: [2.6, COUNTER_H, -0.12], rotation: [0, -0.3, 0] }]}
      />
      <ProductInstances
        product="cecina"
        items={[{ position: [2.75, COUNTER_H, 0.15], rotation: [0, 0.4, 0] }]}
      />
      <Label x={2.4}>Tabla, lomo y cecina</Label>

      <Counter
        width={1.4}
        depth={0.7}
        body="lacquerBlack"
        top="steelBrushed"
        position={[5.6, 0, 0]}
      />
      <Prop model="vitrinaCaliente" position={[5.6, COUNTER_H, 0]} />
      <ProductInstances product="croqueta" items={croquetas} />
      <ProductInstances product="cucurucho" items={[{ position: [6.1, COUNTER_H, 0.15] }]} />
      <ProductInstances
        product="croquetaAbierta"
        items={[{ position: [5.05, COUNTER_H, 0.2], rotation: [0, 0.8, 0] }]}
      />
      <Label x={5.6}>Croquetas: expositor y cucurucho</Label>

      <Prop model="vitrinaRefrigerada" position={[8.6, 0, 0]} brandColor="#6b6b3a" />
      <ProductInstances
        product="quesoCortado"
        items={[{ position: [8.15, 0.87, 0.08], rotation: [0, 2.4, 0] }]}
      />
      <ProductInstances
        product="cunaQueso"
        items={alongLine([8.4, 0.87, 0.14], [8.9, 0.87, 0.14], 3, { rotationJitter: 0.3, seed: 9 })}
      />
      <ProductInstances
        product="lomo"
        items={[{ position: [8.9, 0.87, -0.05], rotation: [0, 0.1, 0] }]}
      />
      <Label x={8.6}>Vitrina refrigerada surtida</Label>
    </group>
  )
}
