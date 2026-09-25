#!/usr/bin/env node
// Genera el mobiliario a medida con Blender (blender/build_models.py) y lo optimiza para la web
// con gltf-transform (meshopt). Uso: npm run models [-- nombre ...]
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RAW = join(ROOT, '.cache', 'blender')
const OUT = join(ROOT, 'public', 'assets', 'models', 'custom')
const GLTF_TRANSFORM = join(ROOT, 'node_modules', '.bin', 'gltf-transform')
const only = process.argv.slice(2)

mkdirSync(RAW, { recursive: true })
mkdirSync(OUT, { recursive: true })

try {
  execFileSync(
    'blender',
    ['-b', '--factory-startup', '--python', join(ROOT, 'blender', 'build_models.py'), '--', RAW, ...only],
    { stdio: ['ignore', 'inherit', 'inherit'] },
  )
} catch {
  console.error('✖ Blender falló (¿está instalado y en el PATH? `brew install --cask blender`)')
  process.exit(1)
}

for (const file of readdirSync(RAW).filter((f) => f.endsWith('.glb'))) {
  if (only.length && !only.includes(file.replace(/\.glb$/, ''))) continue
  const out = join(OUT, file)
  // --palette false: conserva los nombres de material, que el visor sustituye por su librería PBR.
  execFileSync(
    GLTF_TRANSFORM,
    ['optimize', join(RAW, file), out, '--compress', 'meshopt', '--palette', 'false', '--texture-compress', 'false'],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  )
  console.log(`✓ ${file} → public/assets/models/custom (${(statSync(out).size / 1024).toFixed(0)} KB)`)
}
