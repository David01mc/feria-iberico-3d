import { rect } from './geometry'
import type { Rect, StandKind } from './types'

/*
 * Distribución de cada stand en su marco local (ver standFrame): origen en el centro de la
 * parcela, frente principal hacia +z, x a lo ancho. Metros; y = 0 es la moqueta del pabellón.
 * Los componentes 3D y las colisiones del paseo leen de aquí: siempre coinciden.
 */

/** Rectángulo en planta a partir de su centro y tamaño. */
const box = (cx: number, cz: number, w: number, d: number): Rect =>
  rect(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2)

type XZ = readonly [number, number]

// ── Casa Bellotar · isla 8 × 6 ───────────────────────────────────────────────

export const JAMON = {
  floor: 0.12,
  posts: [
    [-3.72, -2.72],
    [3.72, -2.72],
    [-3.72, 2.72],
    [3.72, 2.72],
  ] as readonly XZ[],
  postSize: 0.2,
  /** Cara superior de las vigas de la pérgola. */
  pergolaTop: 3.3,
  beam: { width: 0.14, height: 0.22 },
  /** Vigas longitudinales de las que cuelgan los jamones. */
  hamRows: [-0.62, 0.62],
  hamSpan: [-2.45, 2.45] as XZ,
  hamsPerRow: 9,
  bar: { center: [0, 0] as XZ, size: [4.2, 0.9] as XZ, height: 1.1 },
  stools: [-1.6, -0.8, 0, 0.8, 1.6],
  stations: [
    [-2.55, 2.1],
    [2.55, 2.1],
  ] as readonly XZ[],
  stationSize: [1.5, 0.7] as XZ,
  stationHeight: 1.0,
  totem: { center: [-3.0, -2.2] as XZ, size: [1.1, 0.4] as XZ, height: 4.2 },
  barrels: [
    [1.3, -2.15],
    [2.35, -2.15],
  ] as readonly XZ[],
  barrelRadius: 0.37,
  plant: [3.25, -2.2] as XZ,
  crown: { size: [3.4, 0.55, 2.2] as const },
}

function jamonColliders(): Rect[] {
  const j = JAMON
  return [
    ...j.posts.map(([x, z]) => box(x, z, j.postSize, j.postSize)),
    box(...j.bar.center, ...j.bar.size),
    ...j.stations.map(([x, z]) => box(x, z, ...j.stationSize)),
    box(...j.totem.center, ...j.totem.size),
    ...j.barrels.map(([x, z]) => box(x, z, j.barrelRadius * 2, j.barrelRadius * 2)),
    box(...j.plant, 0.6, 0.6),
  ]
}

// ── Quesería Cerro Albar · lineal 6 × 3 ──────────────────────────────────────

export const QUESOS = {
  floor: 0.06,
  wallHeight: 3.0,
  wallThickness: 0.14,
  pillars: [
    [-2.72, 1.32],
    [2.72, 1.32],
  ] as readonly XZ[],
  pillarSize: 0.28,
  pillarHeight: 2.8,
  lintel: { z: 1.32, height: 0.3, depth: 0.28 },
  lampBeam: { z: 0.1, y: 2.95 },
  shelves: [
    [-1.3, -1.12],
    [1.3, -1.12],
  ] as readonly XZ[],
  shelfSize: [1.7, 0.42] as XZ,
  shelfHeight: 2.2,
  vitrina: [-0.95, 0.72] as XZ,
  vitrinaSize: [1.5, 0.9] as XZ,
  counter: { center: [1.35, 0.8] as XZ, size: [1.5, 0.6] as XZ, height: 1.0 },
  crate: { center: [2.36, -0.45] as XZ, size: [0.42, 0.84] as XZ },
  board: [-2.15, 1.0] as XZ,
}

function quesosColliders(): Rect[] {
  const q = QUESOS
  const t = q.wallThickness
  return [
    rect(-3, -1.5, 3, -1.5 + t),
    rect(-3, -1.5, -3 + t, 1.5),
    rect(3 - t, -1.5, 3, 1.5),
    ...q.pillars.map(([x, z]) => box(x, z, q.pillarSize, q.pillarSize)),
    ...q.shelves.map(([x, z]) => box(x, z, ...q.shelfSize)),
    box(...q.vitrina, ...q.vitrinaSize),
    box(...q.counter.center, ...q.counter.size),
    box(...q.crate.center, ...q.crate.size),
    box(...q.board, 0.6, 0.5),
  ]
}

// ── Embutidos Sierra Candela · esquina 4,5 × 4 (abre a +z y a −x) ───────────

export const EMBUTIDOS = {
  floor: 0.08,
  wallHeight: 3.0,
  wallThickness: 0.2,
  post: [-2.12, 1.87] as XZ,
  postSize: 0.2,
  beamTop: 3.0,
  /** Varales de los que cuelgan los embutidos (a lo largo de x), a la altura de la vista. */
  rails: { z: [-1.25, -0.55, 0.15, 0.85], y: 2.5, from: -2.12, to: 2.05 },
  frontCounter: { center: [0.55, 1.5] as XZ, size: [2.9, 0.65] as XZ, height: 1.0 },
  sideCounter: { center: [-1.75, 0.15] as XZ, size: [0.65, 2.0] as XZ, height: 1.0 },
  shelf: { center: [0.9, -1.58] as XZ, size: [2.2, 0.42] as XZ, height: 1.8 },
  barrel: [1.72, -0.5] as XZ,
  barrelRadius: 0.37,
}

function embutidosColliders(): Rect[] {
  const e = EMBUTIDOS
  const t = e.wallThickness
  return [
    rect(-2.25, -2, 2.25, -2 + t),
    rect(2.25 - t, -2, 2.25, 2),
    box(...e.post, e.postSize, e.postSize),
    box(...e.frontCounter.center, ...e.frontCounter.size),
    box(...e.sideCounter.center, ...e.sideCounter.size),
    box(...e.shelf.center, ...e.shelf.size),
    box(...e.barrel, e.barrelRadius * 2, e.barrelRadius * 2),
  ]
}

// ── Doña Brava Croquetería · kiosco 3 × 3 ────────────────────────────────────

export const CROQUETAS = {
  floor: 0.06,
  wallHeight: 2.7,
  wallThickness: 0.1,
  header: { z: 1.35, height: 0.6, depth: 0.3 },
  frontCounter: { center: [0, 0.95] as XZ, size: [2.8, 0.7] as XZ, height: 1.05 },
  backCounter: { center: [0, -1.1] as XZ, size: [2.8, 0.6] as XZ, height: 0.95 },
  lamps: [
    [-0.7, 0.55],
    [0.7, 0.55],
  ] as readonly XZ[],
}

function croquetasColliders(): Rect[] {
  const c = CROQUETAS
  const t = c.wallThickness
  return [
    rect(-1.5, -1.5, 1.5, -1.5 + t),
    rect(-1.5, -1.5, -1.5 + t, 1.5),
    rect(1.5 - t, -1.5, 1.5, 1.5),
    box(...c.frontCounter.center, ...c.frontCounter.size),
    box(...c.backCounter.center, ...c.backCounter.size),
  ]
}

/** Obstáculos de cada tipo de stand en su marco local. */
export const STAND_COLLIDERS: Record<StandKind, () => Rect[]> = {
  jamon: jamonColliders,
  quesos: quesosColliders,
  embutidos: embutidosColliders,
  croquetas: croquetasColliders,
}
