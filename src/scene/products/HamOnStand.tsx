import { useMemo } from 'react'
import type { Vec3 } from '../../materials/geometry'
import { MODELS } from '../props/catalog'
import { Prop } from '../props/Prop'
import { alignTwoPoints, type Placement } from './arrange'
import { productMeta } from './catalog'
import { ProductInstances } from './ProductInstances'

const add = (a: Vec3, b: readonly number[]): Vec3 => [a[0] + b[0]!, a[1] + b[1]!, a[2] + b[2]!]

/**
 * Jamón empezado sobre su jamonero: la maza apoyada en la cuna y la pezuña en la mordaza.
 * `at` es la base del jamonero (sobre el mostrador); el jamonero va a lo largo de +x.
 */
export function HamOnStand({ at }: { at: Vec3 }) {
  const placement = useMemo<Placement>(() => {
    const { anchors } = productMeta('jamonCortado')
    const { cuna, mordaza } = MODELS.jamonero.anchors
    return alignTwoPoints(anchors.apoyo!, anchors.pezuna!, add(at, cuna), add(at, mordaza))
  }, [at])
  return (
    <>
      <Prop model="jamonero" position={at} />
      <ProductInstances product="jamonCortado" items={[placement]} />
    </>
  )
}
