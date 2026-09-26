#!/usr/bin/env node
// Genera los modelos 3D con Blender y los optimiza para la web con gltf-transform.
//
//   npm run models                       → todo (mobiliario y productos)
//   npm run models -- products           → solo un grupo
//   npm run models -- products croqueta  → solo algunas piezas de un grupo
//   SKIP_BLENDER=1 npm run models        → solo reoptimiza lo ya generado en .cache/blender
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const GLTF_TRANSFORM = join(ROOT, 'node_modules', '.bin', 'gltf-transform')

/** --palette false conserva los nombres de material (el visor sustituye los del mobiliario). */
const GROUPS = {
  custom: {
    script: 'build_models.py',
    optimize: ['--texture-compress', 'false'],
  },
  products: {
    script: 'build_products.py',
    optimize: ['--texture-compress', 'webp', '--texture-size', '2048'],
    meta: join(ROOT, 'src', 'scene', 'products', 'meta.json'),
  },
}

const [groupArg, ...names] = process.argv.slice(2)
const groups = groupArg ? [groupArg] : Object.keys(GROUPS)
if (groupArg && !GROUPS[groupArg]) {
  console.error(`✖ Grupo desconocido "${groupArg}". Grupos: ${Object.keys(GROUPS).join(', ')}`)
  process.exit(1)
}

for (const name of groups) {
  const group = GROUPS[name]
  const raw = join(ROOT, '.cache', 'blender', name)
  const out = join(ROOT, 'public', 'assets', 'models', name)
  mkdirSync(raw, { recursive: true })
  mkdirSync(out, { recursive: true })

  if (!process.env.SKIP_BLENDER) {
    try {
      execFileSync(
        'blender',
        ['-b', '--factory-startup', '--python', join(ROOT, 'blender', group.script), '--', raw, ...names],
        { stdio: ['ignore', 'inherit', 'inherit'] },
      )
    } catch {
      console.error('✖ Blender falló (¿está instalado y en el PATH? `brew install --cask blender`)')
      process.exit(1)
    }
  }

  for (const file of readdirSync(raw).filter((f) => f.endsWith('.glb'))) {
    if (names.length && !names.includes(file.replace(/\.glb$/, ''))) continue
    const target = join(out, file)
    execFileSync(
      GLTF_TRANSFORM,
      ['optimize', join(raw, file), target, '--compress', 'meshopt', '--palette', 'false', ...group.optimize],
      { stdio: ['ignore', 'ignore', 'inherit'] },
    )
    console.log(`✓ ${file} → public/assets/models/${name} (${(statSync(target).size / 1024).toFixed(0)} KB)`)
  }

  if (group.meta && existsSync(join(raw, 'meta.json'))) {
    copyFileSync(join(raw, 'meta.json'), group.meta)
    console.log(`✓ meta.json → ${group.meta.replace(`${ROOT}/`, '')}`)
  }
}
