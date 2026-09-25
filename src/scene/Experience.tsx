import { BakeShadows, Environment, PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { CameraRig, HOME_VIEW } from '../camera/CameraRig'
import { FAIR } from '../config/fair'
import { Lighting } from '../lighting/Lighting'
import { HDRI_URL } from '../materials/assets'
import { PostFX } from '../render/PostFX'
import { QUALITY } from '../render/quality'
import { useAppStore } from '../state/store'
import { Hall } from './hall/Hall'
import { Stands } from './stands/Stands'

/**
 * Lienzo 3D. `flat` desactiva el tone mapping del renderer porque lo aplica el postproceso (AgX).
 * Las sombras se hornean una vez (escena estática) y se regeneran al cambiar la calidad.
 */
export function Experience() {
  const quality = useAppStore((s) => s.quality)
  const degradeQuality = useAppStore((s) => s.degradeQuality)
  const preset = QUALITY[quality]

  return (
    <Canvas
      className="scene"
      flat
      shadows="percentage"
      dpr={preset.dpr}
      camera={{ fov: 38, near: 0.1, far: 220, position: HOME_VIEW.position }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
    >
      <color attach="background" args={['#1b1c1e']} />
      <fog attach="fog" args={['#c7c3bb', 40, 150]} />
      <Suspense fallback={null}>
        <Environment files={HDRI_URL} environmentIntensity={0.5} />
        <Lighting shadowMapSize={preset.shadowMapSize} />
        <Hall fair={FAIR} />
        <Stands stands={FAIR.stands} />
        <BakeShadows key={quality} />
      </Suspense>
      <CameraRig />
      <PostFX preset={preset} />
      <PerformanceMonitor onDecline={degradeQuality} flipflops={3} />
    </Canvas>
  )
}
