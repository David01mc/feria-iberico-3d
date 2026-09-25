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
import { ToneMappingMode } from 'postprocessing'
import type { QualityPreset } from './quality'

/**
 * Cadena de postproceso del "look" de la feria:
 * oclusión ambiental (contacto) → bloom de luminarias → AgX → gradación suave → viñeta → SMAA.
 */
export function PostFX({ preset }: { preset: QualityPreset }) {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false} stencilBuffer={false}>
      <N8AO
        enabled={preset.ao}
        quality={preset.aoQuality}
        halfRes={preset.aoHalfRes}
        aoRadius={1.2}
        distanceFalloff={0.6}
        intensity={2.2}
        color="#1c1510"
      />
      {preset.bloom ? (
        <Bloom
          mipmapBlur
          luminanceThreshold={1}
          luminanceSmoothing={0.2}
          intensity={0.55}
          radius={0.7}
        />
      ) : (
        <></>
      )}
      <ToneMapping mode={ToneMappingMode.AGX} />
      <HueSaturation saturation={0.12} />
      <BrightnessContrast contrast={0.08} />
      <Vignette offset={0.3} darkness={0.4} />
      <SMAA />
    </EffectComposer>
  )
}
