import { rect } from '../geometry'
import type { StandConfig } from '../types'

/** Stand pequeño tipo kiosco: street-food moderno con un frente de venta. */
export const croquetas: StandConfig = {
  id: 'dona-brava',
  kind: 'croquetas',
  code: 'D-52',
  size: 'pequeño',
  layout: 'kiosco',
  plot: rect(-3.5, 2, -0.5, 5),
  openSides: ['north'],
  maxHeight: 3.5,
  company: {
    name: 'Doña Brava Croquetería',
    tagline: 'Croquetas cremosas de ibérico',
    founded: 2019,
    origin: 'Madrid',
    description:
      'Bechamel de leche fresca, rebozado crujiente en panko y rellenos con producto ibérico de la propia feria.',
    font: 'pacifico-400',
    palette: {
      primary: '#f2b134',
      secondary: '#161616',
      accent: '#ff5a3c',
      ink: '#161616',
      paper: '#fbf3e4',
    },
    products: [
      'Croqueta de jamón ibérico',
      'Croqueta de cecina',
      'Croqueta de queso curado',
      'Croqueta de chorizo',
    ],
  },
}
