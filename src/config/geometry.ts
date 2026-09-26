import type { Rect, Side } from './types'

const EPS = 1e-6

/** Crea un rectángulo a partir de dos esquinas opuestas (en cualquier orden). */
export function rect(xa: number, za: number, xb: number, zb: number): Rect {
  return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), z0: Math.min(za, zb), z1: Math.max(za, zb) }
}

export const width = (r: Rect) => r.x1 - r.x0
export const depth = (r: Rect) => r.z1 - r.z0
export const area = (r: Rect) => width(r) * depth(r)
export const center = (r: Rect): [number, number] => [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2]

/** Solape con área positiva (dos parcelas que comparten borde no se solapan). */
export function overlaps(a: Rect, b: Rect): boolean {
  return a.x0 < b.x1 - EPS && b.x0 < a.x1 - EPS && a.z0 < b.z1 - EPS && b.z0 < a.z1 - EPS
}

export function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x0 >= outer.x0 - EPS &&
    inner.x1 <= outer.x1 + EPS &&
    inner.z0 >= outer.z0 - EPS &&
    inner.z1 <= outer.z1 + EPS
  )
}

/**
 * Franja exterior pegada a un lado del rectángulo, ligeramente recortada en sus extremos
 * para que las parcelas que solo tocan la esquina no cuenten como vecinas de ese lado.
 */
export function sideStrip(r: Rect, side: Side, thickness: number, inset = 0.05): Rect {
  switch (side) {
    case 'north':
      return rect(r.x0 + inset, r.z0 - thickness, r.x1 - inset, r.z0)
    case 'south':
      return rect(r.x0 + inset, r.z1, r.x1 - inset, r.z1 + thickness)
    case 'west':
      return rect(r.x0 - thickness, r.z0 + inset, r.x0, r.z1 - inset)
    case 'east':
      return rect(r.x1, r.z0 + inset, r.x1 + thickness, r.z1 - inset)
  }
}

/** Franja interior pegada a un lado (p. ej. el panel de un stand modular). */
export function innerStrip(r: Rect, side: Side, thickness: number): Rect {
  switch (side) {
    case 'north':
      return rect(r.x0, r.z0, r.x1, r.z0 + thickness)
    case 'south':
      return rect(r.x0, r.z1 - thickness, r.x1, r.z1)
    case 'west':
      return rect(r.x0, r.z0, r.x0 + thickness, r.z1)
    case 'east':
      return rect(r.x1 - thickness, r.z0, r.x1, r.z1)
  }
}

/** Parte un bloque en parcelas consecutivas a lo largo de un eje. */
export function subdivide(block: Rect, axis: 'x' | 'z', sizes: number[]): Rect[] {
  const total = sizes.reduce((sum, s) => sum + s, 0)
  const extent = axis === 'x' ? width(block) : depth(block)
  if (Math.abs(total - extent) > EPS) {
    throw new Error(`Las medidas suman ${total} m pero el bloque mide ${extent} m`)
  }
  let cursor = axis === 'x' ? block.x0 : block.z0
  return sizes.map((size) => {
    const start = cursor
    cursor += size
    return axis === 'x'
      ? rect(start, block.z0, cursor, block.z1)
      : rect(block.x0, start, block.x1, cursor)
  })
}

export const SIDES: readonly Side[] = ['north', 'south', 'east', 'west']

/**
 * Un lado está abierto si la franja exterior es pasillo: cae dentro de la zona de exposición
 * y no la ocupa ninguna otra parcela.
 */
export function computeOpenSides(
  plot: Rect,
  others: Rect[],
  exhibitionArea: Rect,
  probe = 0.5,
): Side[] {
  return SIDES.filter((side) => {
    const strip = sideStrip(plot, side, probe)
    return contains(exhibitionArea, strip) && !others.some((o) => overlaps(o, strip))
  })
}

/** Vector unitario [x, z] que apunta desde la parcela hacia fuera por ese lado. */
export function outward(side: Side): [number, number] {
  switch (side) {
    case 'north':
      return [0, -1]
    case 'south':
      return [0, 1]
    case 'east':
      return [1, 0]
    case 'west':
      return [-1, 0]
  }
}

/**
 * Segmento paralelo a un lado, desplazado `inset` metros hacia dentro de la parcela.
 * Una pieza de tamaño [length, alto, grosor] con `rotationY` queda alineada con ese lado
 * y con su cara +z mirando al exterior.
 */
export function sideSegment(r: Rect, side: Side, inset = 0) {
  const [cx, cz] = center(r)
  const [ox, oz] = outward(side)
  const halfW = width(r) / 2
  const halfD = depth(r) / 2
  const reach = side === 'north' || side === 'south' ? halfD : halfW
  return {
    center: [cx + ox * (reach - inset), cz + oz * (reach - inset)] as [number, number],
    length: side === 'north' || side === 'south' ? width(r) : depth(r),
    rotationY: sideRotation(side),
  }
}

/**
 * Marco local de un stand: origen en el centro de la parcela, frente principal hacia +z,
 * `width` a lo largo de x local y `depth` a lo largo de z local.
 */
export interface StandFrame {
  center: [number, number]
  rotationY: number
  width: number
  depth: number
}

export function standFrame(plot: Rect, front: Side): StandFrame {
  const alongX = front === 'north' || front === 'south'
  return {
    center: center(plot),
    rotationY: sideRotation(front),
    width: alongX ? width(plot) : depth(plot),
    depth: alongX ? depth(plot) : width(plot),
  }
}

/** Punto local [x, z] del stand → planta del pabellón (giro sobre +y, como three.js). */
export function localToWorld(frame: StandFrame, [lx, lz]: [number, number]): [number, number] {
  const c = Math.cos(frame.rotationY)
  const s = Math.sin(frame.rotationY)
  const round = (v: number) => Math.round(v * 1e9) / 1e9
  return [round(frame.center[0] + lx * c + lz * s), round(frame.center[1] - lx * s + lz * c)]
}

/** Rectángulo local → planta (los giros son múltiplos de 90°, así que sigue alineado). */
export function localRectToWorld(frame: StandFrame, r: Rect): Rect {
  const [ax, az] = localToWorld(frame, [r.x0, r.z0])
  const [bx, bz] = localToWorld(frame, [r.x1, r.z1])
  return rect(ax, az, bx, bz)
}

/** Ángulo (rad, sobre +y) que orienta el frente local (+z) de un objeto hacia ese lado. */
export function sideRotation(side: Side): number {
  switch (side) {
    case 'south':
      return 0
    case 'north':
      return Math.PI
    case 'east':
      return Math.PI / 2
    case 'west':
      return -Math.PI / 2
  }
}
