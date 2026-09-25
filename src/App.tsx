import { Experience } from './scene/Experience'
import { LoadingScreen } from './ui/LoadingScreen'
import { Overlay } from './ui/Overlay'

export function App() {
  return (
    <main className="app">
      <Experience />
      <Overlay />
      <LoadingScreen />
    </main>
  )
}
