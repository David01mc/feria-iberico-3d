import { create } from 'zustand'
import { QUALITY_ORDER, type QualityLevel } from '../render/quality'

interface AppState {
  quality: QualityLevel
  /** Pasa a false en cuanto el usuario elige la calidad a mano. */
  autoQuality: boolean
  setQuality: (quality: QualityLevel) => void
  /** Baja un escalón de calidad si el ajuste automático sigue activo. */
  degradeQuality: () => void
}

export const useAppStore = create<AppState>()((set, get) => ({
  quality: 'alta',
  autoQuality: true,
  setQuality: (quality) => set({ quality, autoQuality: false }),
  degradeQuality: () => {
    const { quality, autoQuality } = get()
    if (!autoQuality) return
    const next = QUALITY_ORDER[QUALITY_ORDER.indexOf(quality) + 1]
    if (next) set({ quality: next })
  },
}))
