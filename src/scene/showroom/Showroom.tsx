import { Text } from '@react-three/drei'
import { useMemo, type ReactNode } from 'react'
import { SphereGeometry } from 'three'
import { FONT } from '../../materials/assets'
import { boxProjectUV, type Vec3 } from '../../materials/geometry'
import { MATERIAL_KEYS, useMaterials } from '../../materials/library'
import { BoxTruss, TrussFrame } from '../props/BoxTruss'
import { MODEL_KEYS, MODELS, type ModelKey } from '../props/catalog'
import { Counter } from '../props/Counter'
import { LightBox } from '../props/LightBox'
import { Platform } from '../props/Platform'
import { Prop } from '../props/Prop'
import { Shelving } from '../props/Shelving'
import { Spotlight } from '../props/Spotlight'

/** Vista inicial del muestrario. */
export const SHOWROOM_VIEW: { position: Vec3; target: Vec3 } = {
  position: [0, 7.5, 17],
  target: [0, 0.6, 1.5],
}

/** Rótulo en el suelo delante de cada pieza. */
function Label({ position, children }: { position: Vec3; children: string }) {
  return (
    <Text
      font={FONT.ui}
      fontSize={0.13}
      color="#4a4640"
      anchorX="center"
      anchorY="middle"
      position={position}
      rotation-x={-Math.PI / 2}
      maxWidth={1.6}
      textAlign="center"
    >
      {children}
    </Text>
  )
}

function Row({ title, z, children }: { title: string; z: number; children: ReactNode }) {
  return (
    <group position={[0, 0, z]}>
      <Text
        font={FONT.uiBold}
        fontSize={0.2}
        letterSpacing={0.12}
        color="#1f2b24"
        anchorX="left"
        anchorY="middle"
        position={[-11, 0.002, -1.3]}
        rotation-x={-Math.PI / 2}
      >
        {title.toUpperCase()}
      </Text>
      {children}
    </group>
  )
}

/** Mobiliario de catálogo en hilera. Los de Blender llevan un mostrador debajo si van en sobremesa. */
const COUNTERTOP: Partial<Record<ModelKey, boolean>> = { vitrinaCaliente: true, freidora: true, jamonero: true }

function MaterialSwatches() {
  const library = useMaterials()
  const spheres = useMemo(() => {
    const cache = new Map<number, SphereGeometry>()
    return (tile: number) => {
      let g = cache.get(tile)
      if (!g) cache.set(tile, (g = boxProjectUV(new SphereGeometry(0.32, 48, 32), tile)))
      return g
    }
  }, [])
  const spacing = 0.95
  const start = -((MATERIAL_KEYS.length - 1) * spacing) / 2
  return (
    <>
      {MATERIAL_KEYS.map((key, i) => {
        const material = library[key]
        const x = start + i * spacing
        return (
          <group key={key} position={[x, 0, 0]}>
            <mesh
              geometry={spheres((material.userData.tile as number) ?? 1)}
              material={material}
              position={[0, 0.34, 0]}
              castShadow={!material.userData.noShadow}
              receiveShadow
            />
            <Label position={[0, 0.003, 0.55]}>{key}</Label>
          </group>
        )
      })}
    </>
  )
}

/**
 * Muestrario (`/?muestrario`): todo el mobiliario reutilizable y la librería de materiales en un
 * plató neutro. Sirve para la revisión visual y como catálogo para el cliente.
 */
export function Showroom() {
  const blender = MODEL_KEYS.filter((k) => MODELS[k].source === 'blender')
  const polyhaven = MODEL_KEYS.filter((k) => MODELS[k].source === 'polyhaven')

  return (
    <group name="showroom">
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[24, 96]} />
        <meshStandardMaterial color="#d9d5cd" roughness={0.85} />
      </mesh>

      <Row title="Mobiliario paramétrico (código)" z={-4.5}>
        <Counter width={1.6} position={[-8.5, 0, 0]} />
        <Label position={[-8.5, 0.003, 0.75]}>Mostrador lacado · roble</Label>
        <Counter width={1.4} body="tiles" top="darkWood" position={[-6, 0, 0]} />
        <Label position={[-6, 0.003, 0.75]}>Mostrador azulejo · nogal</Label>
        <Shelving width={1.2} height={2} shelves={5} position={[-3.6, 0, 0]} back="plaster" />
        <Label position={[-3.6, 0.003, 0.75]}>Estantería rústica</Label>
        <Platform width={2.4} depth={1.6} position={[-0.6, 0, 0]} />
        <Label position={[-0.6, 0.003, 1.2]}>Tarima con remate de aluminio</Label>
        <TrussFrame width={2.6} depth={1.8} height={2.9} position={[3.2, 0, 0]} />
        <Spotlight position={[2.3, 2.6, -0.9]} target={[3.2, 0, 0]} intensity={30} />
        <Spotlight position={[4.1, 2.6, -0.9]} target={[3.2, 0, 0]} intensity={30} />
        <Spotlight position={[3.2, 2.6, 0.9]} target={[3.2, 0.8, -0.4]} light={false} />
        <Label position={[3.2, 0.003, 1.3]}>Pórtico de truss · focos 3000 K</Label>
        <BoxTruss from={[6.2, 0.15, 0]} to={[8.2, 0.15, 0]} />
        <Label position={[7.2, 0.003, 0.6]}>Truss 29 cm</Label>
        <LightBox width={1.6} height={0.9} position={[9.8, 1.3, 0]}>
          <Text font={FONT.display} fontSize={0.22} color="#5a1a1f" anchorX="center" anchorY="middle">
            Caja de luz
          </Text>
        </LightBox>
        <Label position={[9.8, 0.003, 0.75]}>Caja de luz textil</Label>
      </Row>

      <Row title="Mobiliario a medida (Blender)" z={-0.5}>
        {blender.map((key, i) => {
          const x = -6.6 + i * 3.3
          const onCounter = COUNTERTOP[key]
          return (
            <group key={key} position={[x, 0, 0]}>
              {onCounter && <Counter width={1.1} depth={0.7} body="steelBrushed" top="steelBrushed" />}
              <Prop model={key} position={[0, onCounter ? 1.05 : 0, 0]} brandColor="#a3261b" />
              <Label position={[0, 0.003, 0.9]}>{MODELS[key].label}</Label>
            </group>
          )
        })}
        <Prop model="vitrinaRefrigerada" position={[6.6 + 1.5, 0, 0]} brandColor="#1f2b24" />
        <Label position={[8.1, 0.003, 0.9]}>Vitrina con color de marca</Label>
      </Row>

      <Row title="Atrezo CC0 (Poly Haven)" z={3.2}>
        {polyhaven.map((key, i) => {
          const x = -9.1 + i * 1.4
          return (
            <group key={key} position={[x, 0, 0]}>
              <Prop model={key} />
              <Label position={[0, 0.003, 0.6]}>{MODELS[key].label}</Label>
            </group>
          )
        })}
      </Row>

      <Row title="Librería de materiales" z={6.4}>
        <MaterialSwatches />
      </Row>
    </group>
  )
}
