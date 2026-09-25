import { useEffect, useRef } from 'react'
import type { DirectionalLight } from 'three'

/**
 * Iluminación general del pabellón. La luz clave simula el conjunto de campanas LED de la
 * cubierta (neutra-cálida, casi cenital); el relleno frío imita el rebote de la envolvente.
 * Los stands aportarán su propia luz de acento.
 */
export function Lighting({ shadowMapSize }: { shadowMapSize: number }) {
  const key = useRef<DirectionalLight>(null)

  useEffect(() => {
    const light = key.current
    if (!light) return
    light.shadow.mapSize.set(shadowMapSize, shadowMapSize)
    // Obliga a regenerar el mapa de sombras con la nueva resolución.
    light.shadow.map?.dispose()
    light.shadow.map = null
  }, [shadowMapSize])

  return (
    <>
      <hemisphereLight args={['#e6ebf0', '#5a4d42', 0.45]} />
      <directionalLight
        ref={key}
        position={[12, 30, 8]}
        intensity={1.9}
        color="#fff1dd"
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.03}
        shadow-radius={3}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={90}
      />
      <directionalLight position={[-20, 16, -14]} intensity={0.45} color="#dde6f2" />
    </>
  )
}
