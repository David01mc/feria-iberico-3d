import { asset } from '../../materials/assets'
import type { Vec3 } from '../../materials/geometry'
import meta from './meta.json'

/** Acabado extra sobre las texturas horneadas: el brillo de la grasa, del aceite, del barniz… */
export interface ProductFinish {
  clearcoat?: number
  clearcoatRoughness?: number
}

export interface ProductEntry {
  label: string
  /** Nombre del GLB en public/assets/models/products (sin extensión) y clave en meta.json. */
  file: string
  /** El origen es el punto del gancho y la pieza cuelga hacia abajo. */
  hanging?: boolean
  finish?: ProductFinish
}

/*
 * Productos ibéricos modelados y texturizados con Blender (blender/build_products.py).
 * Cada GLB es una sola malla con un solo material: se instancia sin coste extra.
 */
export const PRODUCTS = {
  jamonColgado: {
    label: 'Jamón de bellota',
    file: 'jamon_colgado',
    hanging: true,
    finish: { clearcoat: 0.3, clearcoatRoughness: 0.5 },
  },
  jamonCortado: {
    label: 'Jamón empezado',
    file: 'jamon_cortado',
    finish: { clearcoat: 0.45, clearcoatRoughness: 0.3 },
  },
  platoJamon: {
    label: 'Plato de jamón',
    file: 'plato_jamon',
    finish: { clearcoat: 0.4, clearcoatRoughness: 0.25 },
  },
  quesoCurado: { label: 'Queso curado', file: 'queso_curado' },
  quesoPimenton: { label: 'Queso al pimentón', file: 'queso_pimenton' },
  quesoCortado: { label: 'Queso empezado', file: 'queso_cortado' },
  cunaQueso: { label: 'Cuña de queso', file: 'cuna_queso' },
  torta: {
    label: 'Torta cremosa',
    file: 'torta',
    finish: { clearcoat: 0.25, clearcoatRoughness: 0.2 },
  },
  chorizoSarta: {
    label: 'Chorizo en sarta',
    file: 'chorizo_sarta',
    hanging: true,
    finish: { clearcoat: 0.5, clearcoatRoughness: 0.35 },
  },
  chorizoVela: {
    label: 'Chorizo vela',
    file: 'chorizo_vela',
    hanging: true,
    finish: { clearcoat: 0.5, clearcoatRoughness: 0.35 },
  },
  salchichon: { label: 'Salchichón', file: 'salchichon', hanging: true },
  lomo: {
    label: 'Lomo embuchado',
    file: 'lomo',
    finish: { clearcoat: 0.2, clearcoatRoughness: 0.5 },
  },
  cecina: { label: 'Cecina', file: 'cecina', finish: { clearcoat: 0.35, clearcoatRoughness: 0.4 } },
  tablaEmbutidos: {
    label: 'Tabla de embutidos',
    file: 'tabla_embutidos',
    finish: { clearcoat: 0.35, clearcoatRoughness: 0.3 },
  },
  croqueta: {
    label: 'Croqueta',
    file: 'croqueta',
    finish: { clearcoat: 0.12, clearcoatRoughness: 0.6 },
  },
  croquetaAbierta: {
    label: 'Croqueta abierta',
    file: 'croqueta_abierta',
    finish: { clearcoat: 0.2, clearcoatRoughness: 0.4 },
  },
  cucurucho: { label: 'Cucurucho de croquetas', file: 'cucurucho' },
} as const satisfies Record<string, ProductEntry>

export type ProductKey = keyof typeof PRODUCTS

export const PRODUCT_KEYS = Object.keys(PRODUCTS) as ProductKey[]

export const productUrl = (key: ProductKey) => asset(`models/products/${PRODUCTS[key].file}.glb`)

export interface ProductMeta {
  /** Tamaño [ancho x, alto y, fondo z] en metros. */
  size: Vec3
  /** Puntos de referencia en coordenadas locales (p. ej. dónde se apoya el jamón). */
  anchors: Record<string, Vec3>
}

/** Tamaños y anclajes medidos por Blender al generar el modelo. */
export function productMeta(key: ProductKey): ProductMeta {
  const entry = (meta as unknown as Record<string, ProductMeta | undefined>)[PRODUCTS[key].file]
  if (!entry) throw new Error(`Falta ${PRODUCTS[key].file} en meta.json: ejecuta npm run models`)
  return entry
}
