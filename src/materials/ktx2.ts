import type { GLTFLoader } from 'three-stdlib'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'

/**
 * Cargador KTX2 único para toda la app (texturas PBR y las embebidas en los GLB de productos):
 * un solo pool de workers y una sola clave de caché para `useLoader` y su precarga.
 * El transcodificador Basis de three.js lo empaqueta Vite junto a la app (sin CDN en la demo).
 */
export const ktx2Loader = new KTX2Loader()

/**
 * La precarga arranca antes de que exista el renderer, pero el transcodificador necesita saber a
 * qué formato comprimido convertir. Se consulta a un contexto WebGL2 temporal de la misma GPU.
 */
function detectSupport() {
  if (typeof document === 'undefined') return
  const gl = document.createElement('canvas').getContext('webgl2')
  if (!gl) return
  const probe = {
    extensions: {
      has: (name: string) => gl.getExtension(name) !== null,
      get: (name: string) => gl.getExtension(name),
    },
  }
  ktx2Loader.detectSupport(probe as unknown as Parameters<KTX2Loader['detectSupport']>[0])
  gl.getExtension('WEBGL_lose_context')?.loseContext()
}

detectSupport()

/** `extendLoader` de useGLTF para los modelos con texturas KTX2 (KHR_texture_basisu). */
export const withKTX2 = (loader: GLTFLoader) => {
  loader.setKTX2Loader(ktx2Loader as never)
}
