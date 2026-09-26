import { rect } from '../geometry'
import type { StandConfig } from '../types'

/** Stand grande en isla: la marca insignia de la feria. */
export const jamon: StandConfig = {
  id: 'casa-bellotar',
  kind: 'jamon',
  code: 'C-50',
  size: 'grande',
  layout: 'isla',
  plot: rect(-4, -8, 4, -2),
  openSides: ['north', 'south', 'east', 'west'],
  front: 'south',
  maxHeight: 4.5,
  company: {
    name: 'Casa Bellotar',
    tagline: 'Jamón 100% ibérico de bellota',
    founded: 1962,
    origin: 'Dehesa de Sierra Morena',
    description:
      'Tres generaciones criando cerdo ibérico en libertad y curando jamones durante un mínimo de 36 meses en bodega natural.',
    font: 'playfair-display-700',
    palette: {
      primary: '#5a1a1f',
      secondary: '#2a1512',
      accent: '#c9a45c',
      ink: '#1b1414',
      paper: '#efe6d6',
    },
    products: ['Jamón de bellota 100% ibérico', 'Paleta de bellota', 'Jamón cortado a cuchillo'],
  },
}
