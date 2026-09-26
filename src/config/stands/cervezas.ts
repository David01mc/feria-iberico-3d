import { rect } from '../geometry'
import type { StandConfig } from '../types'

/** Stand mediano en esquina: módulo de feria vestido de palés por una cervecera artesana. */
export const cervezas: StandConfig = {
  id: 'cervezas-montanera',
  kind: 'cervezas',
  code: 'E-50',
  size: 'mediano',
  layout: 'esquina',
  plot: rect(7, 5, 13, 8),
  openSides: ['south', 'west'],
  front: 'south',
  maxHeight: 3.5,
  company: {
    name: 'Cervezas Montanera',
    tagline: 'Cerveza artesana de bellota',
    founded: 2014,
    origin: 'Dehesa salmantina',
    description:
      'Cervezas sin filtrar elaboradas con harina de bellota tostada en una antigua nave de secado de la dehesa, junto a Guijuelo.',
    font: 'bebas-neue-400',
    palette: {
      primary: '#8e2a25',
      secondary: '#3a2a1c',
      accent: '#e0a526',
      ink: '#2a1d14',
      paper: '#f3e6cf',
    },
    products: ['Rubia de bellota', 'Tostada', 'IPA de la dehesa', 'Negra de castaña'],
  },
}
