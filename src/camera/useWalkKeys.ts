import { useEffect, useRef } from 'react'

export interface WalkKeys {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  run: boolean
}

/** `event.code` es físico: WASD funciona igual en teclados QWERTY españoles y AZERTY. */
const BINDINGS: Record<string, keyof WalkKeys> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'run',
  ShiftRight: 'run',
}

const released = (): WalkKeys => ({ forward: false, back: false, left: false, right: false, run: false })

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/** Estado de las teclas de paseo en un ref (se lee en cada frame sin re-renderizar). */
export function useWalkKeys() {
  const keys = useRef<WalkKeys>(released())

  useEffect(() => {
    const onKey = (pressed: boolean) => (event: KeyboardEvent) => {
      const action = BINDINGS[event.code]
      if (!action || isTyping(event.target)) return
      keys.current[action] = pressed
      if (event.code.startsWith('Arrow')) event.preventDefault()
    }
    const down = onKey(true)
    const up = onKey(false)
    const reset = () => (keys.current = released())
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', reset)
    }
  }, [])

  return keys
}
