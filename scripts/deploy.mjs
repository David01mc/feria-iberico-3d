#!/usr/bin/env node
// Publica en Vercel (producción) un COMMIT, nunca el árbol de trabajo.
//
//   npm run deploy              → el commit actual (HEAD)
//   npm run deploy -- <ref>     → otra rama o commit
//
// La carpeta del proyecto puede tener trabajo a medias (varias sesiones editan a la vez):
// subirla tal cual publica código sin terminar o rompe el build en Vercel. Aquí se hace un
// checkout limpio del commit en una carpeta temporal, se verifica (tipos, tests y build) y se
// sube solo dist/ como sitio estático. Producción no cambia si algo falla antes de subir.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
/** Proyecto de Vercel (identificadores, no credenciales): el CLI usa la sesión del usuario. */
const VERCEL = {
  orgId: 'team_5FGM3cUXr00SaKD3xOKMuHf9',
  projectId: 'prj_5cSFiHWAoWoE90xqAeugu4CROFS3',
}

const run = (cmd, args, cwd, env = process.env) =>
  execFileSync(cmd, args, { cwd, env, stdio: 'inherit' })
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim()

const ref = process.argv[2] ?? 'HEAD'
const commit = git('rev-parse', '--short', ref)
console.log(`▶ Desplegando ${commit} (${git('log', '-1', '--format=%s', commit)})`)
if (git('status', '--porcelain', '--untracked-files=no')) {
  console.log('  Aviso: hay cambios sin commitear en la carpeta; no se publican.')
}

const dir = mkdtempSync(join(tmpdir(), 'feria-deploy-'))
try {
  git('worktree', 'add', '--detach', dir, commit)
  symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'))
  run('npx', ['vitest', 'run'], dir)
  run('npm', ['run', 'build'], dir)
  // Sitio estático: sin package.json en dist/, Vercel sirve los ficheros tal cual.
  run('npx', ['vercel', 'deploy', '--prod', '--yes', '--cwd', join(dir, 'dist')], dir, {
    ...process.env,
    VERCEL_ORG_ID: VERCEL.orgId,
    VERCEL_PROJECT_ID: VERCEL.projectId,
  })
  console.log('✓ Publicado en https://feria-iberico-3d.vercel.app')
} finally {
  execFileSync('git', ['worktree', 'remove', '--force', dir], { cwd: ROOT })
  rmSync(dir, { recursive: true, force: true })
}
