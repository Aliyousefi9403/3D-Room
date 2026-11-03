import { ReactNode, useState } from 'react'
import { Html } from '@react-three/drei'
import { Select } from '@react-three/postprocessing'
import { useRoom, StationId, stations } from '../store'

/** Wraps a station: hover outline + label in overview, click to fly in. */
export function Hotspot({ id, children, label }: { id: Exclude<StationId, 'overview'>; children: ReactNode; label: [number, number, number] }) {
  const station = useRoom((s) => s.station)
  const go = useRoom((s) => s.go)
  const setHovered = useRoom((s) => s.setHovered)
  const [hover, setHover] = useState(false)
  const active = station === 'overview'
  const meta = stations.find((s) => s.id === id)!
  return (
    <group
      onPointerOver={(e) => {
        if (!active) return
        e.stopPropagation()
        setHover(true)
        setHovered(id)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHover(false)
        setHovered(null)
        document.body.style.cursor = ''
      }}
      onClick={(e) => {
        if (!active) return
        e.stopPropagation()
        setHover(false)
        setHovered(null)
        document.body.style.cursor = ''
        go(id)
      }}
    >
      <Select enabled={active && hover}>{children}</Select>
      {active && (
        <Html position={label} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`beacon ${hover ? 'is-hover' : ''}`}>
            <span className="beacon-dot" />
            <span className="beacon-card">
              <span className="beacon-kicker">{meta.kicker}</span>
              <span className="beacon-label">{meta.label}</span>
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}
