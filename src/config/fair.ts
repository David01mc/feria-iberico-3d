import { computeOpenSides, rect, subdivide } from './geometry'
import { croquetas } from './stands/croquetas'
import { embutidos } from './stands/embutidos'
import { jamon } from './stands/jamon'
import { quesos } from './stands/quesos'
import type { Aisle, FairConfig, NeighborPlot, Rect } from './types'

/*
 * Plano del Pabellón 3 (vista en planta, norte arriba, 1 carácter ≈ 2 m):
 *
 *   z=-15 ┌ A ─────┐   ┌ A ─────┐ ┌ A ───┐ ┌ A ─────┐   ┌ A ─────┐
 *         └────────┘   └────────┘ └──────┘ └────────┘   └────────┘
 *   z=-11 ═══════════════════ Pasillo Norte ════════════════════════
 *         ┌ B ─────┐   ┌ B ─────┐ ┌JAMÓN ┐ ┌ B ─────┐   ┌ B ─────┐
 *         └ C ─────┘   └ C ─────┘ └ isla ┘ └ C ─────┘   └ C ─────┘
 *   z=-2  ═══════════════════ Avenida Central ══════════════════════
 *         ┌ D ───────┐   ┌D│QUESOS│CRQ│EMBUT┐ ┌ D ─────┐ ┌ D ─────┐
 *         └ E ───────┘   └ E ──────────┴─ E ┘ └ E ─────┘ └ E ─────┘
 *   z=8   ═══════════════════ Pasillo Sur ══════════════════════════
 *         ┌ F ───────┐   ┌ F ───────────────┐ ┌ F ─────┐ ┌ F ─────┐
 *   z=15  └──────────┘   └──────────────────┘ └────────┘ └────────┘
 *        x=-28                     x=0                          x=28
 */

const HALL_BOUNDS = rect(-31, -18, 31, 18)
const EXHIBITION_AREA = rect(-28, -15, 28, 15)

/** Moquetas habituales en stands modulares. */
const NEIGHBOR_CARPETS = [
  '#4a4f57',
  '#2f4858',
  '#6b705c',
  '#8a817c',
  '#3d405b',
  '#5a4a42',
  '#7a8b8c',
  '#6e3b3b',
]
const NEIGHBOR_ACCENTS = [
  '#8c2f39',
  '#2e5e4e',
  '#c47f2c',
  '#35506b',
  '#6d4c7d',
  '#9a8c3a',
  '#b3542e',
]
const NEIGHBOR_SECTORS = [
  'Aceites',
  'Vinos',
  'Conservas',
  'Panadería',
  'Mieles',
  'Pimentón',
  'Aceitunas',
  'Dulces',
  'Cervezas',
  'Legumbres',
  'Frutos secos',
  'Vermut',
  'Turrones',
  'Especias',
]

type Row = {
  letter: string
  z: [number, number]
  blocks: [x0: number, x1: number, sizes: number[]][]
}

const ROWS: Row[] = [
  {
    letter: 'A',
    z: [-15, -11],
    blocks: [
      [-28, -19, [3, 3, 3]],
      [-16, -7, [6, 3]],
      [-4, 4, [4, 4]],
      [7, 16, [3, 6]],
      [19, 28, [3, 3, 3]],
    ],
  },
  {
    letter: 'B',
    z: [-8, -5],
    blocks: [
      [-28, -19, [3, 6]],
      [-16, -7, [3, 3, 3]],
      [7, 16, [6, 3]],
      [19, 28, [3, 3, 3]],
    ],
  },
  {
    letter: 'C',
    z: [-5, -2],
    blocks: [
      [-28, -19, [3, 3, 3]],
      [-16, -7, [6, 3]],
      [7, 16, [3, 3, 3]],
      [19, 28, [3, 6]],
    ],
  },
  {
    letter: 'D',
    z: [2, 5],
    blocks: [
      [-28, -15.5, [3.5, 3, 3, 3]],
      [-12.5, -9.5, [3]],
      [7, 16, [3, 3, 3]],
      [19, 28, [6, 3]],
    ],
  },
  {
    letter: 'E',
    z: [5, 8],
    blocks: [
      [-28, -15.5, [3.5, 6, 3]],
      [-12.5, -0.5, [6, 6]],
      [7, 16, [3, 6]],
      [19, 28, [3, 3, 3]],
    ],
  },
  {
    letter: 'F',
    z: [11, 15],
    blocks: [
      [-28, -15.5, [3.5, 3, 3, 3]],
      [-12.5, 4, [4.5, 6, 6]],
      [7, 16, [3, 3, 3]],
      [19, 28, [4.5, 4.5]],
    ],
  },
]

/** Parcelas sueltas que no encajan en una fila regular (trasera del stand de embutidos). */
const EXTRA_PLOTS: { letter: string; plot: Rect }[] = [{ letter: 'E', plot: rect(-0.5, 6, 4, 8) }]

const STANDS = [jamon, quesos, croquetas, embutidos]

function buildNeighbors(): NeighborPlot[] {
  const counters = new Map<string, number>()
  const nextCode = (letter: string) => {
    const n = (counters.get(letter) ?? 0) + 1
    counters.set(letter, n)
    return `${letter}-${String(n).padStart(2, '0')}`
  }

  const plots: { code: string; plot: Rect }[] = []
  for (const row of ROWS) {
    for (const [x0, x1, sizes] of row.blocks) {
      for (const plot of subdivide(rect(x0, row.z[0], x1, row.z[1]), 'x', sizes)) {
        plots.push({ code: nextCode(row.letter), plot })
      }
    }
  }
  for (const extra of EXTRA_PLOTS) plots.push({ code: nextCode(extra.letter), plot: extra.plot })

  const everything = [...plots.map((p) => p.plot), ...STANDS.map((s) => s.plot)]
  return plots.map(({ code, plot }, i) => ({
    code,
    plot,
    openSides: computeOpenSides(
      plot,
      everything.filter((other) => other !== plot),
      EXHIBITION_AREA,
    ),
    carpet: NEIGHBOR_CARPETS[(i * 5) % NEIGHBOR_CARPETS.length]!,
    accent: NEIGHBOR_ACCENTS[(i * 3) % NEIGHBOR_ACCENTS.length]!,
    sector: NEIGHBOR_SECTORS[(i * 11) % NEIGHBOR_SECTORS.length]!,
  }))
}

const AISLES: Aisle[] = [
  { name: 'Avenida Central', rect: rect(-28, -2, 28, 2) },
  { name: 'Pasillo Norte', rect: rect(-28, -11, 28, -8) },
  { name: 'Pasillo Sur', rect: rect(-28, 8, 28, 11) },
  { name: 'Calle 1', rect: rect(-19, -11, -16, -2) },
  { name: 'Calle 2', rect: rect(-7, -11, -4, -2) },
  { name: 'Calle 3', rect: rect(4, -15, 7, 15) },
  { name: 'Calle 4', rect: rect(16, -15, 19, 15) },
  { name: 'Calle 5', rect: rect(-15.5, 2, -12.5, 15) },
]

export const FAIR: FairConfig = {
  brand: {
    name: 'Salón Dehesa',
    subtitle: 'Feria del Ibérico',
    edition: '2026',
    dates: '13–15 nov 2026',
    venue: 'Pabellón 3',
    palette: {
      primary: '#1f2b24',
      secondary: '#2d3b31',
      accent: '#c8a45a',
      ink: '#1a1a17',
      paper: '#f1e9da',
    },
  },
  hall: {
    bounds: HALL_BOUNDS,
    height: 14,
    exhibitionArea: EXHIBITION_AREA,
    carpetColor: '#34363a',
    trussSpacing: 8,
    trussBottom: 10.5,
  },
  aisles: AISLES,
  stands: STANDS,
  neighbors: buildNeighbors(),
}
