import { useEffect, useMemo } from 'react'
import { Matrix4, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from 'three'
import type { Vec3 } from '../../materials/geometry'
import { useMaterials } from '../../materials/library'

export interface SpotlightProps {
  /** Punto de giro del proyector (bajo el carril o el truss). */
  position: Vec3
  /** Hacia dónde apunta. */
  target: Vec3
  /** Luz cálida de 3000 K por defecto: favorece la comida. */
  color?: string
  /** Intensidad en candelas. */
  intensity?: number
  angle?: number
  penumbra?: number
  distance?: number
  castShadow?: boolean
  /**
   * `false` dibuja solo el aparato con la lente encendida. Cada luz real encarece el
   * sombreado de toda la escena, así que se reservan para los acentos importantes.
   */
  light?: boolean
}

const UP = new Vector3(0, 1, 0)

/** Proyector LED de carril orientable, con luz focal real opcional. */
export function Spotlight({
  position,
  target,
  color = '#ffd9a8',
  intensity = 40,
  angle = 0.42,
  penumbra = 0.6,
  distance = 9,
  castShadow = false,
  light = true,
}: SpotlightProps) {
  const library = useMaterials()
  const [px, py, pz] = position
  const [tx, ty, tz] = target

  const { quaternion, targetObject } = useMemo(() => {
    const eye = new Vector3(px, py, pz)
    const aim = new Vector3(tx, ty, tz)
    // Matrix4.lookAt orienta −z hacia el objetivo; el aparato se modela mirando a −z.
    const q = new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(eye, aim, UP))
    const obj = new Object3D()
    obj.position.copy(aim)
    return { quaternion: q, targetObject: obj }
  }, [px, py, pz, tx, ty, tz])

  const lens = useMemo(
    () => new MeshStandardMaterial({ color: '#000000', emissive: color, emissiveIntensity: 7 }),
    [color],
  )
  useEffect(() => () => lens.dispose(), [lens])

  return (
    <group>
      {/* Vástago hasta el carril. */}
      <mesh position={[px, py + 0.07, pz]} material={library.steelBlack}>
        <cylinderGeometry args={[0.009, 0.009, 0.14, 8]} />
      </mesh>
      <group position={position} quaternion={quaternion}>
        <mesh
          rotation-x={Math.PI / 2}
          position={[0, 0, -0.03]}
          material={library.steelBlack}
          castShadow
        >
          <cylinderGeometry args={[0.052, 0.058, 0.17, 24]} />
        </mesh>
        <mesh rotation-x={Math.PI / 2} position={[0, 0, -0.125]} material={library.steelBlack}>
          <cylinderGeometry args={[0.062, 0.062, 0.022, 24, 1, true]} />
        </mesh>
        <mesh position={[0, 0, -0.121]} rotation-x={Math.PI} material={lens}>
          <circleGeometry args={[0.046, 24]} />
        </mesh>
      </group>
      {light && (
        <>
          <spotLight
            position={position}
            target={targetObject}
            color={color}
            intensity={intensity}
            angle={angle}
            penumbra={penumbra}
            distance={distance}
            decay={2}
            castShadow={castShadow}
            shadow-mapSize={[512, 512]}
            shadow-bias={-0.0004}
          />
          <primitive object={targetObject} />
        </>
      )}
    </group>
  )
}
