import { rect } from '../geometry'
import type { StandConfig } from '../types'

/** Barra pequeña de aperitivo, junto al puesto de aceitunas. */
export const vermut: StandConfig = {
  id: 'la-hora-del-vermut',
  kind: 'vermut',
  code: 'D-56',
  size: 'pequeño',
  layout: 'lineal',
  plot: rect(25, 2, 28, 5),
  openSides: ['north'],
  front: 'north',
  maxHeight: 3.5,
  company: {
    name: 'La Hora del Vermut',
    tagline: 'El aperitivo de siempre',
    founded: 1954,
    origin: 'Reus · Tarragona',
    description:
      'Vermut rojo y blanco servido con hielo, naranja y aceituna, acompañado de aperitivos de la tierra.',
    font: 'playfair-display-700',
    palette: {
      primary: '#1d2b3b',
      secondary: '#a94732',
      accent: '#e1b36a',
      ink: '#192331',
      paper: '#f5ead8',
    },
    products: ['Vermut rojo', 'Vermut blanco', 'Reserva de la casa', 'Sifón y aceituna'],
  },
}
