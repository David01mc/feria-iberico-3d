import type { ReactNode } from 'react'
import { standFrame } from '../../config/geometry'
import type { StandConfig } from '../../config/types'

/**
 * Lleva el marco local de un stand (frente hacia +z, origen en el centro de la parcela) a su
 * sitio en el pabellón. Los stands se diseñan una vez y valen para cualquier parcela y frente.
 */
export function StandPlacement({ stand, children }: { stand: StandConfig; children: ReactNode }) {
  const frame = standFrame(stand.plot, stand.front)
  return (
    <group
      name={`stand-${stand.id}`}
      position={[frame.center[0], 0, frame.center[1]]}
      rotation-y={frame.rotationY}
    >
      {children}
    </group>
  )
}
