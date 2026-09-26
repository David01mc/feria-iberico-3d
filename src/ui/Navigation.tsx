import { useEffect, useMemo, useState } from 'react'
import { FAIR } from '../config/fair'
import { createNavigator, standEntrance } from '../config/navigation'
import type { StandConfig } from '../config/types'
import { useAppStore } from '../state/store'

const navigator = createNavigator(FAIR)
const stands = [...FAIR.stands].sort((a, b) => a.company.name.localeCompare(b.company.name, 'es'))
const entrance = (stand: StandConfig) => standEntrance(stand)

/** Plano de la feria y brújula de paseo, ambos sincronizados con la posición real del visitante. */
export function Navigation() {
  const [open, setOpen] = useState(false)
  const cameraMode = useAppStore((s) => s.cameraMode)
  const setCameraMode = useAppStore((s) => s.setCameraMode)
  const destinationId = useAppStore((s) => s.destinationId)
  const setDestinationId = useAppStore((s) => s.setDestinationId)
  const setNavigationRoute = useAppStore((s) => s.setNavigationRoute)
  const walkPosition = useAppStore((s) => s.walkPosition)
  const walkForward = useAppStore((s) => s.walkForward)
  const destination = FAIR.stands.find((stand) => stand.id === destinationId)
  const origin = walkPosition
  const route = useMemo(
    () => (destination ? navigator.route(origin, entrance(destination)) : []),
    // Los puntos del paseo cambian cada 350 ms; actualizar el camino permite corregir desvíos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [destinationId, origin[0], origin[1]],
  )
  useEffect(() => setNavigationRoute(route), [route, setNavigationRoute])
  const distance = route.reduce((total, p, i) => {
    if (!i) return total
    const previous = route[i - 1]!
    return total + Math.hypot(p[0] - previous[0], p[1] - previous[1])
  }, 0)
  const arrived =
    !!destination &&
    Math.hypot(
      walkPosition[0] - entrance(destination)[0],
      walkPosition[1] - entrance(destination)[1],
    ) < 1.25
  const waypoint = route[1] ?? null
  const dx = waypoint ? waypoint[0] - walkPosition[0] : 0
  const dz = waypoint ? waypoint[1] - walkPosition[1] : 0
  const turn =
    (Math.atan2(
      walkForward[0] * dz - walkForward[1] * dx,
      walkForward[0] * dx + walkForward[1] * dz,
    ) *
      180) /
    Math.PI

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 'm' ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return
      if (
        event.target instanceof HTMLElement &&
        /^(input|textarea|select)$/i.test(event.target.tagName)
      )
        return
      if (document.pointerLockElement) document.exitPointerLock()
      setOpen((value) => !value)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const startGuide = () => {
    setCameraMode('paseo')
    setOpen(false)
  }

  return (
    <>
      <div className="navigation">
        <button
          type="button"
          className="navigation__toggle"
          aria-expanded={open}
          aria-controls="fair-map"
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">◇</span> Mapa <kbd>M</kbd>
        </button>
        {open && (
          <section
            className="navigation__panel"
            id="fair-map"
            aria-label="Mapa interactivo de la feria"
          >
            <div className="navigation__heading">
              <div>
                <span className="navigation__eyebrow">Pabellón 3</span>
                <h2>Encuentra tu stand</h2>
              </div>
              <button
                type="button"
                className="navigation__close"
                aria-label="Cerrar mapa"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <svg
              className="fair-map"
              viewBox="-31 -18 62 36"
              role="img"
              aria-label="Plano de los stands y ruta seleccionada"
            >
              <rect
                x={FAIR.hall.bounds.x0}
                y={FAIR.hall.bounds.z0}
                width={62}
                height={36}
                className="fair-map__hall"
              />
              {FAIR.aisles.map((aisle) => (
                <rect
                  key={aisle.name}
                  x={aisle.rect.x0}
                  y={aisle.rect.z0}
                  width={aisle.rect.x1 - aisle.rect.x0}
                  height={aisle.rect.z1 - aisle.rect.z0}
                  className="fair-map__aisle"
                />
              ))}
              {FAIR.neighbors.map((neighbor) => (
                <rect
                  key={neighbor.code}
                  x={neighbor.plot.x0}
                  y={neighbor.plot.z0}
                  width={neighbor.plot.x1 - neighbor.plot.x0}
                  height={neighbor.plot.z1 - neighbor.plot.z0}
                  className="fair-map__neighbor"
                />
              ))}
              {FAIR.stands.map((stand) => {
                const { plot } = stand
                const selected = stand.id === destinationId
                const [cx, cz] = [(plot.x0 + plot.x1) / 2, (plot.z0 + plot.z1) / 2]
                return (
                  <g
                    key={stand.id}
                    className={`fair-map__stand${selected ? ' fair-map__stand--selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Guiar a ${stand.company.name}`}
                    onClick={() => setDestinationId(stand.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setDestinationId(stand.id)
                      }
                    }}
                  >
                    <rect
                      x={plot.x0}
                      y={plot.z0}
                      width={plot.x1 - plot.x0}
                      height={plot.z1 - plot.z0}
                      rx="0.28"
                    />
                    <text x={cx} y={cz + 0.45} textAnchor="middle">
                      {stand.code}
                    </text>
                  </g>
                )
              })}
              {route.length > 1 && (
                <polyline
                  points={route.map(([x, z]) => `${x},${z}`).join(' ')}
                  className="fair-map__route"
                />
              )}
              {destination && (
                <circle
                  cx={entrance(destination)[0]}
                  cy={entrance(destination)[1]}
                  r="0.65"
                  className="fair-map__goal"
                />
              )}
              <circle cx={origin[0]} cy={origin[1]} r="0.65" className="fair-map__you" />
              <text
                x={origin[0]}
                y={origin[1] - 1.2}
                textAnchor="middle"
                className="fair-map__you-label"
              >
                TÚ
              </text>
            </svg>
            <p className="navigation__legend">
              <span className="navigation__dot" /> Tu posición <span className="navigation__line" />{' '}
              Ruta al stand
            </p>
            <div className="navigation__list" aria-label="Elegir destino">
              {stands.map((stand) => (
                <button
                  key={stand.id}
                  type="button"
                  aria-pressed={destinationId === stand.id}
                  onClick={() => setDestinationId(stand.id)}
                >
                  <span>{stand.company.name}</span>
                  <small>{stand.code}</small>
                </button>
              ))}
            </div>
            {destination && (
              <div className="navigation__action">
                <p>
                  <strong>{destination.company.name}</strong>
                  <br />
                  {route.length
                    ? `${Math.round(distance)} m de recorrido`
                    : 'No se ha encontrado una ruta'}
                </p>
                {route.length > 0 && (
                  <button type="button" onClick={startGuide}>
                    {cameraMode === 'paseo' ? 'Seguir ruta' : 'Empezar paseo guiado'}
                  </button>
                )}
              </div>
            )}
          </section>
        )}
      </div>
      {cameraMode === 'paseo' && destination && !open && (
        <div className="guide" role="status" aria-live="off">
          <span
            className="guide__arrow"
            style={{ transform: `rotate(${arrived ? 0 : turn}deg)` }}
            aria-hidden="true"
          >
            {route.length ? '↑' : '?'}
          </span>
          <span className="guide__text">
            <strong>{arrived ? 'Has llegado' : destination.company.name}</strong>
            <small>
              {arrived
                ? destination.code
                : route.length
                  ? `${Math.round(distance)} m · Sigue la ruta del suelo`
                  : 'Ruta no disponible'}
            </small>
          </span>
          <button type="button" aria-label="Finalizar guía" onClick={() => setDestinationId(null)}>
            ×
          </button>
        </div>
      )}
    </>
  )
}
