import { useEffect, useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import type { Vec2 } from '../../camera/collision'
import { useAppStore } from '../../state/store'

const DASH_LENGTH = 0.52
const DASH_GAP = 0.25
const DASH_WIDTH = 0.14
const ARROW_SPACING = 2.6

function makeGeometry(vertices: number[]) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  return geometry
}

function addTriangle(vertices: number[], a: Vec2, b: Vec2, c: Vec2, y: number) {
  vertices.push(a[0], y, a[1], b[0], y, b[1], c[0], y, c[1])
}

/** Franjas y flechas ligeras que siguen los tramos rectos del camino calculado. */
function makeRouteGeometry(route: Vec2[]) {
  const dashes: number[] = []
  const arrows: number[] = []
  let traveled = 0
  let nextArrow = ARROW_SPACING

  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]!
    const b = route[i]!
    const length = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (length < 0.01) continue
    const dx = (b[0] - a[0]) / length
    const dz = (b[1] - a[1]) / length
    const nx = -dz
    const nz = dx
    const at = (distance: number, offset = 0): Vec2 => [
      a[0] + dx * distance + nx * offset,
      a[1] + dz * distance + nz * offset,
    ]

    // El primer trazo empieza delante de los pies; cada fragmento queda sobre la moqueta.
    for (let start = i === 1 ? 0.45 : 0; start < length; start += DASH_LENGTH + DASH_GAP) {
      const end = Math.min(start + DASH_LENGTH, length)
      if (end - start < 0.09) continue
      const leftA = at(start, DASH_WIDTH / 2)
      const rightA = at(start, -DASH_WIDTH / 2)
      const leftB = at(end, DASH_WIDTH / 2)
      const rightB = at(end, -DASH_WIDTH / 2)
      addTriangle(dashes, leftA, rightA, leftB, 0.025)
      addTriangle(dashes, rightA, rightB, leftB, 0.025)
    }

    while (nextArrow < traveled + length - 0.3) {
      const along = nextArrow - traveled
      const tip = at(along + 0.3)
      const left = at(along - 0.22, 0.25)
      const right = at(along - 0.22, -0.25)
      addTriangle(arrows, tip, left, right, 0.031)
      nextArrow += ARROW_SPACING
    }
    traveled += length
  }

  return { dashes: makeGeometry(dashes), arrows: makeGeometry(arrows) }
}

/** Ruta visible en el pavimento, a distinta altura de la moqueta para evitar parpadeos. */
export function FloorRoute() {
  const route = useAppStore((state) => state.navigationRoute)
  const geometry = useMemo(() => makeRouteGeometry(route), [route])
  useEffect(
    () => () => {
      geometry.dashes.dispose()
      geometry.arrows.dispose()
    },
    [geometry],
  )

  if (route.length < 2) return null
  const goal = route[route.length - 1]!
  return (
    <group name="navigation-route">
      <mesh geometry={geometry.dashes} renderOrder={5}>
        <meshBasicMaterial
          color="#f4c65f"
          transparent
          opacity={0.9}
          depthWrite={false}
          toneMapped={false}
          side={2}
        />
      </mesh>
      <mesh geometry={geometry.arrows} renderOrder={6}>
        <meshBasicMaterial
          color="#fff2bd"
          transparent
          opacity={0.96}
          depthWrite={false}
          toneMapped={false}
          side={2}
        />
      </mesh>
      <mesh position={[goal[0], 0.03, goal[1]]} rotation-x={-Math.PI / 2} renderOrder={7}>
        <ringGeometry args={[0.22, 0.31, 28]} />
        <meshBasicMaterial
          color="#fff2bd"
          transparent
          opacity={0.95}
          depthWrite={false}
          toneMapped={false}
          side={2}
        />
      </mesh>
    </group>
  )
}
