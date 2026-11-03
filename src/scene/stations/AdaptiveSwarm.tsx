import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Hotspot } from '../Hotspot'
import { feeds, read, startMarket } from '../../market'
import { useRoom } from '../../store'

const R = 0.78
const NODES = [
  { k: 'Ingest', a: 0 },
  { k: 'EMA 20/50', a: 1 },
  { k: 'RSI 14', a: 2 },
  { k: 'MACD', a: 3 },
  { k: 'Bollinger', a: 4 },
  { k: 'Volume', a: 5 },
]
const nodePos = (i: number, t = 0) => {
  const a = (i / NODES.length) * Math.PI * 2 + t * 0.15
  return new THREE.Vector3(Math.cos(a) * 0.62, 0.42 + Math.sin(a * 2 + t) * 0.04, Math.sin(a) * 0.62)
}

/** Live BTC candles as a glowing ribbon wrapped around the core. */
function PriceRibbon() {
  const line = useRef<THREE.Line>(null)
  const N = 120
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
    return g
  }, [])
  const obj = useMemo(() => new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false })), [geo])
  useFrame(({ clock }) => {
    const cs = feeds['BTC-USD'].candles
    if (cs.length < 2) return
    const n = Math.min(N, cs.length)
    const slice = cs.slice(-n)
    const lo = Math.min(...slice.map((c) => c.l))
    const hi = Math.max(...slice.map((c) => c.h))
    const pos = geo.attributes.position as THREE.BufferAttribute
    const col = geo.attributes.color as THREE.BufferAttribute
    const rot = clock.elapsedTime * 0.08
    for (let i = 0; i < N; i++) {
      const c = slice[Math.min(n - 1, Math.floor((i / (N - 1)) * (n - 1)))]
      const a = (i / (N - 1)) * Math.PI * 1.6 - Math.PI * 0.8 + rot
      const y = 0.18 + ((c.c - lo) / (hi - lo || 1)) * 0.5
      pos.setXYZ(i, Math.cos(a) * 0.36, y, Math.sin(a) * 0.36)
      const up = c.c >= c.o
      col.setXYZ(i, up ? 0.4 : 3.5, up ? 3 : 0.4, up ? 1.6 : 0.6)
    }
    pos.needsUpdate = true
    col.needsUpdate = true
    void line
  })
  return <primitive object={obj} />
}

function Graph() {
  const station = useRoom((s) => s.station)
  const nodes = useRef<THREE.Mesh[]>([])
  const core = useRef<THREE.Mesh>(null)
  const coreMat = useRef<THREE.MeshBasicMaterial>(null)
  const parts = useRef<THREE.InstancedMesh>(null)
  const edges = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NODES.length * 2 * 3), 3))
    return g
  }, [])
  const edgeObj = useMemo(() => new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#5fd4ff', transparent: true, opacity: 0.35 })), [edges])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const P = 60
  const label = useRef<HTMLDivElement>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const ep = edges.attributes.position as THREE.BufferAttribute
    const center = new THREE.Vector3(0, 0.42, 0)
    NODES.forEach((_, i) => {
      const p = nodePos(i, t)
      nodes.current[i]?.position.copy(p)
      ep.setXYZ(i * 2, p.x, p.y, p.z)
      ep.setXYZ(i * 2 + 1, center.x, center.y, center.z)
    })
    ep.needsUpdate = true
    // particles flowing from each indicator node into the model core
    for (let k = 0; k < P; k++) {
      const i = k % NODES.length
      const f = (t * 0.5 + k * 0.137) % 1
      dummy.position.lerpVectors(nodePos(i, t), center, f)
      dummy.scale.setScalar(1 - f * 0.6)
      dummy.updateMatrix()
      parts.current!.setMatrixAt(k, dummy.matrix)
    }
    parts.current!.instanceMatrix.needsUpdate = true
    // the core breathes in the colour of the live read
    const r = read(feeds['BTC-USD'])
    const s = r?.score ?? 0
    const c = new THREE.Color().setRGB(s < 0 ? 3.2 : 0.6 + (1 - s) * 0.4, s > 0 ? 3 : 1.2, 1.4 + Math.abs(s) * 0.3)
    coreMat.current?.color.copy(c)
    core.current!.scale.setScalar(1 + Math.sin(t * 3) * 0.06 + Math.abs(s) * 0.25)
    if (label.current && r) {
      const f = feeds['BTC-USD']
      label.current.innerHTML = `<b>BTC ${f.last ? f.last.toLocaleString('en-GB', { maximumFractionDigits: 0 }) : '…'}</b><span class="${s >= 0 ? 'up' : 'dn'}">${s >= 0 ? '▲' : '▼'} ${(s * 100).toFixed(0)}</span><em>${f.status}</em>`
    }
  })

  return (
    <group>
      <primitive object={edgeObj} />
      {NODES.map((n, i) => (
        <mesh key={n.k} ref={(m) => m && (nodes.current[i] = m)}>
          <icosahedronGeometry args={[0.045, 1]} />
          <meshBasicMaterial color={[0.6, 2.2, 3.2]} toneMapped={false} />
          {station === 'swarm' && (
            <Html center position={[0, 0.09, 0]} style={{ pointerEvents: 'none' }}>
              <span className="node-tag">{n.k}</span>
            </Html>
          )}
        </mesh>
      ))}
      <mesh ref={core} position={[0, 0.42, 0]}>
        <icosahedronGeometry args={[0.09, 2]} />
        <meshBasicMaterial ref={coreMat} toneMapped={false} wireframe />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.06, 24, 16]} />
        <meshBasicMaterial color={[2, 2, 2.6]} toneMapped={false} />
      </mesh>
      <instancedMesh ref={parts} args={[undefined, undefined, P]}>
        <sphereGeometry args={[0.008, 6, 6]} />
        <meshBasicMaterial color={[2.6, 3, 3.4]} toneMapped={false} />
      </instancedMesh>
      <Html center position={[0, 0.98, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={label} className="holo-tag" />
      </Html>
    </group>
  )
}

function GridDisc() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 512
    const x = c.getContext('2d')!
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

export function AdaptiveSwarm() {
  useEffect(startMarket, [])
  return (
    <Hotspot id="swarm" label={[1.7, 2.15, 0.7]}>
      <group position={[1.7, 0, 0.7]}>
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
          <PriceRibbon />
          <Graph />
          <mesh>
            <sphereGeometry args={[R + 0.04, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color="#bfe8ff" transparent opacity={0.08} roughness={0.02} metalness={0.1} clearcoat={1} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
        <pointLight position={[0, 1.4, 0]} color="#5fd4ff" intensity={4} distance={3.2} />
      </group>
    </Hotspot>
  )
}
