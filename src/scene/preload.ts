import { useEnvironment } from '@react-three/drei'
import { HDRI_URL } from '../materials/assets'
import { PBR, preloadPbr } from '../materials/pbr'
import { PRODUCTS, type ProductEntry, type ProductKey } from './products/catalog'
import { preloadProduct } from './products/ProductInstances'
import { APP_VIEW } from '../state/view'
import { MODELS, type ModelEntry, type ModelKey } from './props/catalog'
import { preloadProp } from './props/Prop'

/**
 * Pide a la vez todos los assets de la escena antes del primer render.
 *
 * Sin esto la carga va en cascada: cada componente que suspende (useGLTF, useTexture…) no deja
 * descubrir el siguiente asset hasta que el suyo termina, y cada reintento vuelve a renderizar
 * la escena entera. Resultado: decenas de oleadas en ~17 s y una barra que llega al 100 % una y
 * otra vez. Con todo en vuelo desde el arranque, la escena monta de una sola vez.
 *
 * Se precarga el catálogo completo salvo lo marcado `showroomOnly` (piezas que solo enseña el
 * muestrario): así la lista no puede quedarse desfasada respecto a lo que usan los stands.
 */
export function preloadScene() {
  useEnvironment.preload({ files: HDRI_URL })
  for (const set of Object.values(PBR)) preloadPbr(set)
  const wanted = (entry: ModelEntry | ProductEntry) =>
    APP_VIEW === 'muestrario' || !entry.showroomOnly
  for (const model of Object.keys(MODELS) as ModelKey[])
    if (wanted(MODELS[model])) preloadProp(model)
  for (const product of Object.keys(PRODUCTS) as ProductKey[])
    if (wanted(PRODUCTS[product])) preloadProduct(product)
}
