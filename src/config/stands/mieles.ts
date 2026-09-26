import { rect } from '../geometry'
import type { StandConfig } from '../types'

/** Puesto pequeño de miel artesana abierto al Pasillo Sur y a la Calle 4. */
export const mieles: StandConfig = {
  id: 'miel-de-la-dehesa',
  kind: 'mieles',
  code: 'E-51',
  size: 'pequeño',
  layout: 'esquina',
  plot: rect(19, 5, 22, 8),
  openSides: ['south', 'west'],
  front: 'south',
  maxHeight: 3.5,
  company: {
    name: 'Miel de la Dehesa',
    tagline: 'Miel cruda de nuestras colmenas',
    founded: 1987,
    origin: 'Las Hurdes · Extremadura',
    description:
      'Miel artesana cosechada en pequeñas partidas entre brezos, encinas y romeros de la dehesa extremeña.',
    font: 'playfair-display-700',
    palette: {
      primary: '#503219',
      secondary: '#b36b22',
      accent: '#e9b94f',
      ink: '#34210f',
      paper: '#f7ebcc',
    },
    products: ['Miel de encina', 'Miel de romero', 'Miel de brezo', 'Polen de abeja'],
  },
}
