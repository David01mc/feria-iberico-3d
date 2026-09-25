import { CanvasTexture, NoColorSpace, RepeatWrapping, type Texture } from 'three'

/*
 * Texturas generadas en el navegador (sin descarga). Se crean una sola vez y se comparten.
 */

const cache = new Map<string, Texture>()

function cached(key: string, build: () => Texture): Texture {
  let texture = cache.get(key)
  if (!texture) {
    texture = build()
    cache.set(key, texture)
  }
  return texture
}

/**
 * Relieve de chapa grecada (panel sándwich): `ribs` grecas trapezoidales por repetición.
 * Se usa como bumpMap; las grecas quedan verticales con UV de mundo.
 */
export function ribbedPanelBump(ribs = 4): Texture {
  return cached(`ribbed-${ribs}`, () => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = 4
    const ctx = canvas.getContext('2d')!
    const period = size / ribs
    for (let x = 0; x < size; x++) {
      const t = (x % period) / period
      // Trapecio: meseta alta 35 %, rampa 15 %, valle 35 %, rampa 15 %.
      let h: number
      if (t < 0.35) h = 1
      else if (t < 0.5) h = 1 - (t - 0.35) / 0.15
      else if (t < 0.85) h = 0
      else h = (t - 0.85) / 0.15
      const v = Math.round(60 + h * 160)
      ctx.fillStyle = `rgb(${v},${v},${v})`
      ctx.fillRect(x, 0, 1, canvas.height)
    }
    const texture = new CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.colorSpace = NoColorSpace
    return texture
  })
}
