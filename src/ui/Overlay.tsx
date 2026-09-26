import { FAIR } from '../config/fair'
import { QUALITY, QUALITY_ORDER } from '../render/quality'
import { useAppStore, type CameraMode } from '../state/store'
import { APP_VIEW } from '../state/view'
import { WalkHint } from './WalkHint'
import { Navigation } from './Navigation'

const MODES: { id: CameraMode; label: string }[] = [
  { id: 'orbita', label: 'Vista aérea' },
  { id: 'paseo', label: 'Paseo' },
]

/** Interfaz superpuesta: identidad de la feria, modo de cámara y selector de calidad. */
export function Overlay() {
  const { brand } = FAIR
  const quality = useAppStore((s) => s.quality)
  const autoQuality = useAppStore((s) => s.autoQuality)
  const setQuality = useAppStore((s) => s.setQuality)
  const cameraMode = useAppStore((s) => s.cameraMode)
  const setCameraMode = useAppStore((s) => s.setCameraMode)

  const isShowroom = APP_VIEW === 'muestrario'

  return (
    <div className="overlay">
      <header className="brand">
        <p className="brand__eyebrow">
          {isShowroom ? 'Catálogo' : `${brand.venue} · ${brand.dates}`}
        </p>
        <h1 className="brand__name">{isShowroom ? 'Muestrario' : brand.name}</h1>
        <p className="brand__sub">
          {isShowroom ? 'Mobiliario y materiales reutilizables' : brand.subtitle}{' '}
          {!isShowroom && <span>{brand.edition}</span>}
        </p>
      </header>

      {cameraMode === 'paseo' && !isShowroom && <WalkHint />}
      {!isShowroom && <Navigation />}

      <footer className="hud">
        <div className="hud__left">
          {!isShowroom && (
            <div className="segmented" role="radiogroup" aria-label="Modo de cámara">
              {MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  role="radio"
                  aria-checked={mode.id === cameraMode}
                  className="segmented__option"
                  onClick={() => setCameraMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
          {cameraMode === 'orbita' && (
            <p className="hud__hint">
              Arrastra para orbitar <span aria-hidden>·</span> Rueda para acercar{' '}
              <span aria-hidden>·</span> Clic derecho para desplazar
            </p>
          )}
        </div>
        <div className="segmented" role="radiogroup" aria-label="Calidad de render">
          <span className="segmented__label">Calidad{autoQuality ? ' · auto' : ''}</span>
          {QUALITY_ORDER.map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={level === quality}
              className="segmented__option"
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
