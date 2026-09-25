/** Rutas públicas de los assets descargados por `npm run assets`. */
export const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`

export const HDRI_URL = asset('hdri/rostock_laage_airport_2k.hdr')

export const fontUrl = (id: string) => asset(`fonts/${id}.woff`)

export const FONT = {
  ui: fontUrl('inter-600'),
  uiBold: fontUrl('inter-800'),
  display: fontUrl('fraunces-600'),
  signage: fontUrl('barlow-condensed-600'),
} as const
