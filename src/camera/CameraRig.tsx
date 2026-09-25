import { CameraControls } from '@react-three/drei'
import { useEffect, useRef, type ComponentRef } from 'react'
import { Box3, Vector3 } from 'three'
import type { Vec3 } from '../materials/geometry'

/**
 * Vista general inicial: tres cuartos desde el noreste, por encima de los módulos vecinos.
 * Ve la isla del jamón de costado y los frentes de quesos, croquetas y embutidos al otro lado
 * de la avenida (todos abren al norte; embutidos también al este).
 */
export interface CameraView {
  position: Vec3
  target: Vec3
}

export const HOME_VIEW: CameraView = {
  position: [15, 7.5, -4.5],
  target: [-3, 0.5, 1],
}

/** Límites del punto de mira: dentro del pabellón y por debajo de las cerchas. */
const TARGET_BOUNDS = new Box3(new Vector3(-30, 0.3, -17), new Vector3(30, 9, 17))

/** Al arrancar se coloca sin animación; al volver del paseo, vuela suavemente a la vista general. */
let hasMounted = false

export function CameraRig({ home = HOME_VIEW }: { home?: CameraView }) {
  const controls = useRef<ComponentRef<typeof CameraControls>>(null)

  useEffect(() => {
    const c = controls.current
    if (!c) return
    c.setBoundary(TARGET_BOUNDS)
    void c.setLookAt(...home.position, ...home.target, hasMounted)
    hasMounted = true
    // Solo en desarrollo: permite encuadrar desde la consola / pruebas visuales automáticas.
    if (import.meta.env.DEV) Object.assign(window, { __controls: c })
  }, [home])

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={1.5}
      maxDistance={70}
      maxPolarAngle={Math.PI * 0.49}
      smoothTime={0.35}
      dollyToCursor
    />
  )
}
