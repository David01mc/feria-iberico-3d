import type { StandConfig } from '../../config/types'
import { StandPlaceholder } from './StandPlaceholder'

/** Monta cada stand según su tipo. En la Fase 5 cada `kind` tendrá su propia arquitectura. */
export function Stands({ stands }: { stands: StandConfig[] }) {
  return (
    <group name="stands">
      {stands.map((stand) => (
        <StandPlaceholder key={stand.id} stand={stand} />
      ))}
    </group>
  )
}
