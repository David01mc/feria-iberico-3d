import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  type InstancedMesh,
  type Material,
  type Texture,
} from 'three'
import { standFrame } from '../../config/geometry'
import { PIELDETORO } from '../../config/layouts'
import type { StandConfig } from '../../config/types'
import type { Vec3 } from '../../materials/geometry'
import { useMaterials, useTintedMaterial } from '../../materials/library'
import type { Placement } from '../products/arrange'
import { productMeta } from '../products/catalog'
import { ProductInstances } from '../products/ProductInstances'
import { Block } from '../props/Block'
import { MODELS } from '../props/catalog'
import { Counter } from '../props/Counter'
import { Platform } from '../props/Platform'
import { Prop } from '../props/Prop'
import { Shelving, shelfLevels } from '../props/Shelving'
import { Spotlight } from '../props/Spotlight'
import { CheeseWheels, FROZEN_SIZE, FrozenBoxes, PACK_SIZE, PackInstances } from './caseta/Envases'
import { Farolillos, type Garland } from './caseta/Farolillos'
import { CasetaModule } from './caseta/Lona'
import {
  azulejoTexture,
  despensaTexture,
  logoTexture,
  onlineTexture,
  useCasetaFonts,
} from './caseta/textures'
import { StandPlacement } from './StandPlacement'

const P = PIELDETORO
const F = P.floor
const BAR_TOP = F + P.bar.height
/** Barrica de Poly Haven: altura de la tapa. */
const BARREL_TOP = F + 0.872
const SHELF = { width: 2.9, depth: 0.24, height: 2.05, shelves: 5 }
const SHELF_LEVELS = shelfLevels(SHELF.height, SHELF.shelves).map((y) => F + y)
const [SPINE_X, SPINE_Z] = P.spine.center
/** Caras de las dos estanterías espalda con espalda: norte (La Despensa) y sur (trasbarra). */
const NORTH = SPINE_Z - 0.135
const SOUTH = SPINE_Z + 0.135

/** Material emisivo con su propio mapa: lona impresa retroiluminada. */
function useLightbox(texture: () => Texture, intensity = 0.85) {
  const material = useMemo(() => {
    const map = texture()
    return new MeshStandardMaterial({
      map,
      emissiveMap: map,
      emissive: '#ffffff',
      emissiveIntensity: intensity,
      roughness: 0.6,
    })
  }, [texture, intensity])
  useEffect(() => () => material.dispose(), [material])
  return material
}

/**
 * Envases repartidos a lo largo de una balda. `face` +1 mira a la barra (sur), −1 al Pasillo
 * Norte; `depth` es el fondo del envase para dejarlo al borde de la balda.
 */
function row(count: number, y: number, face: 1 | -1, depth: number): Placement[] {
  const step = SHELF.width / count
  const z = (face > 0 ? SOUTH : NORTH) + face * (SHELF.depth / 2 - depth / 2 - 0.025)
  return Array.from({ length: count }, (_, i) => ({
    position: [SPINE_X - SHELF.width / 2 + step * (i + 0.5), y, z] as Vec3,
    rotation: [0, face > 0 ? 0 : Math.PI, 0] as Vec3,
  }))
}

/**
 * Piel de Toro · isla de 54 m²: una caseta de la Feria de Abril convertida en stand de tapas.
 * Dos módulos de lona a rayas con sus pañoletas pintadas y farolillos; El Real (veladores con
 * mantón y tablao), la barra de azulejo con la paella al fuego, La Despensa con los envases de
 * la marca hacia el Pasillo Norte y la trastienda encalada con el cubo del escudo.
 */
export function PielDeToroStand({ stand }: { stand: StandConfig }) {
  useCasetaFonts()
  const library = useMaterials()
  const { palette } = stand.company
  const { width, depth } = standFrame(stand.plot, stand.front)
  const albero = useTintedMaterial('plaster', '#dcb266')
  const ochre = useTintedMaterial('plaster', '#d59a2e')
  const green = useTintedMaterial('lacquerWhite', '#2f6b3a')
  const gold = useTintedMaterial('steelBrushed', palette.accent)
  const wine = useTintedMaterial('lacquerWhite', palette.secondary)

  const azulejo = useMemo(() => {
    const m = new MeshStandardMaterial({ map: azulejoTexture(), roughness: 0.18 })
    m.userData.tile = 0.15
    return m
  }, [])
  useEffect(() => () => azulejo.dispose(), [azulejo])
  const logo = useLightbox(logoTexture)
  const online = useLightbox(onlineTexture)
  const despensa = useLightbox(despensaTexture, 0.6)

  const garlands = useMemo<Garland[]>(() => {
    const y = P.eave - 0.12
    const [zb, , zf] = P.postZs as [number, number, number]
    const [xa, xm, xb] = P.postXs as [number, number, number]
    return [
      // Fila de la fachada bajo las pañoletas y la del costado de El Real.
      { from: [xa, y - 0.1, zf], to: [xm, y - 0.1, zf], sag: 0.22 },
      { from: [xm, y - 0.1, zf], to: [xb, y - 0.1, zf], sag: 0.22 },
      { from: [xa, y - 0.1, zb], to: [xa, y - 0.1, zf], sag: 0.3 },
      // Cruces bajo la lona de cada módulo y una fila por la cumbrera.
      ...P.modules.flatMap(([x0, x1]): Garland[] => [
        { from: [x0 + 0.05, y, zf], to: [x1 - 0.05, y, zb], sag: 0.35 },
        { from: [x1 - 0.05, y, zf], to: [x0 + 0.05, y, zb], sag: 0.35 },
        {
          from: [(x0 + x1) / 2, P.ridge - 0.15, zf],
          to: [(x0 + x1) / 2, P.ridge - 0.15, zb],
          sag: 0.45,
        },
      ]),
    ]
  }, [])

  // ── El Real: veladores, sillas y tapas servidas ──
  const tableTop = F + productMeta('velador').anchors.tablero![1]
  const real = useMemo(() => {
    const chairs: Placement[] = []
    P.tables.forEach(([tx, tz], t) => {
      for (let k = 0; k < 3; k++) {
        const a = t * 0.9 + (k * Math.PI * 2) / 3
        const dx = Math.sin(a) * P.chairRing
        const dz = Math.cos(a) * P.chairRing
        chairs.push({ position: [tx + dx, F, tz + dz], rotation: [0, Math.atan2(-dx, -dz), 0] })
      }
    })
    // Dos sillas en el tablao, mirando a la sala.
    const deck = F + P.tablao.height
    const tz = (P.tablao.z[0] + P.tablao.z[1]) / 2
    chairs.push(
      { position: [P.tablao.x[0] + 0.45, deck, tz - 0.1], rotation: [0, 0.3, 0] },
      { position: [P.tablao.x[1] - 0.45, deck, tz - 0.05], rotation: [0, -0.25, 0] },
    )
    const on = (t: number, dx: number, dz: number, r = 0): Placement => ({
      position: [P.tables[t]![0] + dx, tableTop, P.tables[t]![1] + dz],
      rotation: [0, r, 0],
    })
    return {
      chairs,
      jamon: [on(0, -0.08, 0.02, 0.4)],
      tortilla: [on(1, 0.02, -0.05, 1.2)],
      tabla: [on(2, 0, 0.02, 0.6)],
      jarra: [on(0, 0.17, -0.12), on(2, -0.19, 0.12)],
      cucurucho: [on(1, -0.17, 0.14)],
    }
  }, [tableTop])

  // ── Barra: vitrina de croquetas, tortilla y paella al fuego ──
  const [bx, bz] = P.bar.center
  const vitrina = useMemo<Vec3>(() => [bx - 0.95, BAR_TOP, bz + 0.02], [bx, bz])
  const paellero: Vec3 = [bx + 0.85, BAR_TOP, bz]
  const croquetas = useMemo<Placement[]>(() => {
    const { inferior, superior } = MODELS.vitrinaCaliente.surfaces
    return [inferior, superior].flatMap((s, level) =>
      Array.from({ length: 12 }, (_, i) => ({
        position: [
          vitrina[0] - 0.26 + (i % 6) * 0.1 + level * 0.02,
          vitrina[1] + s.center[1],
          vitrina[2] + s.center[2] - 0.07 + Math.floor(i / 6) * 0.13,
        ] as Vec3,
        rotation: [0, (i * 0.7) % 1.2, 0] as Vec3,
      })),
    )
  }, [vitrina])

  // ── La Despensa (norte) y la trasbarra (sur) ──
  const shelves = useMemo(() => {
    const [l0, l1, l2, l3, l4] = SHELF_LEVELS as [number, number, number, number, number]
    return {
      fiesta: row(10, l0, -1, PACK_SIZE.fiesta[2]),
      rolls: row(12, l1, -1, PACK_SIZE.rolls[2]),
      serrano: [...row(14, l2, -1, PACK_SIZE.serrano[2] + 0.06), ...row(12, l1, 1, 0.06)],
      gourmet: row(16, l3, -1, PACK_SIZE.gourmet[2]),
      cheese: [...row(12, l0, 1, 0.09), ...row(12, l2, 1, 0.09), ...row(12, l4, -1, 0.09)],
      jarras: row(4, l3, 1, 0.14),
      cunas: row(7, l4, 1, 0.12).map((p, i) => ({ ...p, rotation: [0, i * 0.9, 0] as Vec3 })),
    }
  }, [])

  // ── Arcón de congelados ──
  const [fx, fz] = P.freezer.center
  const frozen = useMemo(() => {
    const floor = F + MODELS.arconCongelador.surfaces.fondo.center[1]
    const kinds = ['paella', 'tortilla', 'croquetas'] as const
    const out: Record<(typeof kinds)[number], Placement[]> = {
      paella: [],
      tortilla: [],
      croquetas: [],
    }
    for (let col = 0; col < 5; col++)
      for (let r = 0; r < 3; r++)
        for (let layer = 0; layer < 3; layer++)
          out[kinds[(col + layer) % 3]!].push({
            position: [
              fx - 0.48 + col * 0.24,
              floor + layer * FROZEN_SIZE[1],
              fz - 0.17 + r * 0.17,
            ],
            rotation: [0, ((col + r + layer) % 2) * 0.05, 0],
          })
    return out
  }, [fx, fz])

  const br = P.backroom
  const brW = br.x[1] - br.x[0]
  const brD = br.z[1] - br.z[0]
  const brX = (br.x[0] + br.x[1]) / 2
  const brZ = (br.z[0] + br.z[1]) / 2
  const [cx, cz] = P.cube.center
  const cube = P.cube.size
  const finial = P.finialTop - P.ridge - 0.06

  return (
    <StandPlacement stand={stand}>
      <Platform
        width={width - 0.06}
        depth={depth - 0.06}
        height={F}
        surface={albero}
        edge="darkWood"
      />

      {/* Estructura: postes blancos y tirantes al alero. */}
      <Posts material={library.lacquerWhite} />
      {P.postZs.map((z) => (
        <Block
          key={`tirante${z}`}
          size={[P.postXs.at(-1)! - P.postXs[0]!, 0.06, 0.06]}
          position={[(P.postXs[0]! + P.postXs.at(-1)!) / 2, P.eave - 0.08, z]}
          material="lacquerWhite"
          radius={0.02}
        />
      ))}

      {/* Dos módulos de caseta con su lona, sus pañoletas y su perilla dorada. */}
      {P.modules.map(([x0, x1], i) => (
        <CasetaModule
          key={x0}
          x={[x0, x1]}
          z={P.lonaZ}
          eave={P.eave}
          ridge={P.ridge}
          band={P.panoleta.band}
          label={i === 0 ? 'Piel de Toro' : 'Tapas de España'}
        />
      ))}
      {P.modules.flatMap(([x0, x1]) =>
        [P.lonaZ[1] + 0.03, P.lonaZ[0] - 0.03].map((z) => (
          <group key={`perilla${x0}${z}`} position={[(x0 + x1) / 2, P.ridge + 0.06, z]}>
            <Block
              size={[0.03, finial - 0.1, 0.03]}
              position={[0, (finial - 0.1) / 2, 0]}
              material={gold}
            />
            <mesh position={[0, finial - 0.07, 0]} material={gold}>
              <sphereGeometry args={[0.07, 20, 14]} />
            </mesh>
          </group>
        )),
      )}
      <Farolillos garlands={garlands} />
      <Railing material={green} />

      {/* El Real: tablao con guitarra, veladores con mantón y sillas de enea. */}
      <Block
        size={[P.tablao.x[1] - P.tablao.x[0], P.tablao.height, P.tablao.z[1] - P.tablao.z[0]]}
        position={[
          (P.tablao.x[0] + P.tablao.x[1]) / 2,
          F + P.tablao.height / 2,
          (P.tablao.z[0] + P.tablao.z[1]) / 2,
        ]}
        material="oak"
      />
      <ProductInstances
        product="guitarra"
        items={[
          {
            position: [
              (P.tablao.x[0] + P.tablao.x[1]) / 2,
              F + P.tablao.height,
              P.tablao.z[0] + 0.25,
            ],
            rotation: [-0.2, 0.2, 0],
          },
        ]}
      />
      <ProductInstances
        product="velador"
        items={P.tables.map(([x, z], i) => ({ position: [x, F, z], rotation: [0, i * 0.5, 0] }))}
      />
      <ProductInstances product="sillaEnea" items={real.chairs} />
      <ProductInstances product="platoJamon" items={real.jamon} />
      <ProductInstances product="tortilla" items={real.tortilla} />
      <ProductInstances product="tablaEmbutidos" items={real.tabla} />
      <ProductInstances product="jarraRebujito" items={real.jarra} />
      <ProductInstances product="cucurucho" items={real.cucurucho} />

      {/* Barra de azulejo con showcooking. */}
      <Counter
        width={P.bar.size[0]}
        depth={P.bar.size[1]}
        height={P.bar.height}
        body={azulejo}
        top="darkWood"
        position={[bx, F, bz]}
      />
      <Prop model="vitrinaCaliente" position={vitrina} />
      <ProductInstances product="croqueta" items={croquetas} />
      <ProductInstances
        product="tortilla"
        items={[{ position: [bx - 0.1, BAR_TOP, bz + 0.05], rotation: [0, 2.4, 0] }]}
      />
      <Prop model="paellero" position={paellero} brandColor={palette.primary} />
      <ProductInstances
        product="paella"
        items={[
          {
            position: [
              paellero[0],
              paellero[1] + MODELS.paellero.surfaces.quemador.center[1],
              paellero[2],
            ],
          },
        ]}
      />
      <ProductInstances
        product="jarraRebujito"
        items={[{ position: [bx + 1.35, BAR_TOP, bz - 0.14] }]}
      />

      {/* Barriles de pie para tapear delante de la barra. */}
      {P.standTables.map(([x, z], i) => (
        <Prop key={x} model="barrica" position={[x, F, z]} rotationY={i * 1.3} />
      ))}
      <ProductInstances
        product="tablaEmbutidos"
        items={[
          {
            position: [P.standTables[0]![0], BARREL_TOP, P.standTables[0]![1]],
            rotation: [0, 0.8, 0],
          },
        ]}
      />
      <ProductInstances
        product="platoJamon"
        items={[{ position: [P.standTables[1]![0], BARREL_TOP, P.standTables[1]![1]] }]}
      />

      {/* Espina de doble cara: trasbarra al sur, La Despensa al norte. */}
      <Block
        size={[SHELF.width + 0.1, SHELF.height + 0.05, 0.03]}
        position={[SPINE_X, F + (SHELF.height + 0.05) / 2, SPINE_Z]}
        material={wine}
      />
      {[SOUTH, NORTH].map((z, i) => (
        <Shelving
          key={z}
          width={SHELF.width}
          height={SHELF.height}
          depth={SHELF.depth}
          shelves={SHELF.shelves}
          frame="darkWood"
          boards="oak"
          position={[SPINE_X, F, z]}
          rotationY={i ? Math.PI : 0}
        />
      ))}
      <PackInstances kind="fiesta" items={shelves.fiesta} />
      <PackInstances kind="rolls" items={shelves.rolls} />
      <PackInstances kind="serrano" items={shelves.serrano} />
      <PackInstances kind="gourmet" items={shelves.gourmet} />
      <CheeseWheels items={shelves.cheese} />
      <ProductInstances product="jarraRebujito" items={shelves.jarras} />
      <ProductInstances product="cunaQueso" items={shelves.cunas} />
      {/* Rótulo de La Despensa sobre la espina, a las dos caras. */}
      {[-1, 1].map((face) => (
        <group
          key={face}
          position={[SPINE_X, F + SHELF.height + 0.28, SPINE_Z]}
          rotation-y={face < 0 ? Math.PI : 0}
        >
          <Block size={[SHELF.width + 0.1, 0.52, 0.08]} material={wine} />
          <mesh material={despensa} position={[0, 0, 0.042]}>
            <planeGeometry args={[SHELF.width, 0.48]} />
          </mesh>
        </group>
      ))}

      {/* Trastienda encalada con zócalo y cornisa de albero. */}
      <Block size={[brW, br.height, brD]} position={[brX, br.height / 2, brZ]} material="plaster" />
      <Block size={[brW + 0.02, 0.4, brD + 0.02]} position={[brX, 0.2, brZ]} material={ochre} />
      <Block
        size={[brW + 0.08, 0.16, brD + 0.08]}
        position={[brX, br.height - 0.08, brZ]}
        material={ochre}
      />
      <Block size={[0.05, 2.1, 0.9]} position={[br.x[0] - 0.02, 1.05, -1.9]} material="darkWood" />
      <group position={[brX, 1.55, br.z[1] + 0.011]}>
        <Block size={[0.92, 1.56, 0.02]} position={[0, 0, -0.005]} material={gold} />
        <mesh material={online} position={[0, 0, 0.006]}>
          <planeGeometry args={[0.81, 1.44]} />
        </mesh>
      </group>
      <group position={[br.x[1] + 0.011, 1.65, brZ]} rotation-y={Math.PI / 2}>
        <Block size={[1.34, 1.34, 0.02]} position={[0, 0, -0.005]} material={gold} />
        <mesh material={logo} position={[0, 0, 0.006]}>
          <planeGeometry args={[1.24, 1.24]} />
        </mesh>
      </group>

      {/* Cubo del escudo sobre la trastienda: se ve desde todo el pabellón. */}
      <Block
        size={[0.7, P.cube.bottom - br.height, 0.7]}
        position={[cx, (br.height + P.cube.bottom) / 2, cz]}
        material="lacquerBlack"
      />
      <group position={[cx, P.cube.bottom + cube / 2, cz]}>
        <Block size={[cube, cube, cube]} material={gold} radius={0.015} />
        {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((r) => (
          <CubeFace
            key={r}
            rotationY={r}
            size={cube - 0.08}
            offset={cube / 2 + 0.003}
            material={logo}
          />
        ))}
      </group>

      {/* Geranios en la entrada de El Real, limonero y macetas azules de patio en la trastienda. */}
      {P.geraniums.map(([x, z]) => (
        <Prop key={x} model="macetaGeranios" position={[x, F, z]} rotationY={x} />
      ))}
      <Prop model="limonero" position={[P.lemonTree[0], F, P.lemonTree[1]]} rotationY={0.6} />
      {P.wallPots.north.map((x) => (
        <Prop
          key={`n${x}`}
          model="macetaGeraniosPared"
          position={[x, P.wallPots.y, br.z[0]]}
          rotationY={Math.PI}
        />
      ))}
      {P.wallPots.east.map((z) => (
        <Prop
          key={`e${z}`}
          model="macetaGeraniosPared"
          position={[br.x[1], P.wallPots.y, z]}
          rotationY={Math.PI / 2}
        />
      ))}

      {/* Arcón de congelados con las cajas de la gama. */}
      <Prop model="arconCongelador" position={[fx, F, fz]} brandColor={palette.primary} />
      <FrozenBoxes kind="paella" items={frozen.paella} />
      <FrozenBoxes kind="tortilla" items={frozen.tortilla} />
      <FrozenBoxes kind="croquetas" items={frozen.croquetas} />

      {/* Focos reales sobre la barra y El Real; apliques sobre La Despensa. */}
      <Spotlight
        position={[bx, P.eave - 0.15, bz + 0.9]}
        target={[bx, BAR_TOP, bz]}
        intensity={34}
        angle={0.8}
      />
      <Spotlight
        position={[-2.6, P.eave - 0.15, 0.9]}
        target={[-2.6, F + 0.7, 0.9]}
        intensity={30}
        angle={0.95}
      />
      {[-0.9, 0.9].map((dx) => (
        <Spotlight
          key={dx}
          position={[SPINE_X + dx, P.eave - 0.2, SPINE_Z - 1.1]}
          target={[SPINE_X + dx, F + 1.0, NORTH]}
          light={false}
        />
      ))}
    </StandPlacement>
  )
}

/** Cara luminosa del cubo: plano desplazado hacia fuera y girado hacia su lado. */
function CubeFace({
  size,
  offset,
  rotationY,
  material,
}: {
  size: number
  offset: number
  rotationY: number
  material: Material
}) {
  const geometry = useMemo(
    () => new PlaneGeometry(size, size).translate(0, 0, offset),
    [size, offset],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} material={material} rotation-y={rotationY} />
}

/** Postes redondos de la caseta, del suelo al alero (una malla instanciada). */
function Posts({ material }: { material: Material }) {
  const ref = useRef<InstancedMesh>(null)
  const height = P.eave - F
  const geometry = useMemo(
    () =>
      new CylinderGeometry(P.postRadius, P.postRadius, height, 16).translate(0, F + height / 2, 0),
    [height],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  const spots = useMemo(() => P.postXs.flatMap((x) => P.postZs.map((z) => [x, z] as const)), [])
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new Object3D()
    spots.forEach(([x, z], i) => {
      dummy.position.set(x, 0, z)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [spots])
  return (
    <instancedMesh ref={ref} args={[geometry, material, spots.length]} castShadow receiveShadow />
  )
}

const BALUSTER = 0.035
const BALUSTER_STEP = 0.12

/** Barandilla de caseta: pasamanos, larguero bajo, pilares y balaustres (instanciados). */
function Railing({ material }: { material: Material }) {
  const ref = useRef<InstancedMesh>(null)
  const height = P.railHeight
  const balusters = useMemo(
    () =>
      P.rails.flatMap(([[x0, z0], [x1, z1]]) => {
        const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / BALUSTER_STEP)
        return Array.from({ length: n - 1 }, (_, i) => {
          const t = (i + 1) / n
          return [x0 + (x1 - x0) * t, z0 + (z1 - z0) * t] as const
        })
      }),
    [],
  )
  const geometry = useMemo(
    () =>
      new BoxGeometry(BALUSTER, height - 0.14, BALUSTER).translate(
        0,
        F + 0.1 + (height - 0.14) / 2,
        0,
      ),
    [height],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new Object3D()
    balusters.forEach(([x, z], i) => {
      dummy.position.set(x, 0, z)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [balusters])

  return (
    <group name="barandilla">
      <instancedMesh
        ref={ref}
        args={[geometry, material, balusters.length]}
        castShadow
        receiveShadow
      />
      {P.rails.flatMap(([[x0, z0], [x1, z1]]) => {
        const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0)
        const length = Math.hypot(x1 - x0, z1 - z0)
        return [
          [F + height - 0.03, 0.06],
          [F + 0.1, 0.05],
        ].map(([y, h]) => (
          <Block
            key={`${x0}${z0}${y}`}
            size={alongX ? [length, h!, 0.07] : [0.07, h!, length]}
            position={[(x0 + x1) / 2, y!, (z0 + z1) / 2]}
            material={material}
            radius={0.01}
          />
        ))
      })}
      {[...new Set(P.rails.flatMap(([a, b]) => [a, b]).map(([x, z]) => `${x},${z}`))]
        .map((key) => key.split(',').map(Number) as [number, number])
        .map(([x, z]) => (
          <Block
            key={`pilar${x}${z}`}
            size={[0.08, height + 0.04, 0.08]}
            position={[x, F + (height + 0.04) / 2, z]}
            material={material}
            radius={0.01}
          />
        ))}
    </group>
  )
}
