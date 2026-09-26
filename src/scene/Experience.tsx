import { BakeShadows, Environment, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useState } from 'react'
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
 * Render continuo tras la carga mientras el monitor de rendimiento ajusta la calidad (≈3 muestras
 * de 2,5 s). Después, la vista aérea pasa a renderizar bajo demanda: con la cámara quieta no se
 * redibuja nada (CameraControls y Text de drei piden fotograma cuando cambian) y la GPU descansa.
 */
const CALIBRATION_MS = 8000

const withProbe = import.meta.env.DEV || new URLSearchParams(location.search).has('probe')

/**
 * Expone renderer y escena para medir rendimiento desde la consola: siempre en desarrollo y, en
 * producción, solo con `?probe` en la URL (para medir el build desplegado).
 */
function DevProbe() {
  const state = useThree()
  useEffect(() => {
    Object.assign(window, { __r3f: state })
  }, [state])
  return null
}

/**
 * Lienzo 3D. `flat` desactiva el tone mapping del renderer porque lo aplica el postproceso (AgX).
 * Las sombras se hornean una vez (escena estática) y se regeneran al cambiar la calidad.
 */
export function Experience() {
  const quality = useAppStore((s) => s.quality)
  const degradeQuality = useAppStore((s) => s.degradeQuality)
  const cameraMode = useAppStore((s) => s.cameraMode)
  const sceneReady = useAppStore((s) => s.sceneReady)
  const preset = QUALITY[quality]
  const colliders = useMemo(() => buildColliders(FAIR), [])
  const home = isShowroom ? SHOWROOM_VIEW : HOME_VIEW
  const [calibrated, setCalibrated] = useState(false)
  useEffect(() => {
    if (!sceneReady) return
    const timer = setTimeout(() => setCalibrated(true), CALIBRATION_MS)
    return () => clearTimeout(timer)
  }, [sceneReady])
  // El paseo anima la cámara en cada fotograma; la vista aérea solo cuando se mueve.
  const continuous = cameraMode === 'paseo' || !calibrated

  return (
    <Canvas
      className="scene"
      flat
      frameloop={continuous ? 'always' : 'demand'}
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
      {withProbe && <DevProbe />}
      {/* Solo tras la carga (la compilación de shaders hunde los fps un momento y no es real) y con
          render continuo: bajo demanda, los ratos sin fotogramas se leerían como fps bajísimos. */}
      {sceneReady && continuous && <PerformanceMonitor onDecline={degradeQuality} flipflops={3} />}
    </Canvas>
  )
}
