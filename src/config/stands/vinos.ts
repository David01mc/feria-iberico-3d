import { rect } from '../geometry'
import type { StandConfig } from '../types'

/** Stand grande en península: bodega en negro y blanco, abierta a tres pasillos y con la fachada al norte. */
export const vinos: StandConfig = {
  id: 'bodegas-la-escribana',
  kind: 'vinos',
  code: 'B-50',
  size: 'grande',
  layout: 'peninsula',
  plot: rect(7, -8, 13, -2),
  openSides: ['north', 'south', 'west'],
  front: 'north',
  maxHeight: 4.0,
  company: {
    name: 'Bodegas La Escribana',
    tagline: 'Vinos escritos a mano desde 1921',
    founded: 1921,
    origin: 'Ribera del Guadiana',
    description:
      'Tintos de tempranillo, blancos de cayetana y cava de Almendralejo, criados en calados centenarios bajo la antigua casa del escribano del pueblo.',
    font: 'cinzel-600',
    palette: {
      primary: '#151515',
      secondary: '#f4f1ea',
      accent: '#b08d57',
      ink: '#151515',
      paper: '#f4f1ea',
    },
    products: ['Tinto crianza', 'Tinto reserva', 'Blanco cayetana', 'Cava brut nature'],
  },
}
