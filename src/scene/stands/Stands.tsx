import type { ComponentType } from 'react'
import type { StandConfig, StandKind } from '../../config/types'
import { AceitunasStand } from './AceitunasStand'
import { CroquetasStand } from './CroquetasStand'
import { CervezasStand } from './CervezasStand'
import { EmbutidosStand } from './EmbutidosStand'
import { JamonStand } from './JamonStand'
import { MielesStand } from './MielesStand'
import { PielDeToroStand } from './PielDeToroStand'
import { QuesosStand } from './QuesosStand'
import { SidrasStand } from './SidrasStand'
import { VinosStand } from './VinosStand'
import { VermutStand } from './VermutStand'

/** Arquitectura de cada tipo de stand (cada expositor decora su espacio a su manera). */
const STAND_COMPONENTS: Record<StandKind, ComponentType<{ stand: StandConfig }>> = {
  jamon: JamonStand,
  quesos: QuesosStand,
  embutidos: EmbutidosStand,
  croquetas: CroquetasStand,
  vinos: VinosStand,
  cervezas: CervezasStand,
  sidras: SidrasStand,
  tapas: PielDeToroStand,
  aceitunas: AceitunasStand,
  vermut: VermutStand,
  mieles: MielesStand,
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
