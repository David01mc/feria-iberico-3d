import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  N8AO,
  SMAA,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { useThree } from '@react-three/fiber'
import { ToneMappingMode } from 'postprocessing'
import { useEffect } from 'react'
import { AgXToneMapping, NoToneMapping } from 'three'
import type { QualityPreset } from './quality'

/**
 * Cadena de postproceso del "look" de la feria:
 * oclusión ambiental (contacto) → bloom de luminarias → AgX → gradación suave → viñeta → SMAA.
 * En `ligero` se quita la oclusión (la pasada más cara); en `ninguno` no hay composer y el
 * propio renderer aplica AgX al pintar, sin ninguna pasada a pantalla completa.
 */
export function PostFX({ preset }: { preset: QualityPreset }) {
  if (preset.post === 'ninguno') return <RendererToneMapping />
  return (
    <EffectComposer multisampling={0} enableNormalPass={false} stencilBuffer={false}>
      {preset.post === 'completo' ? (
        <N8AO
          quality={preset.aoQuality}
          halfRes={preset.aoHalfRes}
          aoRadius={1.2}
          distanceFalloff={0.6}
          intensity={2.2}
          color="#1c1510"
        />
      ) : (
        <></>
      )}
      <Bloom
        mipmapBlur
        luminanceThreshold={1}
        luminanceSmoothing={0.2}
        intensity={0.55}
        radius={0.7}
      />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <HueSaturation saturation={0.12} />
      <BrightnessContrast contrast={0.08} />
      <Vignette offset={0.3} darkness={0.4} />
      <SMAA />
    </EffectComposer>
  )
}

/** Sin composer: AgX en el renderer (el lienzo es `flat`, así que hay que activarlo aquí). */
function RendererToneMapping() {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    gl.toneMapping = AgXToneMapping
    gl.toneMappingExposure = 1.05
    invalidate()
    return () => {
      gl.toneMapping = NoToneMapping
      gl.toneMappingExposure = 1
    }
  }, [gl, invalidate])
  return null
}
