import { rect } from '../geometry'
import type { StandConfig } from '../types'

/** Stand mediano en esquina: secadero con dos frentes a pasillo. */
export const embutidos: StandConfig = {
  id: 'embutidos-sierra-candela',
  kind: 'embutidos',
  code: 'D-53',
  size: 'mediano',
  layout: 'esquina',
  plot: rect(-0.5, 2, 4, 6),
  openSides: ['north', 'east'],
  maxHeight: 3.5,
  company: {
    name: 'Embutidos Sierra Candela',
    tagline: 'Chacina ibérica curada al aire de la sierra',
    founded: 1974,
    origin: 'Sierra de Aracena',
    description:
      'Chorizo, salchichón, lomo y cecina de ibérico embutidos a mano y curados en secadero natural con pimentón de la Vera.',
    font: 'alfa-slab-one-400',
    palette: {
      primary: '#a3261b',
      secondary: '#3b2518',
      accent: '#d19a3a',
      ink: '#2a1a12',
      paper: '#f1e4cf',
    },
    products: ['Chorizo ibérico', 'Salchichón ibérico', 'Lomo embuchado', 'Cecina de ibérico'],
  },
}
