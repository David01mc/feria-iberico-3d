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
  floorInset: 0.035,
  wallInset: 0.06,
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
    [-1.3, -1.07],
    [1.3, -1.07],
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
  const i = q.wallInset
  return [
    rect(-3 + i + t, -1.5 + i, 3 - i - t, -1.5 + i + t),
    rect(-3 + i, -1.5 + i, -3 + i + t, 1.5 - i),
    rect(3 - i - t, -1.5 + i, 3 - i, 1.5 - i),
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
  floorInset: 0.035,
  wallInset: 0.06,
  wallHeight: 3.0,
  wallThickness: 0.2,
  post: [-2.12, 1.87] as XZ,
  postSize: 0.2,
  beamTop: 3.0,
  /** Varales de los que cuelgan los embutidos (a lo largo de x), a la altura de la vista. */
  rails: { z: [-1.25, -0.55, 0.15, 0.85], y: 2.5, from: -2.12, to: 2.05 },
  frontCounter: { center: [0.55, 1.5] as XZ, size: [2.8, 0.65] as XZ, height: 1.0 },
  sideCounter: { center: [-1.75, 0.15] as XZ, size: [0.65, 2.0] as XZ, height: 1.0 },
  shelf: { center: [0.9, -1.58] as XZ, size: [2.2, 0.42] as XZ, height: 1.8 },
  barrel: [1.72, -0.5] as XZ,
  barrelRadius: 0.37,
}

function embutidosColliders(): Rect[] {
  const e = EMBUTIDOS
  const t = e.wallThickness
  const i = e.wallInset
  return [
    rect(-2.25 + i, -2 + i, 2.25 - i - t, -2 + i + t),
    rect(2.25 - i - t, -2 + i, 2.25 - i, 2 - i),
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
  floorInset: 0.035,
  wallInset: 0.06,
  wallHeight: 2.7,
  wallThickness: 0.1,
  header: { z: 1.35, height: 0.6, depth: 0.3 },
  frontCounter: { center: [0, 0.95] as XZ, size: [2.6, 0.7] as XZ, height: 1.05 },
  backCounter: { center: [0, -1.02] as XZ, size: [2.6, 0.6] as XZ, height: 0.95 },
  lamps: [
    [-0.7, 0.55],
    [0.7, 0.55],
  ] as readonly XZ[],
}

function croquetasColliders(): Rect[] {
  const c = CROQUETAS
  const t = c.wallThickness
  const i = c.wallInset
  return [
    rect(-1.5 + i + t, -1.5 + i, 1.5 - i - t, -1.5 + i + t),
    rect(-1.5 + i, -1.5 + i, -1.5 + i + t, 1.5 - i),
    rect(1.5 - i - t, -1.5 + i, 1.5 - i, 1.5 - i),
    box(...c.frontCounter.center, ...c.frontCounter.size),
    box(...c.backCounter.center, ...c.backCounter.size),
  ]
}

// ── Bodegas La Escribana · península 6 × 6 (abre a +z, −z y +x; cerrada en −x) ─

export const VINOS = {
  /** Tarima de madera envejecida elevada. */
  floor: 0.15,
  /** El perfil de la tarima queda dentro de las caras exteriores de los muros. */
  floorInset: 0.04,
  /** Muro caligráfico al fondo (−z) con tres cajas de luz mirando al frente. */
  wall: { x: [-0.8, 3] as XZ, z: -3, depth: 0.5, height: 3.4 },
  windows: { x: [-0.05, 1.1, 2.25], width: 0.95, bottom: 1.0, height: 1.3 },
  /** Bandeja blanca separada de las caras exteriores del muro para evitar z-fighting. */
  canopy: { x: [-0.76, 2.96] as XZ, z: [-2.45, 1.6] as XZ, bottom: 3.42, height: 0.53 },
  /** Caja negra del lounge contra el lado cerrado (−x), con techo de downlights. */
  lounge: { x: [-3, -0.8] as XZ, z: [-3, 1.4] as XZ, ceiling: 3.0, height: 3.6, wall: 0.2 },
  sofa: { center: [-2.35, -1.1] as XZ, size: [0.8, 2.0] as XZ },
  table: { center: [-1.55, -1.1] as XZ, size: [0.55, 0.9] as XZ },
  armchairs: [
    [-1.1, -2.1],
    [-1.1, -0.1],
  ] as readonly XZ[],
  armchairSize: [0.7, 0.7] as XZ,
  counter: { center: [1.0, 1.9] as XZ, size: [2.6, 0.7] as XZ, height: 1.05 },
  giftBoxes: { center: [2.55, 2.4] as XZ, size: [0.6, 0.6] as XZ },
  /** Árbol del dinero en la esquina abierta del lounge. */
  plant: [-2.45, 0.85] as XZ,
}

function vinosColliders(): Rect[] {
  const v = VINOS
  const l = v.lounge
  return [
    rect(v.wall.x[0], v.wall.z, v.wall.x[1], v.wall.z + v.wall.depth),
    rect(l.x[0], l.z[0], l.x[1], l.z[0] + l.wall),
    rect(l.x[0], -3, l.x[0] + l.wall, 3),
    box(...v.sofa.center, ...v.sofa.size),
    box(...v.table.center, ...v.table.size),
    ...v.armchairs.map((a) => box(...a, ...v.armchairSize)),
    box(...v.counter.center, ...v.counter.size),
    box(...v.giftBoxes.center, ...v.giftBoxes.size),
    box(...v.plant, 0.5, 0.5),
  ]
}

// ── Cervezas Montanera · esquina 6 × 3 (abre a +z y a −x) ───────────────────

export const CERVEZAS = {
  floor: 0.025,
  floorInset: 0.035,
  sideInset: 0.06,
  /** Módulo de feria: perfilería de aluminio y panel blanco en los lados cerrados (−z, +x). */
  panelHeight: 2.5,
  panelThickness: 0.04,
  /** El fondo y su perfilería se retranquean del tabique compartido con sidras. */
  panelInset: 0.06,
  rearFrameZ: -1.41,
  /** Muro de 3 × 3 palés europeos de pie (1,2 × 0,8) delante del panel del fondo. */
  palletWall: { z: -1.36, cols: 3, rows: 3, pallet: [1.2, 0.8] as XZ, thickness: 0.14 },
  /** Mostradores de cajón de pino con panel granate, en línea con el frente. */
  counters: [1.95, 0.8, -0.35] as readonly number[],
  counterZ: 0.72,
  counterSize: [1.1, 0.6] as XZ,
  counterHeight: 1.0,
  /** Cajas de madera apiladas como jardineras. */
  planters: [
    [2.6, 1.05],
    [-2.55, 1.1],
  ] as readonly XZ[],
  planterSize: [0.6, 0.45] as XZ,
  /** Seis barriles en dos niveles, junto al lateral cerrado y fuera de la zona de servicio. */
  kegStack: {
    center: [2.28, -0.79] as XZ,
    size: [1.06, 0.94] as XZ,
    shelfTop: 0.6,
    shelfThickness: 0.05,
    lowerOffsets: [
      [-0.24, -0.24],
      [0.24, -0.24],
      [-0.24, 0.24],
      [0.24, 0.24],
    ] as readonly XZ[],
    upperOffsets: [
      [-0.24, 0],
      [0.24, 0],
    ] as readonly XZ[],
  },
  /** Expositor metálico de botellas junto al lado abierto. */
  rack: { center: [-2.55, -0.75] as XZ, size: [0.6, 0.45] as XZ, height: 1.9 },
}

function cervezasColliders(): Rect[] {
  const c = CERVEZAS
  const w = c.palletWall
  const wallW = w.cols * w.pallet[0]
  return [
    rect(
      -3 + c.sideInset,
      -1.5 + c.panelInset,
      3 - c.sideInset,
      -1.5 + c.panelInset + c.panelThickness,
    ),
    rect(
      3 - c.sideInset - c.panelThickness,
      -1.5 + c.sideInset,
      3 - c.sideInset,
      1.5 - c.sideInset,
    ),
    rect(-wallW / 2, w.z - w.thickness / 2, wallW / 2, w.z + w.thickness / 2),
    ...c.counters.map((x) => box(x, c.counterZ, ...c.counterSize)),
    ...c.planters.map((p) => box(...p, ...c.planterSize)),
    box(...c.kegStack.center, ...c.kegStack.size),
    box(...c.rack.center, ...c.rack.size),
  ]
}

// ── Llagar Pumarín · esquina 6 × 3 (abre a +z y a +x) ───────────────────────

export const SIDRAS = {
  floor: 0.03,
  floorInset: 0.035,
  wallInset: 0.06,
  wallHeight: 3.0,
  wallThickness: 0.12,
  /** Visera de madera sobre la mitad trasera del stand. */
  ceiling: { z: [-1.46, 0.35] as XZ, y: 2.9, thickness: 0.12 },
  /** Jardín vertical enmarcado en la mitad derecha del fondo. */
  moss: { x: [0.15, 2.85] as XZ, y: [0.67, 2.62] as XZ, depth: 0.08 },
  /** Barra de cata adelantada respecto al follaje, con espacio para dos taburetes. */
  ledge: { x: [0.35, 2.85] as XZ, z: -0.72, depth: 0.6, height: 1.05 },
  stools: [
    [2.25, 0.08],
    [1.35, 0.08],
  ] as readonly XZ[],
  stoolSize: 0.42,
  /** Barra de cata con frente de tablas oscuras. */
  bar: { center: [-1.05, 0.3] as XZ, size: [1.9, 0.75] as XZ, height: 1.1 },
  /** Dos toneles a la vista detrás de la barra. */
  barrels: [
    [-2.25, -0.92],
    [-1.13, -0.92],
  ] as readonly XZ[],
  barrelSize: 0.96,
  plant: [2.65, 0.95] as XZ,
}

function sidrasColliders(): Rect[] {
  const s = SIDRAS
  const t = s.wallThickness
  const i = s.wallInset
  return [
    rect(-3 + i + t, -1.5 + i, 3 - i, -1.5 + i + t),
    rect(-3 + i, -1.5 + i, -3 + i + t, 1.5 - i),
    box((s.ledge.x[0] + s.ledge.x[1]) / 2, s.ledge.z, s.ledge.x[1] - s.ledge.x[0], s.ledge.depth),
    ...s.stools.map((p) => box(...p, s.stoolSize, s.stoolSize)),
    box(...s.bar.center, ...s.bar.size),
    ...s.barrels.map((p) => box(...p, s.barrelSize, s.barrelSize)),
    box(...s.plant, 0.55, 0.55),
  ]
}

// ── La Aceitunera · puesto de mercado 6 × 3, abierto al norte y al oeste ────

export const ACEITUNAS = {
  floor: 0.065,
  floorInset: 0.04,
  wallInset: 0.06,
  wallThickness: 0.12,
  wallHeight: 3.25,
  /** Vitrina con diez cubetas de variedades a granel. */
  display: { center: [0, 0.66] as XZ, size: [4.72, 1.12] as XZ, bodyHeight: 0.89 },
  /** Expositor vertical de tarros junto al pasillo lateral. */
  rack: { center: [2.52, -0.64] as XZ, size: [0.62, 0.54] as XZ, height: 2.18 },
  backShelf: { center: [-0.15, -1.07] as XZ, width: 4.65, depth: 0.3, levels: [1.57, 2.02] },
} as const

function aceitunasColliders(): Rect[] {
  const a = ACEITUNAS
  const t = a.wallThickness
  const i = a.wallInset
  return [
    rect(-3 + i + t, -1.5 + i, 3 - i, -1.5 + i + t),
    rect(-3 + i, -1.5 + i, -3 + i + t, 1.5 - i),
    box(...a.display.center, ...a.display.size),
    box(...a.rack.center, ...a.rack.size),
  ]
}

// ── Piel de Toro · isla 9 × 6: caseta de feria (abre a los cuatro lados) ─────

type Segment = readonly [XZ, XZ]

export const PIELDETORO = {
  /** Tarima de albero. */
  floor: 0.12,
  /** Dos módulos de caseta de 3,6 m, cada uno con su lona a dos aguas y su pañoleta. */
  modules: [
    [-4.4, -0.8],
    [-0.8, 2.8],
  ] as readonly XZ[],
  /** Fondo de la lona (la cumbrera va de frente a fondo, como en el Real). */
  lonaZ: [-2.95, 2.95] as XZ,
  eave: 3.0,
  ridge: 4.05,
  /** Pañoleta: banda bajo el alero + frontón hasta la cumbrera, y remate con perilla. */
  panoleta: { band: 0.45, inset: 0.03 },
  finialTop: 4.35,
  postXs: [-4.34, -0.8, 2.74] as readonly number[],
  postZs: [-2.84, 0, 2.84] as readonly number[],
  postRadius: 0.045,
  /** Barandilla verde de caseta: dos tramos al frente (con la entrada) y el costado oeste. */
  railHeight: 0.95,
  rails: [
    [
      [-4.34, 2.84],
      [-3.05, 2.84],
    ],
    [
      [-1.95, 2.84],
      [-0.86, 2.84],
    ],
    [
      [-4.34, -1.45],
      [-4.34, 2.84],
    ],
  ] as readonly Segment[],
  /** Tablao de madera en la esquina noroeste (guitarra y sillas). */
  tablao: { x: [-4.28, -2.55] as XZ, z: [-2.8, -1.55] as XZ, height: 0.18 },
  /** Veladores con mantón y sillas de enea alrededor (radio del corro). */
  tables: [
    [-3.55, 1.6],
    [-1.75, 1.85],
    [-2.35, 0.15],
  ] as readonly XZ[],
  chairRing: 0.56,
  /** Barra de la caseta: showcooking con paellero, frente de azulejo. */
  bar: { center: [0.9, -0.55] as XZ, size: [3.0, 0.72] as XZ, height: 1.1 },
  /** Espina de doble cara: trasbarra hacia la barra y La Despensa hacia el Pasillo Norte. */
  spine: { center: [0.9, -2.45] as XZ, size: [3.0, 0.5] as XZ, height: 2.3 },
  /** Barriles de pie para tapear delante de la barra. */
  standTables: [
    [0.15, 1.85],
    [1.75, 1.65],
  ] as readonly XZ[],
  barrelRadius: 0.37,
  /** Trastienda encalada (cocina y almacén) con el cubo del escudo encima. */
  backroom: { x: [2.98, 4.42] as XZ, z: [-2.9, 0.95] as XZ, height: 2.9 },
  cube: { center: [3.7, -0.98] as XZ, size: 1.3, bottom: 3.12 },
  freezer: { center: [3.7, 1.95] as XZ, size: [1.3, 0.68] as XZ },
  /** Geranios a los lados de la entrada de El Real y limonero junto al costado oeste. */
  geraniums: [
    [-3.25, 2.55],
    [-1.75, 2.55],
  ] as readonly XZ[],
  lemonTree: [-3.85, -0.95] as XZ,
  /** Macetas de patio cordobés colgadas de la trastienda: [x, z, y de la base]. */
  wallPots: {
    north: [3.3, 3.75, 4.2] as readonly number[],
    east: [-2.4, 0.4] as readonly number[],
    y: 1.55,
  },
}

function pieldetoroColliders(): Rect[] {
  const p = PIELDETORO
  const r = p.postRadius * 2
  const rail = ([[x0, z0], [x1, z1]]: Segment) =>
    rect(
      Math.min(x0, x1) - 0.03,
      Math.min(z0, z1) - 0.03,
      Math.max(x0, x1) + 0.03,
      Math.max(z0, z1) + 0.03,
    )
  return [
    ...p.postXs.flatMap((x) => p.postZs.map((z) => box(x, z, r, r))),
    ...p.rails.map(rail),
    rect(p.tablao.x[0], p.tablao.z[0], p.tablao.x[1], p.tablao.z[1]),
    ...p.tables.map(([x, z]) => box(x, z, 1.1, 1.1)),
    box(...p.bar.center, ...p.bar.size),
    box(...p.spine.center, ...p.spine.size),
    ...p.standTables.map((t) => box(...t, p.barrelRadius * 2, p.barrelRadius * 2)),
    rect(p.backroom.x[0], p.backroom.z[0], p.backroom.x[1], p.backroom.z[1]),
    box(...p.freezer.center, ...p.freezer.size),
    ...p.geraniums.map((g) => box(...g, 0.34, 0.34)),
    box(...p.lemonTree, 0.62, 0.62),
  ]
}

/** Obstáculos de cada tipo de stand en su marco local. */
export const STAND_COLLIDERS: Record<StandKind, () => Rect[]> = {
  jamon: jamonColliders,
  quesos: quesosColliders,
  embutidos: embutidosColliders,
  croquetas: croquetasColliders,
  vinos: vinosColliders,
  cervezas: cervezasColliders,
  sidras: sidrasColliders,
  tapas: pieldetoroColliders,
  aceitunas: aceitunasColliders,
}
