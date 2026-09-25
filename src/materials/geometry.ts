import {
  BoxGeometry,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/*
 * Geometría con UV "de mundo": 1 unidad de UV = `tile` metros. Así una misma textura
 * (repeat = 1, compartida y cacheada) se ve a escala real en piezas de cualquier tamaño.
 */

export type Vec3 = [number, number, number]

/**
 * Recalcula las UV por proyección en caja: cada vértice se proyecta desde el eje dominante
 * de su normal. Sirve para cualquier malla (incluidos los modelos de Blender), en metros / tile.
 */
export function boxProjectUV<T extends BufferGeometry>(geometry: T, tile = 1): T {
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals()
  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  const uv = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i++) {
    const ax = Math.abs(normal.getX(i))
    const ay = Math.abs(normal.getY(i))
    const az = Math.abs(normal.getZ(i))
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    let u: number
    let v: number
    if (ax >= ay && ax >= az) {
      u = normal.getX(i) > 0 ? -z : z
      v = y
    } else if (ay >= az) {
      u = x
      v = normal.getY(i) > 0 ? -z : z
    } else {
      u = normal.getZ(i) > 0 ? x : -x
      v = y
    }
    uv[i * 2] = u / tile
    uv[i * 2 + 1] = v / tile
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  return geometry
}

/** Caja con cantos redondeados (atrapan la luz como un mueble real) y UV en metros / tile. */
export function worldRoundedBox(
  w: number,
  h: number,
  d: number,
  radius: number,
  tile = 1,
): BufferGeometry {
  const r = Math.min(radius, w / 2, h / 2, d / 2)
  return boxProjectUV(new RoundedBoxGeometry(w, h, d, 3, r), tile)
}

/** Caja con UV en metros / tile en cada cara. */
export function worldBox(w: number, h: number, d: number, tile = 1): BoxGeometry {
  const geometry = new BoxGeometry(w, h, d)
  const uv = geometry.getAttribute('uv')
  // Orden de caras de BoxGeometry: +x, −x, +y, −y, +z, −z (4 vértices cada una).
  const faceSize: [number, number][] = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ]
  faceSize.forEach(([su, sv], face) => {
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v
      uv.setXY(i, (uv.getX(i) * su) / tile, (uv.getY(i) * sv) / tile)
    }
  })
  uv.needsUpdate = true
  return geometry
}

/** Plano (en XY) con UV en metros / tile. */
export function worldPlane(w: number, h: number, tile = 1): PlaneGeometry {
  const geometry = new PlaneGeometry(w, h)
  const uv = geometry.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * h) / tile)
  uv.needsUpdate = true
  return geometry
}

export interface BoxPart {
  size: Vec3
  position: Vec3
  rotationY?: number
  color?: string
}

/** Une muchas cajas estáticas en una sola geometría (1 draw call) con color por vértice. */
export function mergeBoxes(parts: BoxPart[], tile = 1): BufferGeometry {
  if (parts.length === 0) return new BufferGeometry()
  const color = new Color()
  const matrix = new Matrix4()
  const pieces = parts.map((part) => {
    const geometry = worldBox(...part.size, tile)
    matrix.makeRotationY(part.rotationY ?? 0).setPosition(...part.position)
    geometry.applyMatrix4(matrix)
    color.set(part.color ?? '#ffffff')
    const count = geometry.getAttribute('position').count
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) colors.set([color.r, color.g, color.b], i * 3)
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    return geometry
  })
  const merged = mergeGeometries(pieces, false)
  pieces.forEach((g) => g.dispose())
  if (!merged) throw new Error('mergeBoxes: no se pudieron unir las geometrías')
  return merged
}

const UP = new Vector3(0, 1, 0)

/** Matriz que convierte un cubo unitario (centrado) en una barra de sección cuadrada entre a y b. */
export function beamMatrix(
  a: Vector3,
  b: Vector3,
  thickness: number,
  target = new Matrix4(),
): Matrix4 {
  const dir = new Vector3().subVectors(b, a)
  const length = dir.length()
  const rotation = new Quaternion().setFromUnitVectors(UP, dir.normalize())
  const middle = new Vector3().addVectors(a, b).multiplyScalar(0.5)
  return target.compose(middle, rotation, new Vector3(thickness, length, thickness))
}
