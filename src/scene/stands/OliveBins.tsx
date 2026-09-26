import { useTexture } from '@react-three/drei'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  Color,
  MeshPhysicalMaterial,
  Object3D,
  SphereGeometry,
  SRGBColorSpace,
  type InstancedMesh,
} from 'three'
import { ACEITUNAS } from '../../config/layouts'
import { asset } from '../../materials/assets'
import { Block } from '../props/Block'

const A = ACEITUNAS
const TRAY_WIDTH = 0.8
const TRAY_DEPTH = 0.4
const TRAY_HEIGHT = 0.1
const COLUMNS = 12
const ROWS = 4
const LAYERS = 2
const PER_TRAY = COLUMNS * ROWS * LAYERS

const VARIETIES = [
  { name: 'Manzanilla', colors: ['#788b37', '#a2a74a', '#5d762d'] },
  { name: 'Gordal', colors: ['#b5b850', '#9da943', '#c6bd68'] },
  { name: 'Arbequina', colors: ['#7b8132', '#9b9d39', '#606d2b'] },
  { name: 'Aloreña', colors: ['#a6a84a', '#788a3a', '#b9ae51'] },
  { name: 'Limón y ajo', colors: ['#bac564', '#9cae4b', '#d2ca73'] },
  { name: 'Kalamata', colors: ['#372b3d', '#574056', '#302934'] },
  { name: 'Negras', colors: ['#242830', '#36323a', '#4a3842'] },
  { name: 'Aliñadas', colors: ['#8c7135', '#a7903e', '#69723b'] },
  { name: 'Picantes', colors: ['#8d462b', '#a96031', '#81752e'] },
  { name: 'Banderillas', colors: ['#a5a14a', '#c28236', '#797c39'] },
] as const

const trays = VARIETIES.map((variety, i) => ({
  ...variety,
  x: A.display.center[0] + ((i % 5) - 2) * 0.88,
  z: A.display.center[1] + (i < 5 ? -0.26 : 0.26),
}))

const hash = (n: number) => {
  const value = Math.sin(n * 127.1 + 47.3) * 43758.5453
  return value - Math.floor(value)
}

/** Diez cubetas llenas; todas las aceitunas comparten una sola geometría y una textura WebP. */
export function OliveBins() {
  const ref = useRef<InstancedMesh>(null)
  const texture = useTexture(asset('textures/olives/skin.webp'))
  texture.colorSpace = SRGBColorSpace
  const geometry = useMemo(() => new SphereGeometry(1, 9, 7), [])
  const material = useMemo(
    () =>
      new MeshPhysicalMaterial({
        map: texture,
        roughness: 0.32,
        clearcoat: 0.55,
        clearcoatRoughness: 0.23,
      }),
    [texture],
  )
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const olive = new Object3D()
    const color = new Color()
    let index = 0
    for (const [trayIndex, tray] of trays.entries()) {
      for (let layer = 0; layer < LAYERS; layer++) {
        for (let row = 0; row < ROWS; row++) {
          for (let col = 0; col < COLUMNS; col++) {
            const seed = trayIndex * PER_TRAY + layer * COLUMNS * ROWS + row * COLUMNS + col
            olive.position.set(
              tray.x + (col - (COLUMNS - 1) / 2) * 0.057 + (hash(seed + 1) - 0.5) * 0.018,
              A.floor + A.display.bodyHeight + 0.12 + layer * 0.033 + hash(seed + 2) * 0.008,
              tray.z + (row - (ROWS - 1) / 2) * 0.07 + (hash(seed + 3) - 0.5) * 0.019,
            )
            olive.rotation.set(hash(seed + 4) * 0.7, hash(seed + 5) * Math.PI, hash(seed + 6) * 0.4)
            olive.scale.set(0.027 + hash(seed + 7) * 0.006, 0.024 + hash(seed + 8) * 0.005, 0.023)
            olive.updateMatrix()
            mesh.setMatrixAt(index, olive.matrix)
            color
              .set(tray.colors[seed % tray.colors.length]!)
              .offsetHSL(0, 0, (hash(seed + 9) - 0.5) * 0.04)
            mesh.setColorAt(index, color)
            index++
          }
        }
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [])

  const trayY = A.floor + A.display.bodyHeight + TRAY_HEIGHT / 2
  return (
    <group>
      {trays.map((tray) => (
        <group key={tray.name} position={[tray.x, trayY, tray.z]}>
          <Block size={[TRAY_WIDTH, TRAY_HEIGHT, TRAY_DEPTH]} material="steelBlack" />
          {[-1, 1].map((s) => (
            <Block
              key={`borde-x-${s}`}
              size={[TRAY_WIDTH, 0.035, 0.025]}
              position={[0, TRAY_HEIGHT / 2 + 0.012, s * (TRAY_DEPTH / 2 - 0.012)]}
              material="steelBrushed"
            />
          ))}
        </group>
      ))}
      <instancedMesh
        ref={ref}
        args={[geometry, material, trays.length * PER_TRAY]}
        castShadow
        receiveShadow
      />
    </group>
  )
}
