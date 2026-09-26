import { productMeta } from '../products/catalog'
import { ProductInstances } from '../products/ProductInstances'
import { Block } from '../props/Block'
import { Prop } from '../props/Prop'

/** Cara delantera del marco de madera (el marco mide 7 cm de fondo, centrado en el origen). */
const FRAME_FRONT = 0.035

/**
 * Jardín vertical enmarcado: lámina de musgo preservado con relieve horneado y, brotando de
 * ella, matas de helecho, calathea y anthurium (modelos de Poly Haven instanciados por GPU).
 * Mide 2,7 × 1,95 m, lo que miden sus modelos; `position` es el centro del panel.
 */
export function MossPanel({
  width,
  height,
  position,
}: {
  width: number
  height: number
  position: [number, number, number]
}) {
  const [, , mossDepth] = productMeta('panelMusgo').size
  return (
    <group position={position}>
      <Block size={[width + 0.12, height + 0.12, 0.07]} material="darkWood" />
      <ProductInstances
        product="panelMusgo"
        items={[{ position: [0, -height / 2, FRAME_FRONT + mossDepth / 2], tint: '#c2cbb0' }]}
      />
      <Prop model="jardinVertical" position={[0, -height / 2, FRAME_FRONT + mossDepth * 0.6]} />
    </group>
  )
}
