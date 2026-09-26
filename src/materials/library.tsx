import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { MeshPhysicalMaterial, type Material, type MeshPhysicalMaterialParameters } from 'three'
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
  'pine',
  'leatherBlack',
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
  'wine',
  'cider',
  'beer',
  'foam',
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

type TexturedKey =
  | 'oak'
  | 'darkWood'
  | 'roughWood'
  | 'deck'
  | 'plaster'
  | 'brick'
  | 'tiles'
  | 'terracotta'
  | 'hessian'
  | 'linen'
  | 'pine'

function physical(
  name: string,
  params: MeshPhysicalMaterialParameters,
  extra: Record<string, unknown> = {},
) {
  const material = new MeshPhysicalMaterial(params)
  material.name = name
  Object.assign(material.userData, extra)
  return material
}

function buildLibrary(maps: Record<TexturedKey, PbrMaps>): MaterialLibrary {
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
    // Pino de palé y chapa clara: el contrachapado, algo más cálido y sin barnizar.
    pine: textured('pine', PBR.plywood, { color: '#f3dcb4' }),
    // Cuero negro con el brillo suave del uso.
    leatherBlack: physical('leatherBlack', {
      color: '#161412',
      roughness: 0.48,
      clearcoat: 0.25,
      clearcoatRoughness: 0.45,
      sheen: 0.4,
      sheenColor: '#3a3632',
    }),

    steelBrushed: physical('steelBrushed', { color: '#c8cbce', metalness: 1, roughness: 0.3 }),
    steelBlack: physical('steelBlack', { color: '#1e1f21', metalness: 0.85, roughness: 0.42 }),
    chrome: physical('chrome', { color: '#eceef0', metalness: 1, roughness: 0.06 }),
    aluminium: physical('aluminium', { color: '#d2d6da', metalness: 0.95, roughness: 0.25 }),
    // Vidrio reflectante translúcido. Sin transmisión real: un solo objeto transmisivo obliga a
    // renderizar la escena entera otra vez en cada fotograma (−8 ms medidos en el portátil).
    glass: physical(
      'glass',
      {
        color: '#e4ecea',
        roughness: 0.03,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        envMapIntensity: 1.6,
      },
      noShadow,
    ),
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
    ledWarm: physical(
      'ledWarm',
      { color: '#000000', emissive: '#ffd6a0', emissiveIntensity: 4 },
      noShadow,
    ),
    ledAmber: physical(
      'ledAmber',
      { color: '#000000', emissive: '#ff7a1a', emissiveIntensity: 5 },
      noShadow,
    ),
    oil: physical(
      'oil',
      { color: '#6b4a0c', roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 },
      noShadow,
    ),
    // Líquidos dentro de copas y vasos: opacos y brillantes (el vidrio encima ya es translúcido).
    wine: physical(
      'wine',
      { color: '#3d0a12', roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02 },
      noShadow,
    ),
    cider: physical(
      'cider',
      { color: '#c99a3a', roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03 },
      noShadow,
    ),
    beer: physical(
      'beer',
      { color: '#b8741c', roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02 },
      noShadow,
    ),
    foam: physical('foam', { color: '#f3ecdc', roughness: 0.85 }, noShadow),
  }
}

const LibraryContext = createContext<MaterialLibrary | null>(null)

/** Crea la librería una sola vez para toda la escena. */
export function MaterialLibraryProvider({ children }: { children: ReactNode }) {
  const oak = usePbr(PBR.oak)
  const darkWood = usePbr(PBR.darkWood)
  const roughWood = usePbr(PBR.roughWood)
  const deck = usePbr(PBR.deck)
  const plaster = usePbr(PBR.plaster)
  const brick = usePbr(PBR.brick)
  const tiles = usePbr(PBR.tiles)
  const terracotta = usePbr(PBR.terracotta)
  const hessian = usePbr(PBR.hessian)
  const linen = usePbr(PBR.linen)
  const pine = usePbr(PBR.plywood)

  const library = useMemo(
    () =>
      buildLibrary({
        oak,
        darkWood,
        roughWood,
        deck,
        plaster,
        brick,
        tiles,
        terracotta,
        hessian,
        linen,
        pine,
      }),
    [oak, darkWood, roughWood, deck, plaster, brick, tiles, terracotta, hessian, linen, pine],
  )

  useEffect(() => () => Object.values(library).forEach((material) => material.dispose()), [library])

  return <LibraryContext.Provider value={library}>{children}</LibraryContext.Provider>
}

export function useMaterials(): MaterialLibrary {
  const library = useContext(LibraryContext)
  if (!library) throw new Error('useMaterials() debe usarse dentro de <MaterialLibraryProvider>')
  return library
}

/**
 * Tintes compartidos: un material por (librería, base, color) aunque lo pidan cien muebles.
 * Así se agrupan en la fusión de geometría y no multiplican materiales ni llamadas de dibujo.
 */
const tinted = new WeakMap<MaterialLibrary, Map<string, { material: Material; users: number }>>()

function acquireTint(library: MaterialLibrary, base: MaterialKey, color: string): Material {
  let byKey = tinted.get(library)
  if (!byKey) tinted.set(library, (byKey = new Map()))
  const key = `${base}:${color}`
  let entry = byKey.get(key)
  if (!entry) {
    const material = library[base].clone() as MeshPhysicalMaterial
    material.color.set(color)
    material.name = key
    byKey.set(key, (entry = { material, users: 0 }))
  }
  entry.users++
  return entry.material
}

function releaseTint(library: MaterialLibrary, material: Material) {
  const byKey = tinted.get(library)
  const entry = byKey?.get(material.name)
  if (!entry || --entry.users > 0) return
  byKey!.delete(material.name)
  material.dispose()
}

/** Variante teñida de un material de la librería (p. ej. lacado con el color corporativo). */
export function useTintedMaterial(base: MaterialKey, color: string): Material {
  const library = useMaterials()
  const material = useMemo(() => acquireTint(library, base, color), [library, base, color])
  useEffect(() => () => releaseTint(library, material), [library, material])
  return material
}
