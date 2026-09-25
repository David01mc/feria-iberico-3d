import { BakeShadows, Environment, PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import { CameraRig, HOME_VIEW } from '../camera/CameraRig'
import { WalkControls } from '../camera/WalkControls'
import { buildColliders } from '../config/colliders'
import { FAIR } from '../config/fair'
import { Lighting } from '../lighting/Lighting'
import { HDRI_URL } from '../materials/assets'
import { MaterialLibraryProvider } from '../materials/library'
import { PostFX } from '../render/PostFX'
import { QUALITY } from '../render/quality'
import { useAppStore } from '../state/store'
import { APP_VIEW } from '../state/view'
import { Hall } from './hall/Hall'
import { SHOWROOM_VIEW, Showroom } from './showroom/Showroom'
import { Stands } from './stands/Stands'

const isShowroom = APP_VIEW === 'muestrario'

/**
 * Lienzo 3D. `flat` desactiva el tone mapping del renderer porque lo aplica el postproceso (AgX).
 * Las sombras se hornean una vez (escena estática) y se regeneran al cambiar la calidad.
 */
export function Experience() {
  const quality = useAppStore((s) => s.quality)
  const degradeQuality = useAppStore((s) => s.degradeQuality)
  const cameraMode = useAppStore((s) => s.cameraMode)
  const preset = QUALITY[quality]
  const colliders = useMemo(() => buildColliders(FAIR), [])
  const home = isShowroom ? SHOWROOM_VIEW : HOME_VIEW

  return (
    <Canvas
      className="scene"
      flat
      shadows="percentage"
      dpr={preset.dpr}
      camera={{ fov: 38, near: 0.1, far: 220, position: home.position }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
    >
      <color attach="background" args={[isShowroom ? '#cfcac1' : '#1b1c1e']} />
      {!isShowroom && <fog attach="fog" args={['#c7c3bb', 40, 150]} />}
      <Suspense fallback={null}>
        <Environment files={HDRI_URL} environmentIntensity={0.5} />
        <Lighting shadowMapSize={preset.shadowMapSize} />
        <MaterialLibraryProvider>
          {isShowroom ? (
            <Showroom />
          ) : (
            <>
              <Hall fair={FAIR} />
              <Stands stands={FAIR.stands} />
            </>
          )}
        </MaterialLibraryProvider>
        <BakeShadows key={quality} />
      </Suspense>
      {cameraMode === 'paseo' && !isShowroom ? (
        <WalkControls colliders={colliders} />
      ) : (
        <CameraRig home={home} />
      )}
      <PostFX preset={preset} />
      <PerformanceMonitor onDecline={degradeQuality} flipflops={3} />
    </Canvas>
  )
}
