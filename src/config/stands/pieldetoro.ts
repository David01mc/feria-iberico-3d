import { rect } from '../geometry'
import type { StandConfig } from '../types'

/**
 * Isla grande entre las calles 1 y 2: una caseta de la Feria de Abril convertida en stand de
 * tapas, con dos módulos de lona a rayas, pañoletas pintadas y farolillos.
 */
export const pieldetoro: StandConfig = {
  id: 'piel-de-toro',
  kind: 'tapas',
  code: 'B-51',
  size: 'grande',
  layout: 'isla',
  plot: rect(-16, -8, -7, -2),
  openSides: ['north', 'south', 'east', 'west'],
  front: 'south',
  maxHeight: 4.5,
  company: {
    name: 'Piel de Toro',
    tagline: 'Authentic Spanish Tapas',
    founded: 2006,
    origin: 'Sevilla · Miami',
    description:
      'Tapas españolas listas para la mesa: paella de marisco, tortilla de patatas, croquetas de jamón, jamón serrano, chorizo y manchego DOP.',
    font: 'playfair-display-700',
    palette: {
      primary: '#b3121f',
      secondary: '#6d0f14',
      accent: '#d4a64a',
      ink: '#2a0a0c',
      paper: '#f3e7cf',
    },
    products: [
      'Paella de marisco',
      'Tortilla española',
      'Croquetas de jamón',
      'Jamón serrano',
      'Chorizo en lonchas',
      'Manchego DOP',
    ],
  },
}
