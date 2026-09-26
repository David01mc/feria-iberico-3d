import { area, computeOpenSides, contains, overlaps } from './geometry'
import type { FairConfig, Side, StandLayout, StandSize } from './types'

export type IssueCode =
  | 'out-of-area'
  | 'overlap'
  | 'size-mismatch'
  | 'open-sides'
  | 'layout-mismatch'
  | 'front-closed'
  | 'duplicate-code'
  | 'hall-bounds'

export interface ValidationIssue {
  code: IssueCode
  subject: string
  message: string
}

/** Tramos de superficie que usa la organización para tarificar el espacio. */
export function sizeCategory(m2: number): StandSize {
  if (m2 <= 12) return 'pequeño'
  if (m2 <= 30) return 'mediano'
  return 'grande'
}

const OPEN_SIDES_BY_LAYOUT: Record<StandLayout, number> = {
  isla: 4,
  peninsula: 3,
  esquina: 2,
  lineal: 1,
  kiosco: 1,
}

const OPPOSITE: Record<Side, Side> = { north: 'south', south: 'north', east: 'west', west: 'east' }

const sameSides = (a: Side[], b: Side[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join()

/** Comprueba que el plano de la feria es construible y coherente con lo contratado. */
export function validateFair(fair: FairConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const { exhibitionArea, bounds } = fair.hall
  const plots = [
    ...fair.stands.map((s) => ({ code: s.code, plot: s.plot })),
    ...fair.neighbors.map((n) => ({ code: n.code, plot: n.plot })),
  ]

  if (!contains(bounds, exhibitionArea)) {
    issues.push({
      code: 'hall-bounds',
      subject: 'hall',
      message: 'La zona de exposición sale del pabellón',
    })
  }

  const seen = new Set<string>()
  for (const { code } of plots) {
    if (seen.has(code)) {
      issues.push({
        code: 'duplicate-code',
        subject: code,
        message: `Código de parcela repetido: ${code}`,
      })
    }
    seen.add(code)
  }

  plots.forEach((a, i) => {
    if (!contains(exhibitionArea, a.plot)) {
      issues.push({
        code: 'out-of-area',
        subject: a.code,
        message: `${a.code} está fuera de la zona de exposición`,
      })
    }
    for (const b of plots.slice(i + 1)) {
      if (overlaps(a.plot, b.plot)) {
        issues.push({
          code: 'overlap',
          subject: a.code,
          message: `${a.code} se solapa con ${b.code}`,
        })
      }
    }
  })

  for (const stand of fair.stands) {
    const m2 = area(stand.plot)
    const expected = sizeCategory(m2)
    if (expected !== stand.size) {
      issues.push({
        code: 'size-mismatch',
        subject: stand.id,
        message: `${stand.id}: ${m2} m² es un espacio ${expected}, no ${stand.size}`,
      })
    }

    const others = plots.filter((p) => p.code !== stand.code).map((p) => p.plot)
    const actual = computeOpenSides(stand.plot, others, exhibitionArea)
    if (!sameSides(actual, stand.openSides)) {
      issues.push({
        code: 'open-sides',
        subject: stand.id,
        message: `${stand.id}: declara [${stand.openSides}] pero el plano abre [${actual}]`,
      })
    }

    if (!stand.openSides.includes(stand.front)) {
      issues.push({
        code: 'front-closed',
        subject: stand.id,
        message: `${stand.id}: el frente ${stand.front} no da a pasillo`,
      })
    }

    const wanted = OPEN_SIDES_BY_LAYOUT[stand.layout]
    const [first, second] = stand.openSides
    const oppositeCorner =
      stand.layout === 'esquina' && first && second && OPPOSITE[first] === second
    if (stand.openSides.length !== wanted || oppositeCorner) {
      issues.push({
        code: 'layout-mismatch',
        subject: stand.id,
        message: `${stand.id}: un stand ${stand.layout} necesita ${wanted} lados abiertos contiguos`,
      })
    }
  }

  return issues
}
