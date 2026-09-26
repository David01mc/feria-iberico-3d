import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  CanvasTexture,
  Color,
  DoubleSide,
  Object3D,
  SRGBColorSpace,
  type InstancedMesh,
} from 'three'
import { useTintedMaterial } from '../../materials/library'
import { Block } from '../props/Block'

const COLUMNS = 26
const ROWS = 17
const COUNT = COLUMNS * ROWS
const GREENS = ['#416e3c', '#568348', '#6d9652', '#375f3d', '#829f5d', '#4e7950']

/** Silueta, nervaduras y moteado suave compartidos por todas las hojas. */
function leafTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 192
  const ctx = canvas.getContext('2d')!
  const shape = () => {
    ctx.beginPath()
    ctx.moveTo(64, 180)
    ctx.bezierCurveTo(25, 152, 13, 83, 64, 9)
    ctx.bezierCurveTo(113, 80, 104, 150, 64, 180)
    ctx.closePath()
  }

  const fill = ctx.createLinearGradient(12, 96, 115, 96)
  fill.addColorStop(0, '#b1c59a')
  fill.addColorStop(0.48, '#f4f7db')
  fill.addColorStop(1, '#b9cda2')
  shape()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.save()
  shape()
  ctx.clip()
  for (let i = 0; i < 95; i++) {
    const x = (Math.sin(i * 71.7) * 43758.5) % 1
    const y = (Math.sin(i * 29.3) * 19642.7) % 1
    ctx.fillStyle = i % 3 === 0 ? 'rgba(48,75,40,0.10)' : 'rgba(255,255,236,0.13)'
    ctx.fillRect(Math.abs(x) * 128, Math.abs(y) * 192, 2 + (i % 3), 3 + (i % 4))
  }
  ctx.strokeStyle = 'rgba(46,78,42,0.36)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(64, 177)
  ctx.quadraticCurveTo(61, 90, 64, 18)
  ctx.stroke()
  ctx.lineWidth = 1.2
  for (let y = 47; y < 161; y += 23) {
    const reach = 31 * Math.sin((Math.PI * (y - 9)) / 171)
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(63, y + 10)
      ctx.quadraticCurveTo(64 + side * reach * 0.6, y - 3, 64 + side * reach, y - 9)
      ctx.stroke()
    }
  }
  ctx.restore()

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/** Jardín vertical de hojas pequeñas y texturizadas en una sola llamada de dibujo. */
export function MossPanel({
  width,
  height,
  position,
}: {
  width: number
  height: number
  position: [number, number, number]
}) {
  const ref = useRef<InstancedMesh>(null)
  const back = useTintedMaterial('chalkboard', '#23452d')
  const texture = useMemo(() => leafTexture(), [])
  useEffect(() => () => texture.dispose(), [texture])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const leaf = new Object3D()
    const color = new Color()
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLUMNS; col++) {
        const i = row * COLUMNS + col
        const variation = Math.abs(Math.sin(i * 73.79 + 12.43) * 43758.5453) % 1
        const vertical = Math.abs(Math.sin(i * 19.17 + 4.83) * 19642.773) % 1
        leaf.position.set(
          -width / 2 + ((col + 0.5 + (variation - 0.5) * 0.45) * width) / COLUMNS,
          -height / 2 + ((row + 0.5 + (vertical - 0.5) * 0.45) * height) / ROWS,
          0.05 + variation * 0.035,
        )
        leaf.rotation.set(
          (vertical - 0.5) * 0.65,
          (variation - 0.5) * 0.75,
          (variation - 0.5) * 1.9,
        )
        leaf.scale.set(0.085 + variation * 0.045, 0.13 + vertical * 0.055, 1)
        leaf.updateMatrix()
        mesh.setMatrixAt(i, leaf.matrix)
        mesh.setColorAt(i, color.set(GREENS[i % GREENS.length]!))
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [width, height])

  return (
    <group position={position}>
      <Block size={[width + 0.12, height + 0.12, 0.07]} material="darkWood" />
      <Block size={[width, height, 0.075]} position={[0, 0, 0.044]} material={back} />
      <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} position={[0, 0, 0.09]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          map={texture}
          color="#ffffff"
          side={DoubleSide}
          alphaTest={0.15}
          roughness={0.9}
        />
      </instancedMesh>
    </group>
  )
}
