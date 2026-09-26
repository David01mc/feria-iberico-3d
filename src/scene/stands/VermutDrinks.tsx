import { Text } from '@react-three/drei'
import { FONT } from '../../materials/assets'
import { useMaterials, useTintedMaterial } from '../../materials/library'

type Position = [number, number, number]

/** Botella de vermut con vidrio coloreado, etiqueta de papel y tapón. */
export function VermutBottle({
  position,
  blanco = false,
  label = false,
}: {
  position: Position
  blanco?: boolean
  label?: boolean
}) {
  const materials = useMaterials()
  const bottle = useTintedMaterial('wine', blanco ? '#a7833c' : '#3c241c')
  return (
    <group position={position}>
      <mesh position={[0, 0.16, 0]} material={bottle} castShadow>
        <cylinderGeometry args={[0.052, 0.055, 0.31, 14]} />
      </mesh>
      <mesh position={[0, 0.345, 0]} material={bottle} castShadow>
        <cylinderGeometry args={[0.021, 0.037, 0.08, 14]} />
      </mesh>
      <mesh position={[0, 0.397, 0]} material={materials.steelBlack} castShadow>
        <cylinderGeometry args={[0.024, 0.024, 0.04, 14]} />
      </mesh>
      <mesh position={[0, 0.175, 0.053]} material={materials.linen}>
        <boxGeometry args={[0.084, 0.12, 0.008]} />
      </mesh>
      {label && (
        <Text
          font={FONT.uiBold}
          fontSize={0.019}
          color="#253140"
          anchorX="center"
          anchorY="middle"
          position={[0, 0.175, 0.061]}
        >
          VERMUT
        </Text>
      )}
    </group>
  )
}

/** Vaso bajo de vermut rojo con hielo, media rodaja de naranja y aceituna. */
export function VermutGlass({ position }: { position: Position }) {
  const materials = useMaterials()
  const orange = useTintedMaterial('ceramicWhite', '#e47d20')
  const olive = useTintedMaterial('oil', '#879938')
  return (
    <group position={position}>
      <mesh position={[0, 0.076, 0]} material={materials.wine}>
        <cylinderGeometry args={[0.061, 0.052, 0.105, 18]} />
      </mesh>
      <mesh position={[0, 0.085, 0]} material={materials.glass}>
        <cylinderGeometry args={[0.071, 0.062, 0.17, 18]} />
      </mesh>
      <mesh position={[0.028, 0.14, 0.005]} rotation={[0.2, 0, 0.55]} material={orange}>
        <cylinderGeometry args={[0.055, 0.055, 0.012, 16, 1, false, 0, Math.PI]} />
      </mesh>
      <mesh position={[-0.025, 0.165, 0.01]} material={olive}>
        <sphereGeometry args={[0.014, 8, 6]} />
      </mesh>
    </group>
  )
}

const OLIVES = [
  [-0.09, -0.05],
  [-0.04, -0.08],
  [0.02, -0.07],
  [0.08, -0.04],
  [-0.11, 0.01],
  [-0.06, 0.02],
  [0, 0],
  [0.06, 0.02],
  [0.12, 0.02],
  [-0.07, 0.08],
  [-0.01, 0.07],
  [0.05, 0.08],
] as const

/** Aperitivo servido junto a los vasos, como en la referencia. */
export function OliveDish({ position }: { position: Position }) {
  const materials = useMaterials()
  const olive = useTintedMaterial('oil', '#829344')
  return (
    <group position={position}>
      <mesh position={[0, 0.012, 0]} material={materials.steelBrushed} castShadow>
        <cylinderGeometry args={[0.18, 0.17, 0.024, 22]} />
      </mesh>
      {OLIVES.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.038 + (i % 3) * 0.004, z]} material={olive} castShadow>
          <sphereGeometry args={[0.027, 9, 7]} />
        </mesh>
      ))}
    </group>
  )
}
