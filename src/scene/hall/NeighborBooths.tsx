import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { center, depth, outward, SIDES, sideSegment, width } from '../../config/geometry'
import type { NeighborPlot, Side } from '../../config/types'
import { FONT } from '../../materials/assets'
import { mergeBoxes, type BoxPart, type Vec3 } from '../../materials/geometry'
import { PBR, usePbr } from '../../materials/pbr'

const PANEL_H = 2.5
const PANEL_T = 0.04
const FASCIA_H = 0.3

const OPPOSITE: Record<Side, Side> = { north: 'south', south: 'north', east: 'west', west: 'east' }

interface Label {
  key: string
  text: string
  position: Vec3
  rotationY: number
}

/** Genera la geometría de todos los stands modulares (paneles, perfilería, moquetas, rótulos). */
function buildBooths(neighbors: NeighborPlot[]) {
  const floors: BoxPart[] = []
  const panels: BoxPart[] = []
  const aluminium: BoxPart[] = []
  const accents: BoxPart[] = []
  const labels: Label[] = []

  for (const n of neighbors) {
    const { plot } = n
    const [cx, cz] = center(plot)
    floors.push({
      size: [width(plot) - 0.03, 0.025, depth(plot) - 0.03],
      position: [cx, 0.0125, cz],
      color: n.carpet,
    })

    // Perfiles verticales en las cuatro esquinas.
    for (const x of [plot.x0 + 0.03, plot.x1 - 0.03]) {
      for (const z of [plot.z0 + 0.03, plot.z1 - 0.03]) {
        aluminium.push({
          size: [0.05, PANEL_H + FASCIA_H, 0.05],
          position: [x, (PANEL_H + FASCIA_H) / 2, z],
        })
      }
    }

    for (const side of SIDES) {
      if (n.openSides.includes(side)) {
        const seg = sideSegment(plot, side, 0.03)
        panels.push({
          size: [seg.length - 0.06, FASCIA_H, 0.03],
          position: [seg.center[0], PANEL_H + FASCIA_H / 2, seg.center[1]],
          rotationY: seg.rotationY,
        })
        continue
      }
      const seg = sideSegment(plot, side, PANEL_T / 2 + 0.01)
      panels.push({
        size: [seg.length - 0.06, PANEL_H, PANEL_T],
        position: [seg.center[0], PANEL_H / 2, seg.center[1]],
        rotationY: seg.rotationY,
      })
      aluminium.push({
        size: [seg.length, 0.05, 0.06],
        position: [seg.center[0], PANEL_H, seg.center[1]],
        rotationY: seg.rotationY,
      })
      // Perfiles intermedios cada metro (módulos del sistema).
      const modules = Math.max(1, Math.round(seg.length))
      const along: [number, number] = side === 'north' || side === 'south' ? [1, 0] : [0, 1]
      for (let i = 1; i < modules; i++) {
        const offset = -seg.length / 2 + (i * seg.length) / modules
        aluminium.push({
          size: [0.04, PANEL_H, 0.06],
          position: [
            seg.center[0] + along[0] * offset,
            PANEL_H / 2,
            seg.center[1] + along[1] * offset,
          ],
        })
      }
    }

    const front = n.openSides[0]
    if (!front) continue
    const [ox, oz] = outward(front)

    // Mostrador con banda gráfica del expositor.
    const counter = sideSegment(plot, front, 0.65)
    panels.push({
      size: [1.0, 1.0, 0.5],
      position: [counter.center[0], 0.525, counter.center[1]],
      rotationY: counter.rotationY,
    })
    accents.push({
      size: [1.04, 0.035, 0.54],
      position: [counter.center[0], 1.04, counter.center[1]],
      rotationY: counter.rotationY,
      color: '#2d2d2d',
    })
    accents.push({
      size: [0.9, 0.22, 0.01],
      position: [counter.center[0] + ox * 0.256, 0.8, counter.center[1] + oz * 0.256],
      rotationY: counter.rotationY,
      color: n.accent,
    })

    // Gráfica trasera si el fondo está cerrado.
    const back = OPPOSITE[front]
    if (!n.openSides.includes(back)) {
      const wall = sideSegment(plot, back, PANEL_T + 0.02)
      accents.push({
        size: [Math.min(wall.length - 0.8, 2.4), 1.1, 0.01],
        position: [wall.center[0], 1.55, wall.center[1]],
        rotationY: wall.rotationY,
        color: n.accent,
      })
    }

    const fascia = sideSegment(plot, front, 0.005)
    labels.push({
      key: n.code,
      text: `${n.code}  ·  ${n.sector.toUpperCase()}`,
      position: [fascia.center[0], PANEL_H + FASCIA_H / 2, fascia.center[1]],
      rotationY: fascia.rotationY,
    })
  }

  return {
    floors: mergeBoxes(floors, PBR.carpet.tile),
    panels: mergeBoxes(panels),
    aluminium: mergeBoxes(aluminium),
    accents: mergeBoxes(accents),
    labels,
  }
}

/** Stands modulares de otros expositores: dan escala y contexto sin competir con los protagonistas. */
export function NeighborBooths({ neighbors }: { neighbors: NeighborPlot[] }) {
  const carpet = usePbr(PBR.carpet, { color: false })
  const booths = useMemo(() => buildBooths(neighbors), [neighbors])

  return (
    <group name="neighbor-booths">
      <mesh geometry={booths.floors} receiveShadow>
        <meshStandardMaterial {...carpet} vertexColors roughness={1} envMapIntensity={0.3} />
      </mesh>
      <mesh geometry={booths.panels} castShadow receiveShadow>
        <meshStandardMaterial vertexColors color="#dcdad5" roughness={0.45} />
      </mesh>
      <mesh geometry={booths.aluminium} castShadow>
        <meshStandardMaterial vertexColors color="#c9cdd2" roughness={0.32} metalness={0.9} />
      </mesh>
      <mesh geometry={booths.accents} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.55} />
      </mesh>
      {booths.labels.map((label) => (
        <Text
          key={label.key}
          font={FONT.signage}
          fontSize={0.15}
          letterSpacing={0.06}
          color="#2b2b2b"
          anchorX="center"
          anchorY="middle"
          position={label.position}
          rotation-y={label.rotationY}
        >
          {label.text}
        </Text>
      ))}
    </group>
  )
}
