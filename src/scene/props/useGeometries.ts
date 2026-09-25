import { useEffect } from 'react'
import type { BufferGeometry } from 'three'

/** Libera de la GPU las geometrías de un componente al desmontarlo o al cambiar sus medidas. */
export function useDisposeGeometries(geometries: Record<string, BufferGeometry>) {
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries])
}
