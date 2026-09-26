import { rect } from '../geometry'
import type { StandConfig } from '../types'

/** Puesto de encurtidos abierto a la Avenida Central y a la Calle 4. */
export const aceitunas: StandConfig = {
  id: 'la-aceitunera',
  kind: 'aceitunas',
  code: 'D-55',
  size: 'mediano',
  layout: 'esquina',
  plot: rect(19, 2, 25, 5),
  openSides: ['north', 'west'],
  front: 'north',
  maxHeight: 3.5,
  company: {
    name: 'La Aceitunera',
    tagline: 'Aceitunas y encurtidos a granel',
    founded: 1998,
    origin: 'Sevilla · Andalucía',
    description:
      'Selección de aceitunas aliñadas y encurtidos artesanos servidos a granel, con variedades verdes, negras y rellenas.',
    font: 'playfair-display-700',
    palette: {
      primary: '#3d542d',
      secondary: '#a8492c',
      accent: '#e0be73',
      ink: '#17231b',
      paper: '#f5ead1',
    },
    products: ['Manzanilla', 'Gordal', 'Kalamata', 'Negras de Aragón', 'Banderillas'],
  },
}
