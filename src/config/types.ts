/**
 * Modelo de datos de una feria. Todo en metros.
 * Ejes del mundo: x → este, z → sur, y → arriba. "Norte" es −z.
 */

/** Rectángulo en planta (suelo), alineado con los ejes. */
export interface Rect {
  x0: number
  x1: number
  z0: number
  z1: number
}

export type Side = 'north' | 'south' | 'east' | 'west'

/** Categoría comercial del espacio que paga el expositor. */
export type StandSize = 'pequeño' | 'mediano' | 'grande'

/** Cuántos lados del espacio dan a pasillo. */
export type StandLayout = 'isla' | 'peninsula' | 'esquina' | 'lineal' | 'kiosco'

export type StandKind =
  'jamon' | 'quesos' | 'embutidos' | 'croquetas' | 'vinos' | 'cervezas' | 'sidras'

export interface Palette {
  /** Color corporativo principal. */
  primary: string
  secondary: string
  accent: string
  /** Color de texto sobre fondos claros. */
  ink: string
  /** Fondo claro de la marca. */
  paper: string
}

export interface Company {
  name: string
  tagline: string
  founded: number
  origin: string
  description: string
  palette: Palette
  /** Fuente de la marca (archivo en /assets/fonts). */
  font: string
  products: string[]
}

export interface StandConfig {
  id: string
  kind: StandKind
  /** Código de parcela que asigna la organización. */
  code: string
  company: Company
  size: StandSize
  layout: StandLayout
  plot: Rect
  /** Lados abiertos a pasillo (se valida contra el plano). */
  openSides: Side[]
  /** Frente principal: hacia donde mira la arquitectura del stand (uno de los lados abiertos). */
  front: Side
  /** Altura máxima de construcción permitida por la organización. */
  maxHeight: number
}

/** Parcela de otro expositor: stand modular genérico que da contexto a la escena. */
export interface NeighborPlot {
  code: string
  plot: Rect
  openSides: Side[]
  carpet: string
  /** Sector del expositor que aparece en el frontis. */
  sector: string
  /** Color del gráfico del expositor (mostrador y trasera). */
  accent: string
}

export interface HallConfig {
  /** Planta interior del pabellón. */
  bounds: Rect
  height: number
  /** Zona enmoquetada donde están pasillos y parcelas. */
  exhibitionArea: Rect
  carpetColor: string
  /** Separación entre cerchas de cubierta (eje x). */
  trussSpacing: number
  /** Altura del cordón inferior de las cerchas. */
  trussBottom: number
}

export interface Aisle {
  name: string
  rect: Rect
}

export interface FairBrand {
  name: string
  subtitle: string
  edition: string
  dates: string
  venue: string
  palette: Palette
}

export interface FairConfig {
  brand: FairBrand
  hall: HallConfig
  aisles: Aisle[]
  stands: StandConfig[]
  neighbors: NeighborPlot[]
}
