import { rect } from '../geometry'
import type { StandConfig } from '../types'

/** Stand mediano en esquina: chigre asturiano de madera clara con pared de musgo y manzanas. */
export const sidras: StandConfig = {
  id: 'llagar-pumarin',
  kind: 'sidras',
  code: 'D-54',
  size: 'mediano',
  layout: 'esquina',
  plot: rect(7, 2, 13, 5),
  openSides: ['north', 'west'],
  front: 'north',
  maxHeight: 3.5,
  company: {
    name: 'Llagar Pumarín',
    tagline: 'Sidra natural escanciada como en el chigre',
    founded: 1948,
    origin: 'Villaviciosa, Asturias',
    description:
      'Sidra natural de manzana asturiana de sus propias pumaradas, prensada en llagar de madera y fermentada en toneles de castaño.',
    font: 'josefin-sans-700',
    palette: {
      primary: '#2f6b35',
      secondary: '#5b4630',
      accent: '#e2c23a',
      ink: '#1f2a1a',
      paper: '#f2ecd8',
    },
    products: ['Sidra natural', 'Sidra de nueva expresión', 'Sidra brut', 'Vinagre de sidra'],
  },
}
