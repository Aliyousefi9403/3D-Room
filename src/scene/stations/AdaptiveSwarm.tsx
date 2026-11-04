import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Hotspot } from '../Hotspot'
import { PL } from '../Light'
import { feeds, read, startMarket, isLive, ago } from '../../market'
import { useRoom } from '../../store'

export const SWARM_POS: [number, number, number] = [-3.8, 0, 3.55]
const R = 0.5
const N = 140

/**
 * A boids flock that adapts to the live Bitcoin market: when the indicators
 * read bullish it tightens and glows green, when bearish it scatters and turns red.
 */
function Flock() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const lite = useRoom((s) => s.lite)
  const n = lite ? 80 : N
  const state = useMemo(() => {
    const p = new Float32Array(N * 3)
    const v = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.random() * R * 0.6
      p.set([Math.cos(a) * r, 0.12 + Math.random() * 0.3, Math.sin(a) * r], i * 3)
      v.set([(Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3], i * 3)
    }
    return { p, v }
  }, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const fwd = useMemo(() => new THREE.Vector3(), [])
  const col = useMemo(() => new THREE.Color(), [])
  const mood = useRef(0)

  useLayoutEffect(() => {
    const m = mesh.current!
    for (let i = 0; i < N; i++) m.setColorAt(i, col.setRGB(1, 1, 1))
    m.instanceColor!.needsUpdate = true
  }, [col])

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const { p, v } = state
    const t = clock.elapsedTime
    // market mood −1..1 from the live indicator read
    const r = read(feeds['BTC-USD'])
    mood.current += ((r?.score ?? 0) - mood.current) * Math.min(1, dt * 0.8)
    const s = mood.current
    const cohesion = 0.6 + s * 0.5 // bullish: tighter
    const jitter = 0.08 + Math.max(0, -s) * 0.6 // bearish: nervous
    const goal = [Math.cos(t * 0.4) * 0.2, 0.26 + Math.sin(t * 0.7) * 0.06, Math.sin(t * 0.5) * 0.2]
    for (let i = 0; i < n; i++) {
      const ix = i * 3
      let cx = 0, cy = 0, cz = 0, ax = 0, ay = 0, az = 0, sx = 0, sy = 0, sz = 0, k = 0
      for (let j = 0; j < n; j += 2) {
        if (i === j) continue
        const jx = j * 3
        const dx = p[jx] - p[ix], dy = p[jx + 1] - p[ix + 1], dz = p[jx + 2] - p[ix + 2]
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 < 0.025) {
          k++
          cx += dx; cy += dy; cz += dz
          ax += v[jx]; ay += v[jx + 1]; az += v[jx + 2]
          if (d2 < 0.002) (sx -= dx / (d2 + 1e-4)), (sy -= dy / (d2 + 1e-4)), (sz -= dz / (d2 + 1e-4))
        }
      }
      if (k) {
        v[ix] += (cx / k) * cohesion * dt + (ax / k - v[ix]) * dt + sx * 0.0006
        v[ix + 1] += (cy / k) * cohesion * dt + (ay / k - v[ix + 1]) * dt + sy * 0.0006
        v[ix + 2] += (cz / k) * cohesion * dt + (az / k - v[ix + 2]) * dt + sz * 0.0006
      }
      v[ix] += (goal[0] - p[ix]) * 0.3 * cohesion * dt + (Math.random() - 0.5) * jitter * dt * 6
      v[ix + 1] += (goal[1] - p[ix + 1]) * 0.3 * dt
      v[ix + 2] += (goal[2] - p[ix + 2]) * 0.3 * cohesion * dt + (Math.random() - 0.5) * jitter * dt * 6
      const rr = Math.hypot(p[ix], p[ix + 1], p[ix + 2])
      if (rr > R * 0.88) for (let a = 0; a < 3; a++) v[ix + a] -= (p[ix + a] / rr) * dt * 2
      if (p[ix + 1] < 0.06) v[ix + 1] += dt * 1.5
      const sp = Math.hypot(v[ix], v[ix + 1], v[ix + 2])
      const max = 0.42 + Math.max(0, -s) * 0.2
      const f = sp > max ? max / sp : sp < 0.15 ? 0.15 / (sp + 1e-5) : 1
      v[ix] *= f; v[ix + 1] *= f; v[ix + 2] *= f
      p[ix] += v[ix] * dt; p[ix + 1] += v[ix + 1] * dt; p[ix + 2] += v[ix + 2] * dt
      dummy.position.set(p[ix], p[ix + 1], p[ix + 2])
      fwd.set(p[ix] + v[ix], p[ix + 1] + v[ix + 1], p[ix + 2] + v[ix + 2])
      dummy.lookAt(fwd)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    }
    mesh.current!.count = n
    mesh.current!.instanceMatrix.needsUpdate = true
    // colour the whole flock by mood: green bullish, red bearish, cyan neutral
    const g = THREE.MathUtils.clamp(s, -1, 1)
    col.setRGB(g < 0 ? 0.6 - g * 2.8 : 0.5, g > 0 ? 1.6 + g * 1.4 : 1.6 + g, g < 0 ? 1.2 + g : 2.6 - g * 1.6)
    for (let i = 0; i < n; i++) mesh.current!.setColorAt(i, col)
    mesh.current!.instanceColor!.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N]}>
      <coneGeometry args={[0.01, 0.036, 5]} onUpdate={(g) => g.rotateX(Math.PI / 2)} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

/** Live BTC candles as a ribbon around the rim of the dome. */
function PriceRibbon() {
  const M = 100
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(M * 3), 3))
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(M * 3), 3))
    return g
  }, [])
  const obj = useMemo(() => new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false })), [geo])
  useFrame(({ clock }) => {
    const cs = feeds['BTC-USD'].candles
    if (cs.length < 2) return
    const n = Math.min(M, cs.length)
    const sl = cs.slice(-n)
    const lo = Math.min(...sl.map((c) => c.l))
    const hi = Math.max(...sl.map((c) => c.h))
    const pos = geo.attributes.position as THREE.BufferAttribute
    const col = geo.attributes.color as THREE.BufferAttribute
    const rot = clock.elapsedTime * 0.1
    for (let i = 0; i < M; i++) {
      const c = sl[Math.min(n - 1, Math.floor((i / (M - 1)) * (n - 1)))]
      const a = (i / (M - 1)) * Math.PI * 1.7 - Math.PI * 0.85 + rot
      pos.setXYZ(i, Math.cos(a) * (R + 0.06), 0.02 + ((c.c - lo) / (hi - lo || 1)) * 0.16, Math.sin(a) * (R + 0.06))
      const up = c.c >= c.o
      col.setXYZ(i, up ? 0.4 : 3.5, up ? 3 : 0.4, up ? 1.6 : 0.6)
    }
    pos.needsUpdate = true
    col.needsUpdate = true
  })
  return <primitive object={obj} />
}

function Readout() {
  const el = useRef<HTMLDivElement>(null)
  useFrame(() => {
    const f = feeds['BTC-USD']
    const r = read(f)
    if (!el.current) return
    const s = r?.score ?? 0
    el.current.innerHTML = `<b>BTC $${f.last ? f.last.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '…'}</b><span class="${s >= 0 ? 'up' : 'dn'}">${s >= 0 ? '▲ bullish' : '▼ bearish'} ${Math.abs(s * 100).toFixed(0)}</span><em>${isLive(f) ? 'live · ' + ago(f) + 's' : f.status === 'simulated' ? 'sim' : 'stale'}</em>`
  })
  return (
    <Html center position={[0, 0.78, 0]} style={{ pointerEvents: 'none' }}>
      <div ref={el} className="holo-tag" />
    </Html>
  )
}

export function AdaptiveSwarm() {
  useEffect(startMarket, [])
  return (
    <Hotspot id="swarm" label={[SWARM_POS[0], 1.75, SWARM_POS[2]]}>
      <group position={SWARM_POS}>
        <mesh castShadow receiveShadow position={[0, 0.36, 0]}>
          <cylinderGeometry args={[0.24, 0.34, 0.72, 48]} />
          <meshStandardMaterial color="#141019" metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh castShadow position={[0, 0.74, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 0.04, 64]} />
          <meshStandardMaterial color="#0d0b12" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.762, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.58, 0.61, 96]} />
          <meshBasicMaterial color={[2.2, 1.2, 3.2]} toneMapped={false} />
        </mesh>
        <group position={[0, 0.765, 0]}>
          <Flock />
          <PriceRibbon />
          <mesh>
            <sphereGeometry args={[R + 0.02, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color="#e2c8ff" transparent opacity={0.09} roughness={0.02} clearcoat={1} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <Readout />
        </group>
        <PL position={[0, 1.3, 0]} color="#b48cff" intensity={3} distance={2.6} />
      </group>
    </Hotspot>
  )
}
