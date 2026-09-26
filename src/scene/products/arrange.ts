import { Quaternion, Vector3 } from 'three'
import type { Vec3 } from '../../materials/geometry'

/*
 * Colocación de producto: funciones puras que devuelven posiciones listas para instanciar.
 * Las variaciones "a mano" (giros, holguras) usan un generador con semilla: la feria se ve
 * igual en cada carga y en cada captura.
 */

export interface Placement {
  position: Vec3
  /** Giro Euler XYZ en radianes (se ignora si hay `quaternion`). */
  rotation?: Vec3
  quaternion?: [number, number, number, number]
  scale?: number
  /** Tinte multiplicativo (variación de color entre piezas). */
  tint?: string
}

/** Generador pseudoaleatorio mulberry32: determinista, en [0, 1). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const spread = (random: () => number, amount: number) => (random() * 2 - 1) * amount

export interface GridOptions {
  /** Separación entre centros [a lo ancho, a lo hondo]. */
  spacing: [number, number]
  margin?: number
  /** Holgura aleatoria de la posición (m). */
  jitter?: number
  /** Giro aleatorio máximo sobre el eje vertical (rad). */
  rotationJitter?: number
  baseRotation?: Vec3
  seed?: number
}

/** Rellena una superficie horizontal (bandeja, balda, tabla) con una rejilla centrada. */
export function gridOnSurface(
  surface: { center: Vec3; size: [number, number] },
  {
    spacing,
    margin = 0,
    jitter = 0,
    rotationJitter = 0,
    baseRotation = [0, 0, 0],
    seed = 1,
  }: GridOptions,
): Placement[] {
  const [cx, cy, cz] = surface.center
  const [w, d] = surface.size
  const cols = Math.max(1, Math.floor((w - 2 * margin) / spacing[0] + 1e-9))
  const rows = Math.max(1, Math.floor((d - 2 * margin) / spacing[1] + 1e-9))
  const random = seeded(seed)
  const items: Placement[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      items.push({
        position: [
          cx + (c - (cols - 1) / 2) * spacing[0] + spread(random, jitter),
          cy,
          cz + (r - (rows - 1) / 2) * spacing[1] + spread(random, jitter),
        ],
        rotation: [
          baseRotation[0],
          baseRotation[1] + spread(random, rotationJitter),
          baseRotation[2],
        ],
      })
    }
  }
  return items
}

/** Reparte `count` piezas a lo largo de un segmento (p. ej. jamones en una barra). */
export function alongLine(
  from: Vec3,
  to: Vec3,
  count: number,
  {
    rotationJitter = 0,
    baseRotation = [0, 0, 0],
    seed = 1,
  }: Omit<GridOptions, 'spacing' | 'margin' | 'jitter'> = {},
): Placement[] {
  const random = seeded(seed)
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count
    return {
      position: [
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
        from[2] + (to[2] - from[2]) * t,
      ],
      rotation: [
        baseRotation[0],
        baseRotation[1] + spread(random, rotationJitter),
        baseRotation[2],
      ],
    }
  })
}

/** Pila de ruedas de queso en pirámide: cada piso centrado sobre el anterior. */
export function wheelStack(
  base: Vec3,
  {
    radius,
    height,
    layers,
    seed = 1,
  }: { radius: number; height: number; layers: number[]; seed?: number },
): Placement[] {
  const random = seeded(seed)
  const items: Placement[] = []
  layers.forEach((count, level) => {
    for (let i = 0; i < count; i++) {
      items.push({
        position: [
          base[0] + (i - (count - 1) / 2) * radius * 2.02,
          base[1] + level * height,
          base[2],
        ],
        rotation: [0, random() * Math.PI * 2, 0],
      })
    }
  })
  return items
}

/** Variación de tono entre piezas (ninguna croqueta sale igual de la freidora). */
export function withTints(items: Placement[], tints: string[], seed = 1): Placement[] {
  const random = seeded(seed)
  return items.map((item) => ({ ...item, tint: tints[Math.floor(random() * tints.length)] }))
}

/**
 * Coloca una pieza rígida de modo que su ancla local A coincida con `worldA` y la dirección
 * A→B apunte a `worldB` (p. ej. el jamón apoyado en la cuna y con la pezuña en la mordaza).
 */
export function alignTwoPoints(
  localA: Vec3,
  localB: Vec3,
  worldA: Vec3,
  worldB: Vec3,
): { position: Vec3; quaternion: [number, number, number, number] } {
  const from = new Vector3(...localB).sub(new Vector3(...localA)).normalize()
  const to = new Vector3(...worldB).sub(new Vector3(...worldA)).normalize()
  const q = new Quaternion().setFromUnitVectors(from, to)
  const position = new Vector3(...worldA).sub(new Vector3(...localA).applyQuaternion(q))
  return { position: [position.x, position.y, position.z], quaternion: [q.x, q.y, q.z, q.w] }
}
