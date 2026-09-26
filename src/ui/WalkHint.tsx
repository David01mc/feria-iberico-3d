import { useAppStore } from '../state/store'

/** Ayuda del modo paseo: invita a capturar el ratón y recuerda los controles. */
export function WalkHint() {
  const pointerLocked = useAppStore((s) => s.pointerLocked)

  return (
    <div className={`walk${pointerLocked ? ' walk--locked' : ''}`}>
      <button id="walk-lock" type="button" className="walk__start" hidden={pointerLocked}>
        Haz clic para mirar
      </button>
      <p className="walk__keys" aria-label="Controles del paseo">
        <kbd>W</kbd>
        <kbd>A</kbd>
        <kbd>S</kbd>
        <kbd>D</kbd> caminar <span aria-hidden>·</span> <kbd>Mayús</kbd> correr{' '}
        <span aria-hidden>·</span> <kbd>Esc</kbd> soltar el ratón
      </p>
    </div>
  )
}
