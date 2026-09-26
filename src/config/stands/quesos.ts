import { rect } from '../geometry'
import type { StandConfig } from '../types'

/** Stand mediano en línea: quesería artesanal con un único frente. */
export const quesos: StandConfig = {
  id: 'queseria-cerro-albar',
  kind: 'quesos',
  code: 'D-51',
  size: 'mediano',
  layout: 'lineal',
  plot: rect(-9.5, 2, -3.5, 5),
  openSides: ['north'],
  front: 'north',
  maxHeight: 3.5,
  company: {
    name: 'Quesería Cerro Albar',
    tagline: 'Quesos artesanos de oveja y cabra',
    founded: 1987,
    origin: 'Serranía de Cuenca',
    description:
      'Leche cruda de rebaño propio, cuajo natural y maduración lenta sobre tablas de pino en cámara de piedra.',
    font: 'cormorant-garamond-600',
    palette: {
      primary: '#6b6b3a',
      secondary: '#b5653a',
      accent: '#e2c98f',
      ink: '#2b2620',
      paper: '#f3ecdc',
    },
    products: [
      'Queso curado de oveja',
      'Queso semicurado',
      'Queso de cabra en aceite',
      'Torta cremosa',
    ],
  },
}
