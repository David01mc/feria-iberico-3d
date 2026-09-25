import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { MeshPhysicalMaterial, type Material, type MeshPhysicalMaterialParameters } from 'three'
import { useAppStore } from '../state/store'
import { PBR, usePbr, type PbrMaps, type PbrSet } from './pbr'

/*
 * Librería de materiales compartida por el mobiliario, los stands y los modelos de Blender
 * (que nombran sus materiales con estas mismas claves). Un único material por clave:
 * menos programas de shader y aspecto coherente en toda la feria.
 */

export const MATERIAL_KEYS = [
  'oak',
  'darkWood',
  'roughWood',
  'deck',
  'plaster',
  'brick',
  'tiles',
  'terracotta',
  'hessian',
  'linen',
  'steelBrushed',
  'steelBlack',
  'chrome',
  'aluminium',
  'glass',
  'lacquerWhite',
  'lacquerBlack',
  'chalkboard',
  'rubber',
  'ceramicWhite',
  'ledWarm',
  'ledAmber',
  'oil',
] as const

export type MaterialKey = (typeof MATERIAL_KEYS)[number]
export type MaterialLibrary = Record<MaterialKey, Material>
/** Un material de la librería por su clave, o uno propio (p. ej. teñido con el color de marca). */
export type MaterialRef = MaterialKey | Material

export const isMaterialKey = (name: string): name is MaterialKey =>
  (MATERIAL_KEYS as readonly string[]).includes(name)

/** Metros que cubre una repetición de la textura del material (1 si no tiene textura). */
export const tileOf = (material: Material): number => (material.userData.tile as number) ?? 1

export const resolveMaterial = (library: MaterialLibrary, ref: MaterialRef): Material =>
  typeof ref === 'string' ? library[ref] : ref

type TexturedKey = 'oak' | 'darkWood' | 'roughWood' | 'deck' | 'plaster' | 'brick' | 'tiles' | 'terracotta' | 'hessian' | 'linen'

function physical(name: string, params: MeshPhysicalMaterialParameters, extra: Record<string, unknown> = {}) {
  const material = new MeshPhysicalMaterial(params)
  material.name = name
  Object.assign(material.userData, extra)
  return material
}

function buildLibrary(maps: Record<TexturedKey, PbrMaps>, cheapGlass: boolean): MaterialLibrary {
  const textured = (key: TexturedKey, set: PbrSet, params: MeshPhysicalMaterialParameters = {}) =>
    physical(key, { ...maps[key], roughness: 1, ...params }, { tile: set.tile })
  // Vidrio, LED y aceite no proyectan sombra (se verían como sólidos opacos).
  const noShadow = { noShadow: true }

  return {
    // Maderas barnizadas: la capa de clearcoat da el brillo del barniz sobre el poro.
    oak: textured('oak', PBR.oak, { clearcoat: 0.3, clearcoatRoughness: 0.35 }),
    darkWood: textured('darkWood', PBR.darkWood, { clearcoat: 0.35, clearcoatRoughness: 0.3 }),
    roughWood: textured('roughWood', PBR.roughWood),
    deck: textured('deck', PBR.deck, { roughness: 0.95 }),
    plaster: textured('plaster', PBR.plaster, { color: '#f4efe6' }),
    brick: textured('brick', PBR.brick),
    // Azulejo vidriado.
    tiles: textured('tiles', PBR.tiles, { clearcoat: 0.6, clearcoatRoughness: 0.08 }),
    terracotta: textured('terracotta', PBR.terracotta),
    hessian: textured('hessian', PBR.hessian),
    linen: textured('linen', PBR.linen, { color: '#e8dfcf' }),

    steelBrushed: physical('steelBrushed', { color: '#c8cbce', metalness: 1, roughness: 0.3 }),
    steelBlack: physical('steelBlack', { color: '#1e1f21', metalness: 0.85, roughness: 0.42 }),
    chrome: physical('chrome', { color: '#eceef0', metalness: 1, roughness: 0.06 }),
    aluminium: physical('aluminium', { color: '#d2d6da', metalness: 0.95, roughness: 0.25 }),
    glass: cheapGlass
      ? physical(
          'glass',
          { color: '#e4ecea', roughness: 0.04, transparent: true, opacity: 0.16, depthWrite: false },
          noShadow,
        )
      : physical('glass', { color: '#ffffff', roughness: 0.02, transmission: 1, thickness: 0.008, ior: 1.52 }, noShadow),
    lacquerWhite: physical('lacquerWhite', {
      color: '#efece6',
      roughness: 0.35,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
    }),
    lacquerBlack: physical('lacquerBlack', {
      color: '#131313',
      roughness: 0.4,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    }),
    chalkboard: physical('chalkboard', { color: '#27302b', roughness: 0.95 }),
    rubber: physical('rubber', { color: '#141414', roughness: 0.9 }),
    ceramicWhite: physical('ceramicWhite', {
      color: '#f4f1ea',
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    }),
    ledWarm: physical('ledWarm', { color: '#000000', emissive: '#ffd6a0', emissiveIntensity: 4 }, noShadow),
    ledAmber: physical('ledAmber', { color: '#000000', emissive: '#ff7a1a', emissiveIntensity: 5 }, noShadow),
    oil: physical(
      'oil',
      { color: '#6b4a0c', roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 },
      noShadow,
    ),
  }
}

const LibraryContext = createContext<MaterialLibrary | null>(null)

/** Crea la librería una vez (se recrea solo si cambia la calidad: el vidrio barato en "Baja"). */
export function MaterialLibraryProvider({ children }: { children: ReactNode }) {
  const cheapGlass = useAppStore((s) => s.quality === 'baja')
  const oak = usePbr(PBR.oak)
  const darkWood = usePbr(PBR.darkWood)
  const roughWood = usePbr(PBR.roughWood)
  const deck = usePbr(PBR.deck)
  const plaster = usePbr(PBR.plaster)
  const brick = usePbr(PBR.brick)
  const tiles = usePbr(PBR.tiles)
  const terracotta = usePbr(PBR.terracotta)
  const hessian = usePbr(PBR.hessian)
  // El albedo original es un lino azul: se usa solo su relieve y se tiñe de crudo.
  const linen = usePbr(PBR.linen, { color: false })

  const library = useMemo(
    () =>
      buildLibrary(
        { oak, darkWood, roughWood, deck, plaster, brick, tiles, terracotta, hessian, linen },
        cheapGlass,
      ),
    [oak, darkWood, roughWood, deck, plaster, brick, tiles, terracotta, hessian, linen, cheapGlass],
  )

  useEffect(() => () => Object.values(library).forEach((material) => material.dispose()), [library])

  return <LibraryContext.Provider value={library}>{children}</LibraryContext.Provider>
}

export function useMaterials(): MaterialLibrary {
  const library = useContext(LibraryContext)
  if (!library) throw new Error('useMaterials() debe usarse dentro de <MaterialLibraryProvider>')
  return library
}

/** Variante teñida de un material de la librería (p. ej. lacado con el color corporativo). */
export function useTintedMaterial(base: MaterialKey, color: string): Material {
  const library = useMaterials()
  const material = useMemo(() => {
    const tinted = library[base].clone() as MeshPhysicalMaterial
    tinted.color.set(color)
    tinted.name = `${base}:${color}`
    return tinted
  }, [library, base, color])
  useEffect(() => () => material.dispose(), [material])
  return material
}
