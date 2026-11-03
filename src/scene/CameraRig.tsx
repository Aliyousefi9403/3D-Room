import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRoom, StationId } from '../store'

type View = { pos: [number, number, number]; target: [number, number, number] }

export const views: Record<StationId, View> = {
  overview: { pos: [0.6, 6.4, 12.2], target: [0, 1.2, -0.6] },
  library: { pos: [-2.6, 2.2, 0.75], target: [-4.25, 1.75, -4.6] },
  quant: { pos: [-2.6, 2.6, 5.6], target: [-3.0, 1.05, 1.4] },
  rag: { pos: [-1.6, 2.3, 0.6], target: [-6.4, 1.45, -1.05] },
  rv: { pos: [0.6, 2.1, 1.6], target: [0.6, 1.9, -4.9] },
  swarm: { pos: [1.7, 3.0, 4.1], target: [1.7, 1.15, 0.7] },
  basketball: { pos: [2.6, 2.3, 1.3], target: [5.2, 2.15, -4.3] },
  crew: { pos: [0.4, 6.8, 7.4], target: [0.6, 0.6, -1.2] },
  window: { pos: [3.7, 2.0, 0.55], target: [8.0, 2.35, 0.3] },
  quantum: { pos: [2.05, 1.75, 0.95], target: [3.2, 1.08, -0.4] },
  studio: { pos: [-3.5, 2.05, 2.85], target: [-6.9, 1.85, 2.6] },
  about: { pos: [4.2, 2.5, 5.3], target: [4.7, 0.9, 2.3] },
}

export function CameraRig() {
  const ref = useRef<CameraControls>(null)
  const station = useRoom((s) => s.station)
  const openPanel = useRoom((s) => s.openPanel)
  const dragging = useRoom((s) => s.dragging)
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const first = useRef(true)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const v = views[station]
    const narrow = size.width < 820
    const intro = first.current
    first.current = false
    if (intro) {
      // dolly in from further out on first load
      c.setLookAt(v.pos[0] + 4, v.pos[1] + 4, v.pos[2] + 8, v.target[0], v.target[1], v.target[2], false)
    }
    const dx = v.pos[0] - v.target[0]
    const dz = v.pos[2] - v.target[2]
    const dist = Math.hypot(dx, v.pos[1] - v.target[1], dz)
    // portrait screens see less horizontally, so pull back along the view ray
    const aspect = size.width / size.height
    const fov = aspect < 1 ? 58 : aspect < 1.3 ? 46 : 38
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    const pull = aspect < 1 ? (station === 'overview' ? 1.3 : 1.0) : 1
    const pos = v.pos.map((p, i) => v.target[i] + (p - v.target[i]) * pull) as [number, number, number]
    const d = dist * pull
    const off = station === 'overview' ? (narrow ? [0, d * 0.04] : [-d * 0.15, 0]) : narrow ? [0, d * 0.2] : [d * 0.24, 0]
    c.setFocalOffset(off[0], off[1], 0, !intro)
    c.setLookAt(...pos, ...v.target, true)
    if (station !== 'overview') {
      const t = setTimeout(openPanel, 650)
      return () => clearTimeout(t)
    }
  }, [station, size.width, size.height, openPanel, camera])

  const overview = station === 'overview'
  const v = views[station]
  const az = Math.atan2(v.pos[0] - v.target[0], v.pos[2] - v.target[2])
  return (
    <CameraControls
      ref={ref}
      makeDefault
      enabled={!dragging}
      smoothTime={0.55}
      draggingSmoothTime={0.2}
      minDistance={overview ? 7 : 1.4}
      maxDistance={overview ? 30 : 16}
      minAzimuthAngle={az - (overview ? 0.75 : 0.45)}
      maxAzimuthAngle={az + (overview ? 0.75 : 0.45)}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2.05}
      azimuthRotateSpeed={0.35}
      polarRotateSpeed={0.35}
      truckSpeed={0}
      dollySpeed={0.4}
    />
  )
}
