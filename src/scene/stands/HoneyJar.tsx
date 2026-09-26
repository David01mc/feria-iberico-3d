import { Text } from '@react-three/drei'
import { FONT } from '../../materials/assets'
import { useMaterials, useTintedMaterial } from '../../materials/library'

type Position = [number, number, number]

const HONEY_COLORS = ['#b77124', '#8b4c1c', '#d59b32'] as const

/** Tarro de miel con tapa metálica y etiqueta de papel; la base del grupo queda en el apoyo. */
export function HoneyJar({
  position,
  variety = 0,
  large = false,
  named = false,
}: {
  position: Position
  variety?: number
  large?: boolean
  named?: boolean
}) {
  const materials = useMaterials()
  const honey = useTintedMaterial('oil', HONEY_COLORS[variety % HONEY_COLORS.length]!)
  const lid = useTintedMaterial('aluminium', '#bd8a38')
  return (
    <group position={position} scale={large ? 1.25 : 1}>
      <mesh position={[0, 0.105, 0]} material={honey} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.21, 16]} />
      </mesh>
      <mesh position={[0, 0.221, 0]} material={lid} castShadow>
        <cylinderGeometry args={[0.081, 0.081, 0.025, 16]} />
      </mesh>
      <mesh position={[0, 0.115, 0.075]} material={materials.linen}>
        <boxGeometry args={[0.115, 0.095, 0.008]} />
      </mesh>
      {named && (
        <Text
          font={FONT.uiBold}
          fontSize={0.018}
          color="#59330e"
          anchorX="center"
          anchorY="middle"
          position={[0, 0.12, 0.081]}
        >
          MIEL
        </Text>
      )}
    </group>
  )
}
