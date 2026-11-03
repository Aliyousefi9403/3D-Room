import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Hotspot } from '../Hotspot'

const N = 160
const R = 0.78

/** A small boids flock living inside a glass dome. */
function Flock() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const state = useMemo(() => {
    const p = new Float32Array(N * 3)
    const v = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.random() * R * 0.7
      p.set([Math.cos(a) * r, 0.15 + Math.random() * 0.5, Math.sin(a) * r], i * 3)
      v.set([(Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.4], i * 3)
    }
    return { p, v }
  }, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const fwd = useMemo(() => new THREE.Vector3(), [])

  useLayoutEffect(() => {
    const m = mesh.current!
    const c = new THREE.Color()
    for (let i = 0; i < N; i++) {
      c.setHSL(0.52 + Math.random() * 0.1, 0.9, 0.6).multiplyScalar(i % 23 === 0 ? 0 : 2.2)
      if (i % 23 === 0) c.setRGB(3, 0.5, 0.6) // a few "byzantine" agents
      m.setColorAt(i, c)
    }
    m.instanceColor!.needsUpdate = true
  }, [])

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const { p, v } = state
    const t = clock.elapsedTime
    const goal = [Math.cos(t * 0.4) * 0.35, 0.42 + Math.sin(t * 0.7) * 0.12, Math.sin(t * 0.5) * 0.35]
    for (let i = 0; i < N; i++) {
      let cx = 0, cy = 0, cz = 0, ax = 0, ay = 0, az = 0, sx = 0, sy = 0, sz = 0, n = 0
      const ix = i * 3
      for (let j = 0; j < N; j++) {
        if (i === j) continue
        const jx = j * 3
        const dx = p[jx] - p[ix], dy = p[jx + 1] - p[ix + 1], dz = p[jx + 2] - p[ix + 2]
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 < 0.04) {
          n++
          cx += dx; cy += dy; cz += dz
          ax += v[jx]; ay += v[jx + 1]; az += v[jx + 2]
          if (d2 < 0.004) {
            sx -= dx / (d2 + 1e-4); sy -= dy / (d2 + 1e-4); sz -= dz / (d2 + 1e-4)
          }
        }
      }
      if (n) {
        v[ix] += (cx / n) * 0.9 * dt + (ax / n - v[ix]) * 1.2 * dt + sx * 0.0008
        v[ix + 1] += (cy / n) * 0.9 * dt + (ay / n - v[ix + 1]) * 1.2 * dt + sy * 0.0008
        v[ix + 2] += (cz / n) * 0.9 * dt + (az / n - v[ix + 2]) * 1.2 * dt + sz * 0.0008
      }
      v[ix] += (goal[0] - p[ix]) * 0.25 * dt
      v[ix + 1] += (goal[1] - p[ix + 1]) * 0.25 * dt
      v[ix + 2] += (goal[2] - p[ix + 2]) * 0.25 * dt
      // dome containment
      const rr = Math.hypot(p[ix], p[ix + 1], p[ix + 2])
      if (rr > R * 0.9) {
        v[ix] -= (p[ix] / rr) * dt * 2
        v[ix + 1] -= (p[ix + 1] / rr) * dt * 2
        v[ix + 2] -= (p[ix + 2] / rr) * dt * 2
      }
      if (p[ix + 1] < 0.08) v[ix + 1] += dt * 1.5
      const sp = Math.hypot(v[ix], v[ix + 1], v[ix + 2])
      const max = 0.55, min = 0.22
      const k = sp > max ? max / sp : sp < min ? min / (sp + 1e-5) : 1
      v[ix] *= k; v[ix + 1] *= k; v[ix + 2] *= k
      p[ix] += v[ix] * dt
      p[ix + 1] += v[ix + 1] * dt
      p[ix + 2] += v[ix + 2] * dt
      dummy.position.set(p[ix], p[ix + 1], p[ix + 2])
      fwd.set(p[ix] + v[ix], p[ix + 1] + v[ix + 1], p[ix + 2] + v[ix + 2])
      dummy.lookAt(fwd)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    }
    mesh.current!.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N]}>
      <coneGeometry args={[0.012, 0.045, 5]} onUpdate={(g) => g.rotateX(Math.PI / 2)} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

function GridDisc() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 512
    const x = c.getContext('2d')!
    x.clearRect(0, 0, 512, 512)
    x.strokeStyle = 'rgba(110,220,255,0.55)'
    x.lineWidth = 1.5
    for (let r = 40; r < 256; r += 36) (x.beginPath(), x.arc(256, 256, r, 0, Math.PI * 2), x.stroke())
    for (let a = 0; a < 24; a++) {
      x.beginPath()
      x.moveTo(256, 256)
      x.lineTo(256 + Math.cos((a / 24) * Math.PI * 2) * 250, 256 + Math.sin((a / 24) * Math.PI * 2) * 250)
      x.stroke()
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => ref.current && (ref.current.rotation.z += dt * 0.05))
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
      <circleGeometry args={[R, 64]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} color={[1.4, 1.8, 2.2]} depthWrite={false} />
    </mesh>
  )
}

export function SwarmTable() {
  return (
    <Hotspot id="swarm" label={[1.7, 2.05, 0.7]}>
      <group position={[1.7, 0, 0.7]}>
        {/* pedestal */}
        <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.55, 0.7, 0.84, 64]} />
          <meshStandardMaterial color="#10131a" metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh castShadow position={[0, 0.86, 0]}>
          <cylinderGeometry args={[0.95, 0.95, 0.05, 64]} />
          <meshStandardMaterial color="#0b0e14" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.885, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 0.94, 96]} />
          <meshBasicMaterial color={[0.6, 2.4, 3.2]} toneMapped={false} />
        </mesh>
        <group position={[0, 0.89, 0]}>
          <GridDisc />
          <Flock />
          <mesh>
            <sphereGeometry args={[R + 0.04, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color="#bfe8ff" transparent opacity={0.1} roughness={0.02} metalness={0.1} clearcoat={1} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
        <pointLight position={[0, 1.4, 0]} color="#5fd4ff" intensity={4} distance={3.2} />
      </group>
    </Hotspot>
  )
}
