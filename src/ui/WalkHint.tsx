import { useAppStore } from '../state/store'

/** Retícula central del paseo mientras el ratón está capturado (se captura con un clic en la escena). */
export function WalkHint() {
  const pointerLocked = useAppStore((s) => s.pointerLocked)
  return pointerLocked ? <div className="walk-reticle" aria-hidden /> : null
}
