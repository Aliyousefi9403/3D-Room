import { Component, ReactNode, lazy, Suspense, useState } from 'react'
import { Interface } from './ui/Interface'
import { FlatSite } from './ui/FlatSite'
import { Reader } from './ui/Reader'

// the 3D bundle only loads when it can actually run
const Experience = lazy(() => import('./scene/Experience').then((m) => ({ default: m.Experience })))

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

class Guard extends Component<{ onCrash: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onCrash()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function App() {
  const [mode, setMode] = useState<'3d' | 'no-webgl' | 'chosen' | 'crashed'>(() => {
    if (new URLSearchParams(location.search).has('2d')) return 'chosen'
    return hasWebGL() ? '3d' : 'no-webgl'
  })
  if (mode !== '3d')
    return (
      <>
        <FlatSite reason={mode} />
        <Reader />
      </>
    )
  return (
    <>
      <div className="stage">
        <Guard onCrash={() => setMode('crashed')}>
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </Guard>
      </div>
      <Interface />
    </>
  )
}
