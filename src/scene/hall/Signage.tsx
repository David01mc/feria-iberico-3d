import { Text } from '@react-three/drei'
import type { ReactNode } from 'react'
import { center, depth, width } from '../../config/geometry'
import type { Aisle, FairConfig } from '../../config/types'
import { FONT } from '../../materials/assets'
import type { Vec3 } from '../../materials/geometry'

interface BoardProps {
  position: Vec3
  rotationY?: number
  size: [w: number, h: number]
  color: string
  trim?: string
  /** Altura del cordón de la cercha del que cuelga (dibuja los cables). */
  hangTo?: number
  /** Contenido de una cara; se repite en la trasera. */
  face: ReactNode
}

/** Cartel colgante de doble cara con cables de suspensión. */
function HangingBoard({
  position,
  rotationY = 0,
  size: [w, h],
  color,
  trim,
  hangTo,
  face,
}: BoardProps) {
  const cable = hangTo ? hangTo - (position[1] + h / 2) : 0
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh castShadow>
        <boxGeometry args={[w, h, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {trim &&
        [h / 2 - 0.06, -h / 2 + 0.06].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[w, 0.03, 0.065]} />
            <meshStandardMaterial color={trim} roughness={0.35} metalness={0.8} />
          </mesh>
        ))}
      <group position={[0, 0, 0.032]}>{face}</group>
      <group position={[0, 0, -0.032]} rotation-y={Math.PI}>
        {face}
      </group>
      {cable > 0 &&
        [-w / 2 + 0.3, w / 2 - 0.3].map((x) => (
          <mesh key={x} position={[x, h / 2 + cable / 2, 0]}>
            <cylinderGeometry args={[0.008, 0.008, cable, 6]} />
            <meshStandardMaterial color="#8a8d90" metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
    </group>
  )
}

/** Dónde colgar la señal de una calle o pasillo: junto a su cruce con la avenida central. */
function aisleSignPlacements(aisle: Aisle): { position: Vec3; rotationY: number }[] {
  const r = aisle.rect
  const [cx, cz] = center(r)
  const y = 5.2
  if (depth(r) > width(r)) {
    const spots: number[] = []
    if (r.z0 < -2) spots.push(-4)
    if (r.z1 > 2) spots.push(4)
    return spots.map((z) => ({ position: [cx, y, z], rotationY: 0 }))
  }
  if (aisle.name === 'Avenida Central') return []
  return [-10, 10].map((x) => ({ position: [x, y, cz], rotationY: Math.PI / 2 }))
}

/** Identidad de la feria: pancartas, mural del testero, señalética de calles y acceso. */
export function Signage({ fair }: { fair: FairConfig }) {
  const { brand, hall, aisles } = fair
  const { palette } = brand
  const [cx] = center(hall.bounds)

  const bannerFace = (
    <>
      <Text
        font={FONT.display}
        fontSize={0.95}
        color={palette.accent}
        anchorX="center"
        anchorY="middle"
        position={[0, 0.3, 0]}
      >
        {brand.name}
      </Text>
      <Text
        font={FONT.uiBold}
        fontSize={0.28}
        letterSpacing={0.22}
        color={palette.paper}
        anchorX="center"
        anchorY="middle"
        position={[0, -0.62, 0]}
      >
        {`${brand.subtitle} · ${brand.edition}`.toUpperCase()}
      </Text>
    </>
  )

  return (
    <group name="signage">
      {[-20, 20].map((x) => (
        <HangingBoard
          key={x}
          position={[x, 7.4, 0]}
          rotationY={Math.PI / 2}
          size={[7, 2.4]}
          color={palette.primary}
          trim={palette.accent}
          hangTo={hall.trussBottom}
          face={bannerFace}
        />
      ))}

      {aisles.flatMap((aisle) =>
        aisleSignPlacements(aisle).map((spot, i) => (
          <HangingBoard
            key={`${aisle.name}-${i}`}
            position={spot.position}
            rotationY={spot.rotationY}
            size={[2.4, 0.62]}
            color={palette.paper}
            hangTo={hall.trussBottom}
            face={
              <Text
                font={FONT.signage}
                fontSize={0.34}
                letterSpacing={0.08}
                color={palette.primary}
                anchorX="center"
                anchorY="middle"
              >
                {aisle.name.toUpperCase()}
              </Text>
            }
          />
        )),
      )}

      {/* Mural del testero norte. */}
      <group position={[cx, 8.6, hall.bounds.z0 + 0.03]}>
        <mesh>
          <planeGeometry args={[28, 6]} />
          <meshStandardMaterial color={palette.primary} roughness={0.8} />
        </mesh>
        {[2.7, -2.7].map((y) => (
          <mesh key={y} position={[0, y, 0.01]}>
            <planeGeometry args={[26, 0.05]} />
            <meshStandardMaterial color={palette.accent} roughness={0.4} metalness={0.6} />
          </mesh>
        ))}
        <Text
          font={FONT.display}
          fontSize={2.5}
          color={palette.accent}
          anchorX="center"
          anchorY="middle"
          position={[0, 0.55, 0.02]}
        >
          {brand.name}
        </Text>
        <Text
          font={FONT.uiBold}
          fontSize={0.5}
          letterSpacing={0.24}
          color={palette.paper}
          anchorX="center"
          anchorY="middle"
          position={[0, -1.75, 0.02]}
        >
          {`${brand.subtitle} · ${brand.dates} · ${brand.venue}`.toUpperCase()}
        </Text>
      </group>

      {/* Rótulo sobre el acceso principal (muro sur, mirando al interior). */}
      <group position={[cx, 5.5, hall.bounds.z1 - 0.05]} rotation-y={Math.PI}>
        <mesh>
          <planeGeometry args={[7, 0.8]} />
          <meshStandardMaterial color={palette.primary} roughness={0.8} />
        </mesh>
        <Text
          font={FONT.uiBold}
          fontSize={0.34}
          letterSpacing={0.3}
          color={palette.paper}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.01]}
        >
          ACCESO PRINCIPAL
        </Text>
      </group>
    </group>
  )
}
