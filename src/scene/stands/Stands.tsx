import type { ComponentType } from 'react'
import type { StandConfig, StandKind } from '../../config/types'
import { CroquetasStand } from './CroquetasStand'
import { EmbutidosStand } from './EmbutidosStand'
import { JamonStand } from './JamonStand'
import { QuesosStand } from './QuesosStand'
import { StandMassing } from './StandMassing'

/** Arquitectura de cada tipo de stand (cada expositor decora su espacio a su manera). */
const STAND_COMPONENTS: Record<StandKind, ComponentType<{ stand: StandConfig }>> = {
  jamon: JamonStand,
  quesos: QuesosStand,
  embutidos: EmbutidosStand,
  croquetas: CroquetasStand,
  // Espacio Maridaje: maqueta volumétrica hasta construir cada stand.
  vinos: StandMassing,
  cervezas: StandMassing,
  sidras: StandMassing,
}

export function Stands({ stands }: { stands: StandConfig[] }) {
  return (
    <group name="stands">
      {stands.map((stand) => {
        const Stand = STAND_COMPONENTS[stand.kind]
        return <Stand key={stand.id} stand={stand} />
      })}
    </group>
  )
}
