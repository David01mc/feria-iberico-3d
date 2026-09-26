import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { FAIR } from '../config/fair'
import { useAppStore } from '../state/store'

/** Margen tras la carga para que compilen los shaders antes de medir el rendimiento. */
const WARMUP_MS = 3000

/** Pantalla de carga con la marca de la feria; se funde al terminar de cargar los assets. */
export function LoadingScreen() {
  const { active, progress, loaded, total } = useProgress()
  const setSceneReady = useAppStore((s) => s.setSceneReady)
  const [hidden, setHidden] = useState(false)
  const done = !active && total > 0 && loaded === total

  useEffect(() => {
    if (!done) return
    const fade = setTimeout(() => setHidden(true), 900)
    const warmup = setTimeout(setSceneReady, WARMUP_MS)
    return () => {
      clearTimeout(fade)
      clearTimeout(warmup)
    }
  }, [done, setSceneReady])

  if (hidden) return null

  return (
    <div className={`loader${done ? ' loader--done' : ''}`} role="status" aria-live="polite">
      <p className="loader__eyebrow">{FAIR.brand.subtitle}</p>
      <h2 className="loader__name">{FAIR.brand.name}</h2>
      <div className="loader__bar">
        <span style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
      <p className="loader__pct">Preparando el pabellón · {Math.round(progress)}%</p>
    </div>
  )
}
