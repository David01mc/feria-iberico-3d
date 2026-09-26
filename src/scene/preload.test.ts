import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PRODUCTS } from './products/catalog'
import { MODELS } from './props/catalog'

const SRC = fileURLToPath(new URL('..', import.meta.url))

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? sources(join(dir, e.name))
      : /\.tsx?$/.test(e.name) && !/catalog(\.test)?\.ts$|\.test\.tsx?$/.test(e.name)
        ? [readFileSync(join(dir, e.name), 'utf8')]
        : [],
  )
}

describe('precarga de la feria', () => {
  const code = sources(SRC).join('\n')
  const used = (key: string) => new RegExp(`['"\`]${key}['"\`]`).test(code)
  const entries = [...Object.entries(MODELS), ...Object.entries(PRODUCTS)] as [
    string,
    { showroomOnly?: boolean },
  ][]

  it.each(entries)('%s: o lo usa algún stand o está marcado showroomOnly', (key, entry) => {
    // Todo lo que no es showroomOnly se descarga al entrar: que no sea peso muerto.
    expect(entry.showroomOnly === true || used(key)).toBe(true)
  })
})
