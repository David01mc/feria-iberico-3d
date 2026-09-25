import { FAIR } from '../config/fair'
import { QUALITY, QUALITY_ORDER } from '../render/quality'
import { useAppStore } from '../state/store'

/** Interfaz superpuesta: identidad de la feria, ayuda de navegación y selector de calidad. */
export function Overlay() {
  const { brand } = FAIR
  const quality = useAppStore((s) => s.quality)
  const autoQuality = useAppStore((s) => s.autoQuality)
  const setQuality = useAppStore((s) => s.setQuality)

  return (
    <div className="overlay">
      <header className="brand">
        <p className="brand__eyebrow">
          {brand.venue} · {brand.dates}
        </p>
        <h1 className="brand__name">{brand.name}</h1>
        <p className="brand__sub">
          {brand.subtitle} <span>{brand.edition}</span>
        </p>
      </header>

      <footer className="hud">
        <p className="hud__hint">
          Arrastra para orbitar <span aria-hidden>·</span> Rueda para acercar{' '}
          <span aria-hidden>·</span> Clic derecho para desplazar
        </p>
        <div className="quality" role="radiogroup" aria-label="Calidad de render">
          <span className="quality__label">Calidad{autoQuality ? ' · auto' : ''}</span>
          {QUALITY_ORDER.map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={level === quality}
              className="quality__option"
              onClick={() => setQuality(level)}
            >
              {QUALITY[level].label}
            </button>
          ))}
        </div>
      </footer>
    </div>
  )
}
