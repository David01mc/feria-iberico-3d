import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { PerspectiveCamera, Vector2, Vector3 } from 'three'
import { WALK_SPAWN } from '../config/colliders'
import type { Rect } from '../config/types'
import { useAppStore } from '../state/store'
import { moveWithCollisions, type Vec2 } from './collision'
import { useWalkKeys } from './useWalkKeys'

const EYE_HEIGHT = 1.65
const BODY_RADIUS = 0.3
const WALK_SPEED = 2.2
const RUN_SPEED = 4.6
/** Rapidez con la que la velocidad alcanza la deseada (aceleración y frenado suaves). */
const RESPONSE = 9
const WALK_FOV = 62
const BOB_AMPLITUDE = 0.022
const BOB_FREQUENCY = 1.9

/** Última posición del paseo: al volver a entrar se retoma donde se dejó. */
let lastPose: { position: Vec2; yaw: number } | null = null

const UP = new Vector3(0, 1, 0)

/**
 * Paseo en primera persona: WASD / flechas para andar, Mayús para correr, ratón para mirar
 * (tras hacer clic, con Pointer Lock). Colisiona con muros y stands en planta.
 */
export function WalkControls({ colliders }: { colliders: Rect[] }) {
  const camera = useThree((s) => s.camera)
  const setPointerLocked = useAppStore((s) => s.setPointerLocked)
  const keys = useWalkKeys()

  const velocity = useRef(new Vector2())
  const bobPhase = useRef(0)
  const scratch = useRef({ forward: new Vector3(), right: new Vector3(), wish: new Vector2() })

  useEffect(() => {
    const cam = camera as PerspectiveCamera
    const previousFov = cam.fov
    cam.fov = WALK_FOV
    cam.updateProjectionMatrix()

    const [x, z] = lastPose?.position ?? WALK_SPAWN.position
    cam.position.set(x, EYE_HEIGHT, z)
    cam.rotation.order = 'YXZ'
    if (lastPose) {
      cam.rotation.set(0, lastPose.yaw, 0)
    } else {
      cam.lookAt(WALK_SPAWN.lookAt[0], EYE_HEIGHT - 0.1, WALK_SPAWN.lookAt[1])
    }
    // Solo en desarrollo: pruebas visuales automáticas del paseo.
    if (import.meta.env.DEV) Object.assign(window, { __walkCamera: cam })

    return () => {
      lastPose = { position: [cam.position.x, cam.position.z], yaw: cam.rotation.y }
      cam.fov = previousFov
      cam.updateProjectionMatrix()
    }
  }, [camera])

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    const k = keys.current
    const { forward, right, wish } = scratch.current

    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    right.crossVectors(forward, UP)

    const ahead = Number(k.forward) - Number(k.back)
    const side = Number(k.right) - Number(k.left)
    wish.set(forward.x * ahead + right.x * side, forward.z * ahead + right.z * side)
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(k.run ? RUN_SPEED : WALK_SPEED)

    velocity.current.lerp(wish, 1 - Math.exp(-RESPONSE * dt))
    const v = velocity.current
    const [x, z] = moveWithCollisions(
      [camera.position.x, camera.position.z],
      [v.x * dt, v.y * dt],
      BODY_RADIUS,
      colliders,
    )

    const speed = v.length()
    bobPhase.current += speed * dt * BOB_FREQUENCY * Math.PI
    const bob = Math.sin(bobPhase.current) * BOB_AMPLITUDE * Math.min(1, speed / WALK_SPEED)
    camera.position.set(x, EYE_HEIGHT + bob, z)
  })

  return (
    <PointerLockControls
      makeDefault
      selector="#walk-lock, canvas.scene"
      onLock={() => setPointerLocked(true)}
      onUnlock={() => setPointerLocked(false)}
    />
  )
}
