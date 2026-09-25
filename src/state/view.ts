/**
 * Vista de la aplicación según la URL:
 * - `/`             → la feria.
 * - `/?muestrario`  → catálogo de mobiliario y materiales (revisión visual y venta).
 */
export type AppView = 'feria' | 'muestrario'

export const APP_VIEW: AppView =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('muestrario')
    ? 'muestrario'
    : 'feria'
