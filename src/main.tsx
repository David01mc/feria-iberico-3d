import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { FAIR } from './config/fair'
import { validateFair } from './config/validate'
import { preloadScene } from './scene/preload'
import './styles.css'

if (import.meta.env.DEV) {
  const issues = validateFair(FAIR)
  if (issues.length > 0) console.warn('[feria] La configuración tiene incidencias:', issues)
}

// Todos los assets en paralelo desde el arranque, antes de que React empiece a suspender.
preloadScene()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
