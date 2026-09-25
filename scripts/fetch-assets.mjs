#!/usr/bin/env node
// Descarga los assets CC0/OFL declarados en assets.manifest.json y genera CREDITS.md.
// Idempotente: los ficheros que ya existen no se vuelven a descargar.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'assets')
const manifest = JSON.parse(readFileSync(join(ROOT, 'scripts', 'assets.manifest.json'), 'utf8'))

/** Mapas de Poly Haven → nombre normalizado en disco. */
const POLYHAVEN_MAPS = { Diffuse: 'diff', nor_gl: 'nor', arm: 'arm' }
/** Sufijos de ambientCG → nombre normalizado en disco. */
const AMBIENTCG_MAPS = { Color: 'diff', NormalGL: 'nor', Roughness: 'rough', AmbientOcclusion: 'ao' }

async function download(url, dest) {
  if (existsSync(dest)) return false
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`)
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
  return true
}

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`)
  return res.json()
}

async function fetchHdri({ id, res }) {
  const files = await getJson(`https://api.polyhaven.com/files/${id}`)
  const url = files.hdri?.[res]?.hdr?.url
  if (!url) throw new Error(`HDRI ${id} no tiene resolución ${res}`)
  await download(url, join(OUT, 'hdri', `${id}_${res}.hdr`))
  return { name: id, url: `https://polyhaven.com/a/${id}`, license: 'CC0', source: 'Poly Haven' }
}

async function fetchPolyhaven({ id, res }) {
  const files = await getJson(`https://api.polyhaven.com/files/${id}`)
  for (const [key, name] of Object.entries(POLYHAVEN_MAPS)) {
    const url = files[key]?.[res]?.jpg?.url
    if (!url) throw new Error(`Textura ${id} sin mapa ${key} en ${res}`)
    await download(url, join(OUT, 'textures', id, `${name}.jpg`))
  }
  return { name: id, url: `https://polyhaven.com/a/${id}`, license: 'CC0', source: 'Poly Haven' }
}

async function fetchAmbientcg({ id, res }) {
  const dir = join(OUT, 'textures', id)
  const wanted = Object.values(AMBIENTCG_MAPS).map((n) => join(dir, `${n}.jpg`))
  if (!wanted.every(existsSync)) {
    const zip = join(tmpdir(), `${id}_${res}.zip`)
    const unzipDir = join(tmpdir(), `${id}_${res}`)
    await download(`https://ambientcg.com/get?file=${id}_${res}-JPG.zip`, zip)
    rmSync(unzipDir, { recursive: true, force: true })
    execFileSync('unzip', ['-o', '-q', zip, '-d', unzipDir])
    mkdirSync(dir, { recursive: true })
    for (const [suffix, name] of Object.entries(AMBIENTCG_MAPS)) {
      const src = join(unzipDir, `${id}_${res}-JPG_${suffix}.jpg`)
      if (!existsSync(src)) throw new Error(`ambientCG ${id}: falta ${suffix}`)
      copyFileSync(src, join(dir, `${name}.jpg`))
    }
  }
  return { name: id, url: `https://ambientcg.com/view?id=${id}`, license: 'CC0', source: 'ambientCG' }
}

async function fetchFont({ slug, weight }) {
  const url = `https://cdn.jsdelivr.net/fontsource/fonts/${slug}@latest/latin-${weight}-normal.woff`
  await download(url, join(OUT, 'fonts', `${slug}-${weight}.woff`))
  return { name: `${slug} ${weight}`, url: `https://fontsource.org/fonts/${slug}`, license: 'SIL OFL 1.1', source: 'Fontsource / Google Fonts' }
}

async function main() {
  const credits = []
  const jobs = [
    ...manifest.hdris.map((a) => ['HDRI', fetchHdri, a]),
    ...manifest.polyhaven.map((a) => ['Textura', fetchPolyhaven, a]),
    ...manifest.ambientcg.map((a) => ['Textura', fetchAmbientcg, a]),
    ...manifest.fonts.map((a) => ['Fuente', fetchFont, a]),
  ]
  for (const [kind, fn, asset] of jobs) {
    const label = asset.id ?? `${asset.slug}-${asset.weight}`
    process.stdout.write(`· ${kind} ${label} … `)
    const credit = await fn(asset)
    credits.push({ kind, ...credit, use: asset.use ?? '' })
    process.stdout.write('ok\n')
  }

  const rows = credits
    .map((c) => `| ${c.kind} | [${c.name}](${c.url}) | ${c.source} | ${c.license} | ${c.use} |`)
    .join('\n')
  writeFileSync(
    join(ROOT, 'CREDITS.md'),
    `# Créditos de assets\n\nGenerado por \`npm run assets\`. Todos los assets son CC0 (dominio público) o SIL OFL 1.1.\n\n| Tipo | Asset | Fuente | Licencia | Uso |\n|---|---|---|---|---|\n${rows}\n`,
  )
  console.log(`\n${credits.length} assets listos en public/assets · CREDITS.md actualizado`)
}

main().catch((err) => {
  console.error(`\n✖ ${err.message}`)
  process.exit(1)
})
