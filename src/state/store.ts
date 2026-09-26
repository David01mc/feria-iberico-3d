import { create } from 'zustand'
import { initialQuality, QUALITY_ORDER, type QualityLevel } from '../render/quality'
import { WALK_SPAWN } from '../config/colliders'
import type { Vec2 } from '../camera/collision'

/** `orbita`: vista aérea libre. `paseo`: primera persona con WASD a la altura de los ojos. */
export type CameraMode = 'orbita' | 'paseo'

interface AppState {
  quality: QualityLevel
  /** Pasa a false en cuanto el usuario elige la calidad a mano. */
  autoQuality: boolean
  setQuality: (quality: QualityLevel) => void
  /** Baja un escalón de calidad si el ajuste automático sigue activo. */
  degradeQuality: () => void

  /** Assets cargados y pantalla de carga retirada: a partir de aquí se mide el rendimiento. */
  sceneReady: boolean
  setSceneReady: () => void

  cameraMode: CameraMode
  setCameraMode: (mode: CameraMode) => void
  /** En paseo: el ratón está capturado para mirar alrededor. */
  pointerLocked: boolean
  setPointerLocked: (locked: boolean) => void
  destinationId: string | null
  setDestinationId: (id: string | null) => void
  navigationRoute: Vec2[]
  setNavigationRoute: (route: Vec2[]) => void
  walkPosition: Vec2
  walkForward: Vec2
  setWalkPose: (position: Vec2, forward: Vec2) => void
}

export const useAppStore = create<AppState>()((set, get) => ({
  quality: initialQuality(),
  autoQuality: true,
  setQuality: (quality) => set({ quality, autoQuality: false }),
  degradeQuality: () => {
    const { quality, autoQuality } = get()
    if (!autoQuality) return
    const next = QUALITY_ORDER[QUALITY_ORDER.indexOf(quality) + 1]
    if (next) set({ quality: next })
  },

  sceneReady: false,
  setSceneReady: () => set({ sceneReady: true }),

  cameraMode: 'orbita',
  setCameraMode: (cameraMode) => set({ cameraMode, pointerLocked: false }),
  pointerLocked: false,
  setPointerLocked: (pointerLocked) => set({ pointerLocked }),
  destinationId: null,
  setDestinationId: (destinationId) => set({ destinationId }),
  navigationRoute: [],
  setNavigationRoute: (navigationRoute) => set({ navigationRoute }),
  walkPosition: WALK_SPAWN.position,
  walkForward: [0, -1],
  setWalkPose: (walkPosition, walkForward) => set({ walkPosition, walkForward }),
}))
