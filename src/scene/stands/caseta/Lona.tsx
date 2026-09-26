import { useEffect, useMemo } from 'react'
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
} from 'three'
import { panoletaTexture, stripesTexture, valanceTexture } from './textures'

/** Una raya roja y otra blanca por cada medio metro, bajando por el faldón. */
const STRIPE_PERIOD = 0.5
const VALANCE_DROP = 0.3
const EAVE_OVERHANG = 0.06

export interface CasetaModuleProps {
  /** Tramo del módulo a lo ancho (x local del stand). */
  x: readonly [number, number]
  /** Fondo de la lona: de la trasera (z0) al frente (z1). */
  z: readonly [number, number]
  eave: number
  ridge: number
  /** Alto de la banda de la pañoleta bajo el alero. */
  band: number
  /** Rótulo pintado en la banda de la pañoleta. */
  label: string
}

/** Faldón inclinado de lona entre el alero y la cumbrera; v recorre z para repetir las rayas. */
function slopeGeometry(
  xEave: number,
  xRidge: number,
  eave: number,
  ridge: number,
  z0: number,
  z1: number,
) {
  const g = new BufferGeometry()
  g.setAttribute(
    'position',
    new Float32BufferAttribute(
      [xEave, eave, z0, xRidge, ridge, z0, xRidge, ridge, z1, xEave, eave, z1],
      3,
    ),
  )
  const v0 = z0 / STRIPE_PERIOD
  const v1 = z1 / STRIPE_PERIOD
  g.setAttribute('uv', new Float32BufferAttribute([0, v0, 1, v0, 1, v1, 0, v1], 2))
  g.setIndex([0, 1, 2, 0, 2, 3])
  g.computeVertexNormals()
  return g
}

/** Faldón festoneado colgando del alero a lo largo de z. */
function valanceGeometry(x: number, eave: number, z0: number, z1: number) {
  const g = new BufferGeometry()
  const top = eave + 0.01
  const bottom = top - VALANCE_DROP
  g.setAttribute(
    'position',
    new Float32BufferAttribute([x, bottom, z0, x, bottom, z1, x, top, z1, x, top, z0], 3),
  )
  const u0 = z0 / STRIPE_PERIOD
  const u1 = z1 / STRIPE_PERIOD
  g.setAttribute('uv', new Float32BufferAttribute([u0, 0, u1, 0, u1, 1, u0, 1], 2))
  g.setIndex([0, 1, 2, 0, 2, 3])
  g.computeVertexNormals()
  return g
}

/** Pañoleta: banda rectangular bajo el alero y frontón triangular hasta la cumbrera. */
function panoletaGeometry(width: number, bottom: number, eave: number, apex: number) {
  const s = new Shape()
  s.moveTo(-width / 2, bottom)
  s.lineTo(width / 2, bottom)
  s.lineTo(width / 2, eave)
  s.lineTo(0, apex)
  s.lineTo(-width / 2, eave)
  s.closePath()
  const g = new ShapeGeometry(s)
  const pos = g.getAttribute('position')
  const uv = g.getAttribute('uv')
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + width / 2) / width, (pos.getY(i) - bottom) / (apex - bottom))
  }
  uv.needsUpdate = true
  return g
}

/**
 * Módulo de caseta de feria: lona a rayas a dos aguas con la cumbrera de frente a fondo,
 * faldones festoneados en los aleros y pañoleta pintada en los dos testeros.
 */
export function CasetaModule({ x, z, eave, ridge, band, label }: CasetaModuleProps) {
  const [x0, x1] = x
  const [z0, z1] = z
  const cx = (x0 + x1) / 2
  const width = x1 - x0 + 2 * EAVE_OVERHANG
  const apex = ridge + 0.06
  const eaveY = eave - 0.035

  const geo = useMemo(
    () => ({
      left: slopeGeometry(x0 - EAVE_OVERHANG, cx, eaveY, ridge, z0, z1),
      right: slopeGeometry(x1 + EAVE_OVERHANG, cx, eaveY, ridge, z0, z1),
      valanceLeft: valanceGeometry(x0 - EAVE_OVERHANG, eaveY, z0, z1),
      valanceRight: valanceGeometry(x1 + EAVE_OVERHANG, eaveY, z0, z1),
      panoleta: panoletaGeometry(width, eave - band, eave, apex),
    }),
    [x0, x1, cx, z0, z1, eave, eaveY, ridge, band, width, apex],
  )
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])

  const mats = useMemo(() => {
    const stripes = stripesTexture()
    return {
      // La lona deja pasar algo de luz: el emisivo con su propio mapa la aclara por dentro.
      lona: new MeshStandardMaterial({
        map: stripes,
        emissiveMap: stripes,
        emissive: '#ffffff',
        emissiveIntensity: 0.16,
        roughness: 0.85,
        side: DoubleSide,
      }),
      valance: new MeshStandardMaterial({
        map: valanceTexture(),
        alphaTest: 0.5,
        roughness: 0.85,
        side: DoubleSide,
      }),
      panoleta: new MeshStandardMaterial({
        map: panoletaTexture(label, band / (apex - (eave - band))),
        roughness: 0.55,
      }),
    }
  }, [label, band, apex, eave])
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])

  return (
    <group name={`caseta-${label}`}>
      <mesh geometry={geo.left} material={mats.lona} castShadow receiveShadow />
      <mesh geometry={geo.right} material={mats.lona} castShadow receiveShadow />
      <mesh geometry={geo.valanceLeft} material={mats.valance} castShadow />
      <mesh geometry={geo.valanceRight} material={mats.valance} castShadow />
      <mesh
        geometry={geo.panoleta}
        material={mats.panoleta}
        position={[cx, 0, z1 + 0.03]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={geo.panoleta}
        material={mats.panoleta}
        position={[cx, 0, z0 - 0.03]}
        rotation-y={Math.PI}
        castShadow
        receiveShadow
      />
    </group>
  )
}
