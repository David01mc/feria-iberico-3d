#!/usr/bin/env node
// Compresión de texturas a KTX2 (Basis Universal): se quedan comprimidas también en la GPU,
// con ~4-8× menos VRAM que un JPG/WebP descomprimido y sin decodificar en el hilo principal.
//
//   npm run textures   → convierte todo lo pendiente (texturas PBR de .cache y GLB de productos)
//
// Criterio por tipo de mapa:
// - color (albedo tileable): ETC1S, el más ligero; el ruido de bloque se pierde en el patrón.
// - detail (albedo de productos y modelos): UASTC, sin banding en degradados orgánicos.
// - packed (ARM, rugosidad y AO de las texturas PBR): ETC1S lineal, ~3× menos que UASTC. ETC1S
//   acopla los canales, pero el visor solo lee R (AO) y G (rugosidad), que siguen el mismo relieve;
//   el azul (metal) no se usa.
// - normal / linear (normales; mapas lineales de los GLB): UASTC lineal con RDO + Zstandard.
import { availableParallelism } from 'node:os'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const TEXTURE_CACHE = join(ROOT, '.cache', 'textures')
export const TEXTURE_OUT = join(ROOT, 'public', 'assets', 'textures')
const MODELS_OUT = join(ROOT, 'public', 'assets', 'models')
/**
 * Grupos de modelos con texturas en KTX2. El mobiliario de Poly Haven se queda en WebP a 512 px:
 * en KTX2 pesaría ~6× más de descarga para piezas que ocupan poco en pantalla.
 */
const KTX2_MODEL_GROUPS = ['products']

const UASTC = { isUASTC: true, uastcLDRQualityLevel: 0, enableRDO: true, rdoQualityLevel: 3, needSupercompression: true }
const PRESETS = {
  color: { isUASTC: false, qualityLevel: 230, compressionLevel: 2, isPerceptual: true, isSetKTX2SRGBTransferFunc: true },
  detail: { ...UASTC, rdoQualityLevel: 1.5, isPerceptual: true, isSetKTX2SRGBTransferFunc: true },
  packed: { isUASTC: false, qualityLevel: 230, compressionLevel: 2, isPerceptual: false, isSetKTX2SRGBTransferFunc: false },
  normal: { ...UASTC, isNormalMap: true, isPerceptual: false, isSetKTX2SRGBTransferFunc: false },
  linear: { ...UASTC, isPerceptual: false, isSetKTX2SRGBTransferFunc: false },
}

const log = (msg) => process.stdout.write(`${msg}\n`)
const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`

/**
 * Codifica una imagen a KTX2 con mipmaps. `square` la lleva a potencia de dos (los formatos por
 * bloques exigen lados múltiplos de 4); `flipY` reproduce la orientación de TextureLoader.
 */
async function encode(buffer, kind, { flipY = false, square = false } = {}) {
  const [{ encodeToKTX2 }, { default: sharp }] = await Promise.all([import('ktx2-encoder'), import('sharp')])
  const imageDecoder = async (input) => {
    let image = sharp(input)
    if (square) {
      const { width = 1024, height = 1024 } = await image.metadata()
      const size = 2 ** Math.round(Math.log2(Math.max(width, height)))
      if (width !== size || height !== size) image = image.resize(size, size, { fit: 'fill' })
    }
    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    return { data: new Uint8Array(data), width: info.width, height: info.height }
  }
  // El codificador escribe su registro por stdout: se silencia mientras trabaja.
  const write = process.stdout.write
  process.stdout.write = () => true
  try {
    return await encodeToKTX2(new Uint8Array(buffer), {
      ...PRESETS[kind],
      generateMipmap: true,
      isKTX2File: true,
      isYFlip: flipY,
      imageDecoder,
    })
  } finally {
    process.stdout.write = write
  }
}

/** Mapa de textura PBR suelta (jpg en .cache) → .ktx2 en public. */
async function encodeTextureFile({ src, dest, kind }) {
  const out = await encode(readFileSync(src), kind, { flipY: true, square: true })
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, out)
  return `${relative(ROOT, dest)} (${kb(statSync(src).size)} → ${kb(out.byteLength)})`
}

const slotKind = (slots) =>
  slots.some((s) => /normal/i.test(s))
    ? 'normal'
    : slots.some((s) => /baseColor|emissive|diffuse/i.test(s))
      ? 'detail'
      : 'linear'

async function openIO() {
  const [{ NodeIO }, { ALL_EXTENSIONS }, { MeshoptDecoder, MeshoptEncoder }] = await Promise.all([
    import('@gltf-transform/core'),
    import('@gltf-transform/extensions'),
    import('meshoptimizer'),
  ])
  await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready])
  return new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })
}

/** Pasa a KTX2 las texturas embebidas de un GLB (in situ). Devuelve null si no había nada que hacer. */
async function encodeGlb({ path }) {
  const { KHRTextureBasisu } = await import('@gltf-transform/extensions')
  const io = await openIO()
  const document = await io.read(path)
  const root = document.getRoot()
  const pending = root.listTextures().filter((t) => t.getMimeType() !== 'image/ktx2')
  if (pending.length === 0) return null
  const before = statSync(path).size
  for (const texture of pending) {
    const slots = document
      .getGraph()
      .listParentEdges(texture)
      .filter((edge) => edge.getParent() !== root)
      .map((edge) => edge.getName())
    texture.setImage(await encode(texture.getImage(), slotKind(slots))).setMimeType('image/ktx2')
    if (texture.getURI()) texture.setURI(texture.getURI().replace(/\.\w+$/, '.ktx2'))
  }
  document.createExtension(KHRTextureBasisu).setRequired(true)
  await io.write(path, document)
  return `${relative(ROOT, path)} (${pending.length} texturas, ${kb(before)} → ${kb(statSync(path).size)})`
}

const HANDLERS = { texture: encodeTextureFile, glb: encodeGlb }

/** Ejecuta los trabajos en paralelo, un hilo por núcleo (la codificación es CPU pura). */
export async function runJobs(jobs, threads = Math.max(1, availableParallelism() - 1)) {
  const queue = [...jobs]
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const result = await new Promise((resolve, reject) => {
        const w = new Worker(fileURLToPath(import.meta.url), { workerData: job })
        w.once('message', resolve)
        w.once('error', reject)
      })
      if (result) log(`✓ ${result}`)
    }
  }
  await Promise.all(Array.from({ length: Math.min(threads, jobs.length) }, worker))
}

/** Trabajos pendientes: cada jpg de .cache/textures sin su .ktx2, y cada GLB de los grupos KTX2. */
export function pendingJobs() {
  const jobs = []
  if (existsSync(TEXTURE_CACHE)) {
    for (const id of readdirSync(TEXTURE_CACHE)) {
      for (const file of readdirSync(join(TEXTURE_CACHE, id)).filter((f) => f.endsWith('.jpg'))) {
        const name = file.replace(/\.jpg$/, '')
        const dest = join(TEXTURE_OUT, id, `${name}.ktx2`)
        if (existsSync(dest)) continue
        const kind = name === 'diff' ? 'color' : name === 'nor' ? 'normal' : 'packed'
        jobs.push({ type: 'texture', src: join(TEXTURE_CACHE, id, file), dest, kind })
      }
    }
  }
  for (const group of KTX2_MODEL_GROUPS) {
    for (const file of readdirSync(join(MODELS_OUT, group)).filter((f) => f.endsWith('.glb'))) {
      jobs.push({ type: 'glb', path: join(MODELS_OUT, group, file) })
    }
  }
  return jobs
}

export const glbJob = (path) => ({ type: 'glb', path })

if (!isMainThread) {
  HANDLERS[workerData.type](workerData).then((result) => parentPort.postMessage(result))
} else if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const jobs = pendingJobs()
  log(`Comprimiendo a KTX2 (${jobs.length} ficheros por revisar)…`)
  runJobs(jobs).catch((err) => {
    console.error(`✖ ${err.message}`)
    process.exit(1)
  })
}
