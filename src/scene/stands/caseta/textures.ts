import { use } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import { fontUrl } from '../../../materials/assets'

/*
 * Gráfica de la caseta de Piel de Toro, dibujada en canvas: lona a rayas, pañoletas pintadas,
 * escudo de la marca, azulejo, farolillos de lunares y las etiquetas de sus productos.
 * Todo vectorial y a la resolución que pide cada pieza: nítido en la foto 4K sin descargas.
 */

export const BRAND = {
  red: '#b3121f',
  deep: '#6d0f14',
  wine: '#3a0a0e',
  gold: '#d4a64a',
  goldLight: '#f0d58e',
  cream: '#f3e7cf',
  green: '#2f6b3a',
  blue: '#1d4f91',
  orange: '#e0762b',
} as const

const SERIF = 'PdtSerif'
const SCRIPT = 'PdtScript'
const SANS = 'PdtSans'

let fontsPromise: Promise<void> | null = null

/** Espera (con Suspense) a las fuentes del canvas: sin ellas el texto saldría en la del sistema. */
export function useCasetaFonts() {
  fontsPromise ??= Promise.all(
    (
      [
        [SERIF, 'playfair-display-700'],
        [SCRIPT, 'pinyon-script-400'],
        [SANS, 'inter-800'],
      ] as const
    ).map(async ([family, file]) => {
      const face = new FontFace(family, `url(${fontUrl(file)})`)
      document.fonts.add(await face.load())
    }),
  ).then(() => undefined)
  use(fontsPromise)
}

const cache = new Map<string, CanvasTexture>()

function canvasTexture(
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat = false,
): CanvasTexture {
  let texture = cache.get(key)
  if (!texture) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    draw(canvas.getContext('2d')!, width, height)
    texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 8
    if (repeat) texture.wrapS = texture.wrapT = RepeatWrapping
    cache.set(key, texture)
  }
  return texture
}

const font = (family: string, px: number) => `${Math.round(px)}px ${family}`

type Rand = () => number

/** Generador determinista (Park–Miller): los dibujos salen iguales en cada carga. */
function random(seed: number): Rand {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

// ── Escudo de piel ────────────────────────────────────────────────────────────

/** Media silueta de piel de toro estirada (oreja arriba, pata abajo), unidades −1…1. */
const HIDE: [number, number][] = [
  [0, -0.66],
  [-0.3, -0.7],
  [-0.56, -0.8],
  [-0.8, -0.98],
  [-0.72, -0.7],
  [-0.64, -0.46],
  [-0.7, -0.14],
  [-0.78, 0.22],
  [-0.86, 0.62],
  [-0.96, 0.98],
  [-0.6, 0.86],
  [-0.3, 0.76],
  [0, 0.74],
]

function hidePath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const left = HIDE.map(([x, y]) => [cx + x * r, cy + y * r] as const)
  const right = [...HIDE].reverse().map(([x, y]) => [cx - x * r, cy + y * r] as const)
  const pts = [...left, ...right.slice(1, -1)]
  const mid = (a: readonly [number, number], b: readonly [number, number]) =>
    [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as const
  ctx.beginPath()
  const start = mid(pts[pts.length - 1]!, pts[0]!)
  ctx.moveTo(start[0], start[1])
  pts.forEach((p, i) => {
    const m = mid(p, pts[(i + 1) % pts.length]!)
    ctx.quadraticCurveTo(p[0], p[1], m[0], m[1])
  })
  ctx.closePath()
}

function crown(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, color: string) {
  const h = w * 0.42
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(cx - w / 2, cy + h / 2)
  ctx.lineTo(cx - w / 2, cy - h * 0.1)
  ctx.lineTo(cx - w / 4, cy + h * 0.15)
  ctx.lineTo(cx, cy - h / 2)
  ctx.lineTo(cx + w / 4, cy + h * 0.15)
  ctx.lineTo(cx + w / 2, cy - h * 0.1)
  ctx.lineTo(cx + w / 2, cy + h / 2)
  ctx.closePath()
  ctx.fill()
  for (const [x, y] of [
    [cx - w / 2, cy - h * 0.1],
    [cx, cy - h / 2],
    [cx + w / 2, cy - h * 0.1],
  ] as const) {
    ctx.beginPath()
    ctx.arc(x, y - w * 0.06, w * 0.07, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Texto a lo largo de un arco de centro (cx, cy) y radio r, leído por encima del centro. */
function arcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  r: number,
  spread: number,
  stroke = false,
) {
  const chars = [...text]
  const widths = chars.map((c) => ctx.measureText(c).width * spread)
  let angle = -widths.reduce((a, b) => a + b, 0) / r / 2
  chars.forEach((c, i) => {
    const a = angle + widths[i]! / r / 2
    ctx.save()
    ctx.translate(cx + r * Math.sin(a), cy - r * Math.cos(a))
    ctx.rotate(a)
    if (stroke) ctx.strokeText(c, 0, 0)
    ctx.fillText(c, 0, 0)
    ctx.restore()
    angle += widths[i]! / r
  })
}

export interface LogoStyle {
  /** Relleno de la piel. */
  fill: string
  /** Contorno de la piel, corona y TP. */
  line: string
  /** Letras del nombre en arco (solo drawBrandMark). */
  name?: string
  nameStroke?: string
}

/** Escudo de Piel de Toro: piel estirada con pespunte, corona y «TP». */
export function drawLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  style: LogoStyle,
) {
  const r = size * 0.4
  hidePath(ctx, cx, cy, r)
  ctx.fillStyle = style.fill
  ctx.fill()
  ctx.lineJoin = 'round'
  ctx.lineWidth = size * 0.03
  ctx.strokeStyle = style.line
  ctx.stroke()
  hidePath(ctx, cx, cy, r * 0.86)
  ctx.setLineDash([size * 0.014, size * 0.012])
  ctx.lineWidth = size * 0.007
  ctx.stroke()
  ctx.setLineDash([])
  crown(ctx, cx, cy - r * 0.3, r * 0.62, style.line)
  ctx.fillStyle = style.line
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = font(SERIF, r * 0.72)
  ctx.fillText('TP', cx, cy + r * 0.3)
}

/** Nombre en arco, «PIEL ᴰᴱ TORO», con el «de» pequeño y alto como en el logo. */
function drawBrandArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  radius: number,
  px: number,
  fill: string,
  stroke?: string,
) {
  const cy = topY + radius
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = fill
  ctx.lineJoin = 'round'
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = px * 0.12
  }
  ctx.font = font(SERIF, px)
  const wl = ctx.measureText('PIEL').width * 1.04
  const wt = ctx.measureText('TORO').width * 1.04
  const gap = px * 0.62
  const span = (wl + gap + wt) / radius
  const word = (text: string, center: number, size: number, lift = 0) => {
    ctx.font = font(SERIF, size)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(center)
    arcText(ctx, text, 0, 0, radius + lift, 1.04, Boolean(stroke))
    ctx.restore()
  }
  word('PIEL', -span / 2 + wl / radius / 2, px)
  word('TORO', span / 2 - wt / radius / 2, px)
  word('DE', -span / 2 + (wl + gap / 2) / radius, px * 0.42, px * 0.34)
}

/** Escudo completo: nombre en arco encima de la piel con corona y TP. */
export function drawBrandMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  style: LogoStyle,
) {
  drawLogo(ctx, cx, cy + size * 0.14, size * 0.72, style)
  if (style.name)
    drawBrandArc(ctx, cx, cy - size * 0.42, size * 0.62, size * 0.16, style.name, style.nameStroke)
}

/** Caja de luz del tótem: fondo granate con halo, como la imagen de marca. */
export function logoTexture(): Texture {
  return canvasTexture('logo', 1024, 1024, (ctx, w, h) => {
    const glow = ctx.createRadialGradient(w / 2, h / 2, w * 0.05, w / 2, h / 2, w * 0.72)
    glow.addColorStop(0, '#c0161f')
    glow.addColorStop(0.55, '#8a0d14')
    glow.addColorStop(1, '#3d0508')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = BRAND.gold
    ctx.lineWidth = 10
    ctx.strokeRect(34, 34, w - 68, h - 68)
    drawBrandMark(ctx, w / 2, h / 2 + 20, w * 0.84, {
      fill: BRAND.red,
      line: BRAND.gold,
      name: BRAND.cream,
      nameStroke: BRAND.wine,
    })
  })
}

// ── Lona y pañoleta ───────────────────────────────────────────────────────────

/** Lona a rayas rojas y blancas: una raya de cada color por repetición (a lo largo de v). */
export function stripesTexture(): Texture {
  return canvasTexture(
    'lona',
    64,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#c3141f'
      ctx.fillRect(0, 0, w, h / 2)
      ctx.fillStyle = '#f5efe2'
      ctx.fillRect(0, h / 2, w, h / 2)
      // Trama de la lona y costura entre paños.
      for (let y = 0; y < h; y += 2) {
        ctx.fillStyle = `rgba(0,0,0,${0.03 + ((y * 7) % 5) * 0.006})`
        ctx.fillRect(0, y, w, 1)
      }
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(0, h / 2 - 1, w, 2)
      ctx.fillRect(0, 0, w, 1)
    },
    true,
  )
}

/** Faldón festoneado: rayas como la lona, ondas con filete dorado y alpha recortado. */
export function valanceTexture(): Texture {
  return canvasTexture(
    'faldon',
    256,
    128,
    (ctx, w, h) => {
      const wave = h * 0.62
      const scallops = 2
      const r = w / scallops / 2
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(w, 0)
      ctx.lineTo(w, wave)
      for (let i = scallops - 1; i >= 0; i--) ctx.arc(r + 2 * r * i, wave, r, 0, Math.PI, false)
      ctx.closePath()
      ctx.save()
      ctx.clip()
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#c3141f' : '#f5efe2'
        ctx.fillRect((i * w) / 4, 0, w / 4, h)
      }
      ctx.restore()
      ctx.strokeStyle = BRAND.gold
      ctx.lineWidth = 6
      ctx.beginPath()
      for (let i = 0; i < scallops; i++) {
        ctx.moveTo(r + 2 * r * i + r - 4, wave)
        ctx.arc(r + 2 * r * i, wave, r - 4, 0, Math.PI, false)
      }
      ctx.stroke()
      ctx.fillStyle = '#f5efe2'
      ctx.fillRect(0, 0, w, 10)
    },
    true,
  )
}

function flower(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, petal: string) {
  ctx.fillStyle = petal
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    ctx.beginPath()
    ctx.ellipse(
      x + Math.cos(a) * r * 0.55,
      y + Math.sin(a) * r * 0.55,
      r * 0.5,
      r * 0.32,
      a,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  ctx.fillStyle = BRAND.gold
  ctx.beginPath()
  ctx.arc(x, y, r * 0.26, 0, Math.PI * 2)
  ctx.fill()
}

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.fillStyle = BRAND.green
  ctx.beginPath()
  ctx.ellipse(r * 0.6, 0, r * 0.6, r * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Guirnalda pintada a mano a lo largo de un segmento: sarmiento azul, flores y hojas. */
function garland(
  ctx: CanvasRenderingContext2D,
  a: [number, number],
  b: [number, number],
  r: number,
  seed: number,
) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const n = Math.max(2, Math.round(len / (r * 3.2)))
  const [ux, uy] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len]
  const [nx, ny] = [-uy, ux]
  ctx.strokeStyle = BRAND.blue
  ctx.lineWidth = r * 0.12
  ctx.beginPath()
  for (let i = 0; i <= n * 8; i++) {
    const t = i / (n * 8)
    const off = Math.sin(t * n * Math.PI * 2) * r * 0.45
    const x = a[0] + (b[0] - a[0]) * t + nx * off
    const y = a[1] + (b[1] - a[1]) * t + ny * off
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  const petals = [BRAND.red, BRAND.orange, '#c2323c']
  const ang = Math.atan2(uy, ux)
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n
    const side = i % 2 === 0 ? 1 : -1
    const x = a[0] + (b[0] - a[0]) * t
    const y = a[1] + (b[1] - a[1]) * t
    leaf(ctx, x, y, r * 1.1, ang + side * 0.9)
    leaf(ctx, x, y, r * 1.1, ang + Math.PI - side * 0.9)
    flower(ctx, x + nx * side * r * 0.35, y + ny * side * r * 0.35, r, petals[(i + seed) % 3]!)
  }
}

/**
 * Pañoleta de caseta pintada: fondo crema, filetes rojo y verde siguiendo el contorno
 * (banda inferior + frontón), guirnaldas de flores, escudo en el frontón y rótulo en la banda.
 * `bandRatio`: parte de la altura que ocupa la banda.
 */
export function panoletaTexture(label: string, bandRatio: number): Texture {
  return canvasTexture(`panoleta-${label}`, 2048, 832, (ctx, w, h) => {
    const band = h * bandRatio
    const outline = (inset: number) => {
      const k = inset / (w / 2)
      ctx.beginPath()
      ctx.moveTo(inset, h - inset)
      ctx.lineTo(inset, h - band)
      ctx.lineTo(w / 2, inset * (1 + (h - band) / (w / 2)) + k)
      ctx.lineTo(w - inset, h - band)
      ctx.lineTo(w - inset, h - inset)
      ctx.closePath()
    }
    ctx.fillStyle = BRAND.cream
    ctx.fillRect(0, 0, w, h)
    const paper = ctx.createLinearGradient(0, 0, 0, h)
    paper.addColorStop(0, 'rgba(255,250,235,0.6)')
    paper.addColorStop(1, 'rgba(180,150,100,0.14)')
    ctx.fillStyle = paper
    ctx.fillRect(0, 0, w, h)

    ctx.lineJoin = 'round'
    outline(14)
    ctx.strokeStyle = BRAND.red
    ctx.lineWidth = 28
    ctx.stroke()
    outline(40)
    ctx.strokeStyle = BRAND.green
    ctx.lineWidth = 7
    ctx.stroke()
    ctx.fillStyle = BRAND.red
    ctx.fillRect(40, h - band - 6, w - 80, 12)

    // Guirnaldas por los faldones del frontón y a los lados del rótulo.
    const r = 30
    const slope = (h - band) / (w / 2)
    const onEdge = (x: number): [number, number] => [x, h - band - x * slope + 70]
    garland(ctx, onEdge(190), onEdge(w / 2 - 260), r, 0)
    const [mx, my] = onEdge(190)
    garland(ctx, [w / 2 + 260, onEdge(w / 2 - 260)[1]], [w - mx, my], r, 1)
    garland(ctx, [80, h - band / 2], [w * 0.2, h - band / 2], r * 0.8, 2)
    garland(ctx, [w * 0.8, h - band / 2], [w - 80, h - band / 2], r * 0.8, 1)

    drawBrandMark(ctx, w / 2, (h - band) * 0.56, (h - band) * 0.78, {
      fill: BRAND.red,
      line: BRAND.gold,
      name: BRAND.red,
      nameStroke: BRAND.cream,
    })

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = font(SERIF, band * 0.5)
    ctx.lineJoin = 'round'
    ctx.lineWidth = 14
    ctx.strokeStyle = BRAND.wine
    ctx.strokeText(label, w / 2, h - band / 2 + 4)
    ctx.fillStyle = BRAND.red
    ctx.fillText(label, w / 2, h - band / 2 + 4)
  })
}

// ── Azulejo y farolillos ──────────────────────────────────────────────────────

/** Azulejo sevillano: estrella ocre, lazos azules y hojas verdes sobre esmalte blanco. */
export function azulejoTexture(): Texture {
  return canvasTexture(
    'azulejo',
    256,
    256,
    (ctx, w) => {
      const c = w / 2
      ctx.fillStyle = '#f4efe2'
      ctx.fillRect(0, 0, w, w)
      ctx.lineWidth = 14
      ctx.strokeStyle = BRAND.blue
      for (const [x, y] of [
        [0, 0],
        [w, 0],
        [0, w],
        [w, w],
      ] as const) {
        ctx.beginPath()
        ctx.arc(x, y, c * 0.78, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.fillStyle = '#d99a1e'
      ctx.beginPath()
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2
        const r = i % 2 === 0 ? c * 0.55 : c * 0.28
        ctx.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r)
      }
      ctx.closePath()
      ctx.fill()
      for (let i = 0; i < 4; i++) leaf(ctx, c, c, c * 0.62, (i / 4) * Math.PI * 2 + Math.PI / 4)
      ctx.fillStyle = BRAND.blue
      ctx.beginPath()
      ctx.arc(c, c, c * 0.14, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(80,60,40,0.35)'
      ctx.fillRect(0, 0, w, 3)
      ctx.fillRect(0, 0, 3, w)
    },
    true,
  )
}

export type LanternStyle = 'rojo' | 'blanco' | 'naranja'

export const LANTERN_STYLES: LanternStyle[] = ['rojo', 'blanco', 'naranja']

const LANTERN: Record<LanternStyle, [base: string, dot: string]> = {
  rojo: ['#c3141f', '#f7efe0'],
  blanco: ['#f7efe0', '#c3141f'],
  naranja: ['#e56a1f', '#f7efe0'],
}

/** Farolillo de papel: fondo liso con lunares y pliegues verticales (mapeado esférico). */
export function lanternTexture(style: LanternStyle): Texture {
  const [base, dot] = LANTERN[style]
  return canvasTexture(`farolillo-${style}`, 512, 256, (ctx, w, h) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = dot
    const cols = 12
    for (let row = 1; row < 6; row++) {
      for (let col = 0; col < cols; col++) {
        const x = ((col + (row % 2) * 0.5) / cols) * w
        const y = (row / 6) * h
        // Los lunares se estrechan hacia los polos igual que la esfera.
        const squash = Math.sin((row / 6) * Math.PI)
        ctx.beginPath()
        ctx.ellipse(x, y, 11 * squash + 2, 13, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    for (let x = 0; x < w; x++) {
      const pleat = Math.sin((x / w) * Math.PI * 2 * 24)
      ctx.fillStyle =
        pleat > 0 ? `rgba(0,0,0,${pleat * 0.12})` : `rgba(255,255,255,${-pleat * 0.08})`
      ctx.fillRect(x, 0, 1, h)
    }
  })
}

// ── Cartelería ────────────────────────────────────────────────────────────────

/** Código QR ilustrativo (no enlaza a ninguna parte): tres detectores y módulos al azar. */
function fakeQr(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const n = 29
  const m = size / n
  const rand = random(7)
  ctx.fillStyle = '#fff'
  ctx.fillRect(x - m * 2, y - m * 2, size + m * 4, size + m * 4)
  ctx.fillStyle = '#1a1a1a'
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) if (rand() > 0.52) ctx.fillRect(x + i * m, y + j * m, m, m)
  for (const [fx, fy] of [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ] as const) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(x + (fx - 1) * m, y + (fy - 1) * m, m * 9, m * 9)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(x + fx * m, y + fy * m, m * 7, m * 7)
    ctx.fillStyle = '#fff'
    ctx.fillRect(x + (fx + 1) * m, y + (fy + 1) * m, m * 5, m * 5)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(x + (fx + 2) * m, y + (fy + 2) * m, m * 3, m * 3)
  }
}

/** Panel de compra online en la trastienda (proporción 9 : 16). */
export function onlineTexture(): Texture {
  return canvasTexture('online', 576, 1024, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#8a0d14')
    bg.addColorStop(1, '#4a070b')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    drawBrandMark(ctx, w / 2, 200, 330, { fill: BRAND.red, line: BRAND.gold, name: BRAND.cream })
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = BRAND.cream
    ctx.font = font(SERIF, 56)
    ctx.fillText('Llévatelas a casa', w / 2, 440)
    ctx.fillStyle = BRAND.goldLight
    ctx.font = font(SANS, 25)
    ctx.fillText('ESCANEA Y COMPRA ONLINE', w / 2, 490)
    fakeQr(ctx, w / 2 - 150, 540, 300)
    ctx.fillStyle = BRAND.cream
    ctx.font = font(SANS, 24)
    ctx.fillText('AUTHENTIC SPANISH TAPAS', w / 2, 920)
    ctx.fillStyle = BRAND.gold
    ctx.fillRect(w / 2 - 120, 950, 240, 4)
  })
}

/** Rótulo de la despensa (proporción 6 : 1): «La Despensa · Tapas de España». */
export function despensaTexture(): Texture {
  return canvasTexture('despensa', 1536, 256, (ctx, w, h) => {
    ctx.fillStyle = BRAND.deep
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = BRAND.gold
    ctx.lineWidth = 6
    ctx.strokeRect(14, 14, w - 28, h - 28)
    drawLogo(ctx, 140, h / 2, 190, { fill: BRAND.red, line: BRAND.gold })
    drawLogo(ctx, w - 140, h / 2, 190, { fill: BRAND.red, line: BRAND.gold })
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = BRAND.cream
    ctx.font = font(SERIF, 104)
    ctx.fillText('La Despensa', w / 2, h / 2 - 18)
    ctx.fillStyle = BRAND.goldLight
    ctx.font = font(SANS, 30)
    ctx.fillText('TAPAS DE ESPAÑA · READY TO SERVE', w / 2, h / 2 + 68)
  })
}

// ── Etiquetas de producto (réplicas de los envases de la marca) ───────────────

function flagStripe(ctx: CanvasRenderingContext2D, y: number, w: number, thick: number) {
  ctx.fillStyle = '#c60b1e'
  ctx.fillRect(0, y, w, thick)
  ctx.fillStyle = '#ffc400'
  ctx.fillRect(0, y + thick, w, thick * 1.4)
  ctx.fillStyle = '#c60b1e'
  ctx.fillRect(0, y + thick * 2.4, w, thick)
}

function hamSlices(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed = 3,
) {
  const rand = random(seed)
  for (let i = 0; i < 7; i++) {
    const cx = x + w * (0.15 + rand() * 0.7)
    const cy = y + h * (0.2 + rand() * 0.6)
    const rx = w * (0.16 + rand() * 0.08)
    const ry = h * (0.14 + rand() * 0.08)
    const a = rand() * Math.PI
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, rx)
    g.addColorStop(0, '#b3303a')
    g.addColorStop(0.7, '#c9505a')
    g.addColorStop(1, '#e7b3a8')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, a, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#f6ece2'
    ctx.lineWidth = Math.max(3, rx * 0.12)
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx * 0.92, ry * 0.9, a, 0.3, 2.2)
    ctx.stroke()
  }
}

function clearTray(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#e4e8e8'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = w * 0.02
  ctx.strokeRect(w * 0.02, h * 0.02, w * 0.96, h * 0.96)
  ctx.strokeStyle = 'rgba(120,130,130,0.35)'
  ctx.lineWidth = 3
  ctx.strokeRect(w * 0.05, h * 0.04, w * 0.9, h * 0.92)
}

export type PackKind = 'gourmet' | 'serrano' | 'fiesta' | 'rolls'

/** Frente de cada envase: la etiqueta ocupa toda la cara frontal de la caja. */
export function packTexture(kind: PackKind): Texture {
  switch (kind) {
    case 'gourmet':
      // «Tapas Gourmet»: bandeja vertical con cuatro cuñas de queso y faja negra y roja.
      return canvasTexture('pack-gourmet', 512, 1024, (ctx, w, h) => {
        clearTray(ctx, w, h)
        const wedges: [string, string, number][] = [
          ['#f3e9c9', '#c7a15a', 0.46],
          ['#f7f3e6', '#e2dccb', 0.6],
          ['#efe0b3', '#9a7a3c', 0.74],
          ['#f1e7cf', '#4f4a3a', 0.88],
        ]
        wedges.forEach(([paste, rind, t], i) => {
          const y = h * t
          ctx.fillStyle = paste
          ctx.beginPath()
          const [a, b] = i % 2 === 0 ? [0.12, 0.9] : [0.88, 0.1]
          ctx.moveTo(w * a, y - h * 0.075)
          ctx.lineTo(w * b, y)
          ctx.lineTo(w * a, y + h * 0.075)
          ctx.closePath()
          ctx.fill()
          ctx.strokeStyle = rind
          ctx.lineWidth = 12
          ctx.stroke()
        })
        ctx.fillStyle = '#141414'
        ctx.fillRect(w * 0.08, h * 0.08, w * 0.84, h * 0.08)
        ctx.fillStyle = BRAND.red
        ctx.fillRect(w * 0.08, h * 0.16, w * 0.84, h * 0.07)
        ctx.fillStyle = '#f7f3ea'
        ctx.fillRect(w * 0.08, h * 0.23, w * 0.84, h * 0.13)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = BRAND.gold
        ctx.font = font(SERIF, 54)
        ctx.fillText('PIEL DE TORO', w / 2, h * 0.12)
        crown(ctx, w / 2, h * 0.195, 60, BRAND.gold)
        ctx.fillStyle = '#1a1a1a'
        ctx.font = font(SCRIPT, 84)
        ctx.fillText('Tapas Gourmet', w / 2, h * 0.3)
      })
    case 'serrano':
      // «Serrano Ham» 3 oz: mitad superior roja con el escudo, faja con la bandera y lonchas.
      return canvasTexture('pack-serrano', 768, 928, (ctx, w, h) => {
        const red = ctx.createLinearGradient(0, 0, 0, h * 0.55)
        red.addColorStop(0, '#6d0a10')
        red.addColorStop(1, '#b3121f')
        ctx.fillStyle = red
        ctx.fillRect(0, 0, w, h * 0.56)
        drawBrandMark(ctx, w / 2, 140, 250, {
          fill: BRAND.red,
          line: BRAND.gold,
          name: BRAND.goldLight,
        })
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = '#fff'
        ctx.font = font(SERIF, 76)
        ctx.fillText('SERRANO HAM', w / 2, 350)
        ctx.font = font(SANS, 24)
        ctx.fillText('ALL NATURAL · PRODUCT OF SPAIN', w / 2, 395)
        ctx.fillStyle = BRAND.goldLight
        ctx.font = font(SERIF, 30)
        ctx.fillText('Carefully thinly sliced', w / 2, 450)
        flagStripe(ctx, h * 0.55, w, 12)
        ctx.fillStyle = '#f4f4f2'
        ctx.fillRect(0, h * 0.55 + 41, w, h)
        ctx.fillStyle = '#2d2d2d'
        ctx.fillRect(w * 0.3, h * 0.66, w * 0.66, h * 0.3)
        hamSlices(ctx, w * 0.3, h * 0.64, w * 0.66, h * 0.32)
        ctx.fillStyle = '#e6e3de'
        ctx.fillRect(0, h * 0.62, w * 0.27, h * 0.38)
        ctx.fillStyle = '#333'
        ctx.font = font(SANS, 28)
        ctx.fillText('RESERVA', w * 0.135, h * 0.68)
        ctx.font = font(SANS, 70)
        ctx.fillText('12', w * 0.135, h * 0.76)
        ctx.font = font(SANS, 24)
        ctx.fillText('MONTHS', w * 0.135, h * 0.8)
        ctx.font = font(SANS, 54)
        ctx.fillText('3 OZ', w * 0.135, h * 0.9)
      })
    case 'fiesta':
      // «Spanish Tapas Fiesta» 9 oz: serrano, manchego y almendras marcona con faja roja.
      return canvasTexture('pack-fiesta', 1024, 704, (ctx, w, h) => {
        clearTray(ctx, w, h)
        ctx.fillStyle = '#f2ead0'
        ctx.fillRect(w * 0.53, h * 0.07, w * 0.42, h * 0.3)
        hamSlices(ctx, w * 0.06, h * 0.07, w * 0.45, h * 0.86, 5)
        const rand = random(11)
        for (let i = 0; i < 46; i++) {
          const x = w * (0.56 + rand() * 0.37)
          const y = h * (0.66 + rand() * 0.27)
          ctx.fillStyle = rand() > 0.5 ? '#e9d3a4' : '#d9bb82'
          ctx.beginPath()
          ctx.ellipse(x, y, 22, 14, rand() * Math.PI, 0, Math.PI * 2)
          ctx.fill()
        }
        const bandY = h * 0.34
        const bandH = h * 0.3
        const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH)
        band.addColorStop(0, '#9c0f1a')
        band.addColorStop(1, '#6d0a10')
        ctx.fillStyle = band
        ctx.fillRect(w * 0.04, bandY, w * 0.92, bandH)
        flagStripe(ctx, bandY + bandH - 22, w * 0.92, 5)
        drawBrandMark(ctx, w * 0.47, bandY + bandH * 0.5, 190, {
          fill: BRAND.red,
          line: BRAND.gold,
          name: BRAND.goldLight,
        })
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = '#fff'
        ctx.font = font(SERIF, 42)
        ctx.fillText('SPANISH', w * 0.07, bandY + 62)
        ctx.fillText('TAPAS', w * 0.07, bandY + 108)
        ctx.fillText('FIESTA', w * 0.07, bandY + 154)
        ctx.font = font(SERIF, 32)
        ctx.fillStyle = BRAND.goldLight
        ctx.fillText('Serrano Ham', w * 0.62, bandY + 62)
        ctx.fillText('Manchego Cheese', w * 0.62, bandY + 108)
        ctx.fillText('Marcona Almonds', w * 0.62, bandY + 154)
      })
    case 'rolls':
      // «Serrano Ham & Manchego Cheese Rolls»: tres rollitos y etiqueta cuadrada anaranjada.
      return canvasTexture('pack-rolls', 1024, 576, (ctx, w, h) => {
        clearTray(ctx, w, h)
        for (let i = 0; i < 3; i++) {
          const x = w * (0.56 + i * 0.14)
          const g = ctx.createLinearGradient(x - 50, 0, x + 50, 0)
          g.addColorStop(0, '#b8474a')
          g.addColorStop(0.5, '#e38b7c')
          g.addColorStop(1, '#a93c40')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.roundRect(x - 52, h * 0.14, 104, h * 0.72, 40)
          ctx.fill()
          ctx.strokeStyle = 'rgba(255,240,230,0.7)'
          ctx.lineWidth = 5
          ctx.beginPath()
          ctx.moveTo(x - 30, h * 0.2)
          ctx.bezierCurveTo(x + 10, h * 0.4, x - 20, h * 0.6, x + 20, h * 0.8)
          ctx.stroke()
        }
        const label = ctx.createLinearGradient(0, 0, 0, h)
        label.addColorStop(0, '#c0561b')
        label.addColorStop(1, '#8e360f')
        ctx.fillStyle = label
        ctx.beginPath()
        ctx.roundRect(w * 0.05, h * 0.08, w * 0.42, h * 0.84, 24)
        ctx.fill()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = BRAND.goldLight
        ctx.font = font(SERIF, 76)
        ctx.fillText('TAPAS', w * 0.26, h * 0.28)
        ctx.font = font(SANS, 20)
        ctx.fillText('SPANISH · FIESTA', w * 0.26, h * 0.35)
        ctx.fillStyle = '#fff'
        ctx.font = font(SERIF, 29)
        ctx.fillText('Serrano Ham &', w * 0.26, h * 0.47)
        ctx.fillText('Manchego Cheese Rolls', w * 0.26, h * 0.53)
        drawLogo(ctx, w * 0.16, h * 0.72, 150, { fill: BRAND.red, line: BRAND.gold })
        ctx.fillStyle = '#fff'
        ctx.font = font(SANS, 30)
        ctx.fillText('2.31 oz', w * 0.36, h * 0.74)
        flagStripe(ctx, h * 0.84, w * 0.42, 7)
      })
  }
}

/** Etiqueta redonda del queso de cabra al vino: negra, aro dorado y centro granate. */
export function cheeseLabelTexture(): Texture {
  return canvasTexture('queso-cabra', 1024, 1024, (ctx, w) => {
    const c = w / 2
    ctx.fillStyle = '#3a1e2a'
    ctx.fillRect(0, 0, w, w)
    ctx.fillStyle = '#121010'
    ctx.beginPath()
    ctx.arc(c, c, c * 0.94, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = BRAND.gold
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.arc(c, c, c * 0.9, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#8c1024'
    ctx.beginPath()
    ctx.arc(c, c, c * 0.56, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    drawBrandArc(ctx, c, c - c * 0.84, c * 0.72, 118, '#f0c989')
    ctx.fillStyle = '#fff'
    ctx.font = font(SERIF, 46)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    arcText(ctx, 'QUESO DE CABRA AL VINO', c, c, c * 0.42, 1.02)
    drawLogo(ctx, c, c + c * 0.1, c * 0.62, { fill: '#8c1024', line: '#fff' })
  })
}

/** Corteza de queso al vino: pleita en diagonal teñida de morado. */
export function cheeseRindTexture(): Texture {
  return canvasTexture(
    'queso-corteza',
    256,
    64,
    (ctx, w, h) => {
      ctx.fillStyle = '#4a2233'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(20,6,12,0.55)'
      ctx.lineWidth = 3
      for (let x = -h; x < w; x += 8) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + h, h)
        ctx.stroke()
      }
    },
    true,
  )
}

export type FrozenKind = 'paella' | 'tortilla' | 'croquetas'

const FROZEN: Record<FrozenKind, [title: string, sub: string]> = {
  paella: ['Seafood Paella', 'Paella de marisco'],
  tortilla: ['Spanish Omelette', 'Tortilla española'],
  croquetas: ['Ham Croquetas', 'Croquetas de jamón'],
}

/** Tapa de las cajas de tapas congeladas (se ven desde arriba a través del arcón). */
export function frozenTexture(kind: FrozenKind): Texture {
  const [title, sub] = FROZEN[kind]
  return canvasTexture(`congelado-${kind}`, 768, 512, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w, h)
    bg.addColorStop(0, '#b3121f')
    bg.addColorStop(1, '#6d0a10')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    const cx = w * 0.7
    const cy = h * 0.52
    ctx.fillStyle = '#f4f1ea'
    ctx.beginPath()
    ctx.arc(cx, cy, 170, 0, Math.PI * 2)
    ctx.fill()
    if (kind === 'paella') {
      ctx.fillStyle = '#2b2622'
      ctx.beginPath()
      ctx.arc(cx, cy, 160, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#dc931d'
      ctx.beginPath()
      ctx.arc(cx, cy, 145, 0, Math.PI * 2)
      ctx.fill()
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        ctx.strokeStyle = '#e0602f'
        ctx.lineWidth = 18
        ctx.beginPath()
        ctx.arc(cx + Math.cos(a) * 95, cy + Math.sin(a) * 95, 22, a, a + 3.5)
        ctx.stroke()
      }
    } else if (kind === 'tortilla') {
      ctx.fillStyle = '#dca34a'
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, 135, 0.4, Math.PI * 2 - 0.4)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#f2d27d'
      ctx.beginPath()
      ctx.moveTo(cx + 30, cy)
      ctx.arc(cx + 30, cy, 128, -0.35, 0.35)
      ctx.closePath()
      ctx.fill()
    } else {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        ctx.fillStyle = '#b86d27'
        ctx.beginPath()
        ctx.ellipse(cx + Math.cos(a) * 80, cy + Math.sin(a) * 80, 55, 28, a, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    drawBrandMark(ctx, w * 0.2, h * 0.3, 220, {
      fill: BRAND.red,
      line: BRAND.gold,
      name: BRAND.goldLight,
    })
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#fff'
    ctx.font = font(SERIF, 50)
    ctx.fillText(title, 36, h * 0.74)
    ctx.fillStyle = BRAND.goldLight
    ctx.font = font(SERIF, 30)
    ctx.fillText(sub, 36, h * 0.83)
    flagStripe(ctx, h - 44, w, 9)
  })
}
