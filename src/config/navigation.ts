import type { Vec2 } from '../camera/collision'
import { buildColliders } from './colliders'
import { center, outward } from './geometry'
import type { FairConfig, Rect, Side, StandConfig } from './types'

const STEP = 0.5
const CLEARANCE = 0.34
const DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const

function sideExit(plot: Rect, side: Side): Vec2 {
  const [x, z] = center(plot)
  const [dx, dz] = outward(side)
  const edge = dx ? (dx > 0 ? plot.x1 : plot.x0) : dz > 0 ? plot.z1 : plot.z0
  return dx ? [edge + dx * 0.9, z] : [x, edge + dz * 0.9]
}

export function standEntrance(stand: StandConfig): Vec2 {
  return sideExit(stand.plot, stand.front)
}

function clear(point: Vec2, obstacles: readonly Rect[]): boolean {
  const [x, z] = point
  return obstacles.every((r) => {
    const nx = Math.max(r.x0, Math.min(x, r.x1))
    const nz = Math.max(r.z0, Math.min(z, r.z1))
    return (x - nx) ** 2 + (z - nz) ** 2 >= CLEARANCE ** 2
  })
}

function visible(a: Vec2, b: Vec2, obstacles: readonly Rect[]): boolean {
  const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.15)
  for (let i = 0; i <= steps; i++) {
    const t = i / Math.max(1, steps)
    if (!clear([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], obstacles)) return false
  }
  return true
}

/** A* sobre la planta del pabellón, con los mismos obstáculos que usa el paseo. */
export function createNavigator(
  fair: FairConfig,
  avoidPlots = true,
): { route: (from: Vec2, to: Vec2) => Vec2[]; clear: (p: Vec2) => boolean } {
  // La línea de orientación discurre por pasillos: los interiores de las parcelas no son atajos.
  const obstacles = [
    ...buildColliders(fair),
    ...(avoidPlots ? fair.stands.map((stand) => stand.plot) : []),
    ...(avoidPlots ? fair.neighbors.map((neighbor) => neighbor.plot) : []),
  ]
  const plots = [...fair.stands, ...fair.neighbors]
  const { bounds } = fair.hall
  const x0 = bounds.x0 + STEP
  const z0 = bounds.z0 + STEP
  const columns = Math.floor((bounds.x1 - bounds.x0 - 2 * STEP) / STEP) + 1
  const rows = Math.floor((bounds.z1 - bounds.z0 - 2 * STEP) / STEP) + 1
  const count = columns * rows
  const point = (index: number): Vec2 => [
    x0 + (index % columns) * STEP,
    z0 + Math.floor(index / columns) * STEP,
  ]
  const blocked = Array.from({ length: count }, (_, i) => !clear(point(i), obstacles))
  const indexOf = ([x, z]: Vec2) => {
    const col = Math.max(0, Math.min(columns - 1, Math.round((x - x0) / STEP)))
    const row = Math.max(0, Math.min(rows - 1, Math.round((z - z0) / STEP)))
    return row * columns + col
  }
  const nearestOpen = (p: Vec2) => {
    const origin = indexOf(p)
    if (!blocked[origin]) return origin
    const col = origin % columns
    const row = Math.floor(origin / columns)
    for (let radius = 1; radius < Math.max(columns, rows); radius++) {
      let best = -1
      let distance = Infinity
      for (let dz = -radius; dz <= radius; dz++)
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue
          const cx = col + dx
          const cz = row + dz
          if (cx < 0 || cx >= columns || cz < 0 || cz >= rows) continue
          const i = cz * columns + cx
          if (blocked[i]) continue
          const q = point(i)
          const d = Math.hypot(q[0] - p[0], q[1] - p[1])
          if (d < distance) {
            best = i
            distance = d
          }
        }
      if (best >= 0) return best
    }
    return -1
  }

  function search(from: Vec2, to: Vec2): Vec2[] {
    if (visible(from, to, obstacles)) return [from, to]
    const start = nearestOpen(from)
    const goal = nearestOpen(to)
    if (start < 0 || goal < 0) return []

    const g = new Float32Array(count).fill(Infinity)
    const previous = new Int32Array(count).fill(-1)
    const closed = new Uint8Array(count)
    const heap: { index: number; score: number }[] = []
    const goalPoint = point(goal)
    const heuristic = (i: number) => {
      const p = point(i)
      return Math.hypot(p[0] - goalPoint[0], p[1] - goalPoint[1])
    }
    const push = (index: number, score: number) => {
      let i = heap.length
      heap.push({ index, score })
      while (i > 0) {
        const parent = Math.floor((i - 1) / 2)
        if (heap[parent]!.score <= score) break
        heap[i] = heap[parent]!
        i = parent
      }
      heap[i] = { index, score }
    }
    const pop = () => {
      const first = heap[0]!
      const last = heap.pop()!
      if (heap.length) {
        let i = 0
        while (i * 2 + 1 < heap.length) {
          let child = i * 2 + 1
          if (child + 1 < heap.length && heap[child + 1]!.score < heap[child]!.score) child++
          if (heap[child]!.score >= last.score) break
          heap[i] = heap[child]!
          i = child
        }
        heap[i] = last
      }
      return first.index
    }
    g[start] = 0
    push(start, heuristic(start))

    while (heap.length) {
      const current = pop()
      if (closed[current]) continue
      if (current === goal) break
      closed[current] = 1
      const col = current % columns
      const row = Math.floor(current / columns)
      for (const [dx, dz] of DIRECTIONS) {
        const cx = col + dx
        const cz = row + dz
        if (cx < 0 || cx >= columns || cz < 0 || cz >= rows) continue
        const next = cz * columns + cx
        if (blocked[next] || closed[next]) continue
        // No se permite cortar la esquina de dos muros en diagonal.
        if (dx && dz && (blocked[row * columns + cx] || blocked[cz * columns + col])) continue
        const cost = g[current]! + STEP * (dx && dz ? Math.SQRT2 : 1)
        if (cost >= g[next]!) continue
        g[next] = cost
        previous[next] = current
        push(next, cost + heuristic(next))
      }
    }
    if (!Number.isFinite(g[goal])) return []
    const cells: Vec2[] = []
    for (let i = goal; i !== -1; i = previous[i]!) cells.push(point(i))
    cells.reverse()
    const path: Vec2[] = [from, ...cells]
    if (visible(path[path.length - 1]!, to, obstacles)) path.push(to)

    // Quita puntos de cuadrícula redundantes, manteniendo el margen ante los obstáculos.
    const smooth: Vec2[] = [path[0]!]
    for (let i = 0; i < path.length - 1;) {
      let next = path.length - 1
      while (next > i + 1 && !visible(path[i]!, path[next]!, obstacles)) next--
      smooth.push(path[next]!)
      i = next
    }
    return smooth
  }

  let indoorRoute: ((from: Vec2, to: Vec2) => Vec2[]) | null = null
  function route(from: Vec2, to: Vec2): Vec2[] {
    if (avoidPlots) {
      const containing = plots.find(
        ({ plot }) =>
          from[0] > plot.x0 && from[0] < plot.x1 && from[1] > plot.z0 && from[1] < plot.z1,
      )
      if (containing) {
        indoorRoute ??= createNavigator(fair, false).route
        let best: Vec2[] = []
        let shortest = Infinity
        for (const side of containing.openSides) {
          const exit = sideExit(containing.plot, side)
          const inside = indoorRoute(from, exit)
          const outside = search(exit, to)
          if (!inside.length || !outside.length) continue
          const candidate = [...inside, ...outside.slice(1)]
          const length = candidate.reduce((sum, p, i) => {
            const previous = candidate[i - 1]
            return previous ? sum + Math.hypot(p[0] - previous[0], p[1] - previous[1]) : sum
          }, 0)
          if (length < shortest) {
            best = candidate
            shortest = length
          }
        }
        return best
      }
    }
    return search(from, to)
  }

  return { route, clear: (p: Vec2) => clear(p, obstacles) }
}
