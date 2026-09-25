import { Billboard, Edges, Text } from '@react-three/drei'
import { area, center, depth, width } from '../../config/geometry'
import type { StandConfig } from '../../config/types'
import { fontUrl, FONT } from '../../materials/assets'

/**
 * Volumen provisional de un stand (Fase 2): muestra parcela, altura máxima y marca
 * para validar composición e iluminación antes de construir la arquitectura real.
 */
export function StandPlaceholder({ stand }: { stand: StandConfig }) {
  const { plot, company, maxHeight } = stand
  const [cx, cz] = center(plot)
  const w = width(plot)
  const d = depth(plot)
  const { palette } = company

  return (
    <group name={`stand-${stand.id}`}>
      <mesh position={[cx, 0.05, cz]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.04, 0.1, d - 0.04]} />
        <meshStandardMaterial color={palette.paper} roughness={0.7} />
      </mesh>
      <mesh position={[cx, 0.1 + maxHeight / 2, cz]}>
        <boxGeometry args={[w - 0.1, maxHeight, d - 0.1]} />
        <meshStandardMaterial
          color={palette.primary}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
        <Edges color={palette.primary} />
      </mesh>
      <Billboard position={[cx, maxHeight + 1.1, cz]}>
        <Text
          font={fontUrl(company.font)}
          fontSize={0.62}
          color={palette.primary}
          outlineWidth={0.02}
          outlineColor={palette.paper}
          anchorX="center"
          anchorY="bottom"
        >
          {company.name}
        </Text>
        <Text
          font={FONT.ui}
          fontSize={0.2}
          color={palette.ink}
          outlineWidth={0.01}
          outlineColor={palette.paper}
          anchorX="center"
          anchorY="top"
          position={[0, -0.08, 0]}
        >
          {`${stand.code} · ${area(plot)} m² · ${stand.size} · ${stand.layout}`}
        </Text>
      </Billboard>
    </group>
  )
}
