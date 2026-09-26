import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

/** Albedo neutro: el color de cada variedad se aplica después en las instancias 3D. */
const size = 256
const pixels = Buffer.alloc(size * size * 3)

function noise(x, y) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return value - Math.floor(value)
}

for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const u = (x * Math.PI * 2) / size
    const v = (y * Math.PI * 2) / size
    const mottling = 0.035 * Math.sin(4 * u + 2 * Math.sin(v)) * Math.cos(3 * v)
    const pores = noise(x, y) > 0.985 ? -0.13 : 0
    const grain = (noise(x * 3 + 7, y * 3 + 11) - 0.5) * 0.065
    const shade = 0.97 + mottling + pores + grain
    const i = (y * size + x) * 3
    pixels[i] = Math.round(238 * shade)
    pixels[i + 1] = Math.round(235 * shade)
    pixels[i + 2] = Math.round(211 * shade)
  }
}

const directory = join('public', 'assets', 'textures', 'olives')
await mkdir(directory, { recursive: true })
await sharp(pixels, { raw: { width: size, height: size, channels: 3 } })
  .webp({ quality: 88, effort: 6 })
  .toFile(join(directory, 'skin.webp'))
