import type { FairConfig } from '../../config/types'
import { Carpet } from './Carpet'
import { HallShell } from './HallShell'
import { NeighborBooths } from './NeighborBooths'
import { RoofStructure } from './RoofStructure'
import { Signage } from './Signage'

/** Pabellón completo: envolvente, cubierta, moqueta, expositores vecinos y señalética. */
export function Hall({ fair }: { fair: FairConfig }) {
  return (
    <group name="hall">
      <HallShell hall={fair.hall} />
      <RoofStructure hall={fair.hall} />
      <Carpet hall={fair.hall} />
      <NeighborBooths neighbors={fair.neighbors} />
      <Signage fair={fair} />
    </group>
  )
}
