import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { FAIR } from './config/fair'
import { validateFair } from './config/validate'
import './styles.css'

if (import.meta.env.DEV) {
  const issues = validateFair(FAIR)
  if (issues.length > 0) console.warn('[feria] La configuración tiene incidencias:', issues)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
