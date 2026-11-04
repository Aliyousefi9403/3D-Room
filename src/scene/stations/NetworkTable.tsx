import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Hotspot } from '../Hotspot'
import { PL } from '../Light'
import { devices, net, DeviceId } from '../../sim/network'
import { useRoom } from '../../store'

/** Night Watch's command table: a live holographic map of the room's network. */
const R = 0.78
const IDS: DeviceId[] = ['router', 'nas', 'camera', 'speaker', 'laptop']
const NAMES: Record<DeviceId, string> = { router: 'Router', nas: 'NAS', camera: 'Camera', speaker: 'Speaker', laptop: 'Laptop' }
// router in the middle, the rest on a ring; the internet (attacker side) sits outside
const POS: Record<DeviceId, THREE.Vector3> = {
  router: new THREE.Vector3(0, 0.34, 0),
  nas: new THREE.Vector3(-0.48, 0.24, 0.12),
  camera: new THREE.Vector3(0.36, 0.26, 0.36),
  speaker: new THREE.Vector3(0.46, 0.22, -0.2),
  laptop: new THREE.Vector3(-0.2, 0.25, -0.46),
}
const WAN = new THREE.Vector3(0, 0.62, -0.62)
const P = 70

const target = (id: string): DeviceId => (id === 'scan' ? 'router' : id === 'brute' ? 'nas' : id === 'exfil' ? 'camera' : 'speaker')

function grid() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const x = c.getContext('2d')!
  x.strokeStyle = 'rgba(110,220,255,0.5)'
  x.lineWidth = 1.2
  for (let i = 0; i <= 512; i += 32) {
    x.beginPath()
    x.moveTo(i, 0)
    x.lineTo(i, 512)
    x.stroke()
    x.beginPath()
    x.moveTo(0, i)
    x.lineTo(512, i)
    x.stroke()
  }
  const g = x.createRadialGradient(256, 256, 0, 256, 256, 256)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,1)')
  x.globalCompositeOperation = 'destination-out'
  x.fillStyle = g
  x.fillRect(0, 0, 512, 512)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Map() {
  const station = useRoom((s) => s.station)
  const tex = useMemo(grid, [])
  const nodes = useRef<Record<string, THREE.MeshBasicMaterial>>({})
  const wan = useRef<THREE.MeshBasicMaterial>(null)
  const wanMesh = useRef<THREE.Mesh>(null)
  const parts = useRef<THREE.InstancedMesh>(null)
  const label = useRef<HTMLDivElement>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const col = useMemo(() => new THREE.Color(), [])
  const edges = useMemo(() => {
    const pts: THREE.Vector3[] = []
    IDS.filter((d) => d !== 'router').forEach((d) => pts.push(POS.router, POS[d]))
    pts.push(POS.router, WAN)
    return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#5fd4ff', transparent: true, opacity: 0.45 }))
  }, [])

  useLayoutColors(parts)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const attacks = net.running.filter((r) => !net.blocked.has(r.src))
    // nodes: green ok, red pulsing on alert, amber when contained
    IDS.forEach((id) => {
      const m = nodes.current[id]
      if (!m) return
      const st = devices[id].state
      if (st === 'alert') m.color.setRGB(3.5 * (0.6 + 0.4 * Math.sin(t * 9)), 0.25, 0.35)
      else if (st === 'contained') m.color.setRGB(3, 2, 0.4)
      else m.color.setRGB(0.4, 2.6, 1.4)
    })
    if (wan.current && wanMesh.current) {
      const hot = attacks.length > 0
      wan.current.color.setRGB(hot ? 3.5 : 0.5, hot ? 0.3 : 0.8, hot ? 0.4 : 1.6)
      wanMesh.current.scale.setScalar(hot ? 1 + Math.sin(t * 8) * 0.25 : 1)
    }
    // packets: normal traffic between router and devices; attack traffic from the internet in red
    const m = parts.current!
    for (let k = 0; k < P; k++) {
      const atk = attacks[k % Math.max(1, attacks.length)]
      const isAtk = !!atk && k % 3 === 0
      const dev = isAtk ? target(atk.id) : IDS[1 + (k % 4)]
      const from = isAtk ? WAN : k % 2 ? POS.router : POS[dev]
      const to = isAtk ? POS[dev] : k % 2 ? POS[dev] : POS.router
      const f = (t * (isAtk ? 0.9 : 0.45) + k * 0.173) % 1
      dummy.position.lerpVectors(from, to, f)
      if (isAtk && dev !== 'router' && f > 0.5) dummy.position.lerpVectors(POS.router, POS[dev], (f - 0.5) * 2)
      else if (isAtk && dev !== 'router') dummy.position.lerpVectors(WAN, POS.router, f * 2)
      dummy.scale.setScalar(isAtk ? 1.6 : 1)
      dummy.updateMatrix()
      m.setMatrixAt(k, dummy.matrix)
      m.setColorAt(k, isAtk ? col.setRGB(3.6, 0.3, 0.4) : col.setRGB(0.6, 2.2, 3.2))
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    if (label.current) {
      const open = net.incidents.filter((i) => i.status !== 'contained').length
      label.current.innerHTML = `<b>NIGHT WATCH</b><span>${net.counts.events} events</span><span class="${open ? 'dn' : 'up'}">${open ? open + ' open' : 'all clear'}</span>`
    }
  })

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <circleGeometry args={[R, 64]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} color={[1.2, 1.7, 2.2]} depthWrite={false} />
      </mesh>
      <primitive object={edges} />
      {IDS.map((id) => (
        <group key={id} position={POS[id]}>
          <mesh>
            <octahedronGeometry args={[id === 'router' ? 0.06 : 0.045, 0]} />
            <meshBasicMaterial ref={(r) => r && (nodes.current[id] = r)} toneMapped={false} />
          </mesh>
          <mesh position={[0, -POS[id].y / 2, 0]}>
            <cylinderGeometry args={[0.003, 0.003, POS[id].y, 4]} />
            <meshBasicMaterial color={[0.4, 1.2, 1.8]} transparent opacity={0.5} toneMapped={false} />
          </mesh>
          {station === 'crew' && (
            <Html center position={[0, 0.09, 0]} style={{ pointerEvents: 'none' }}>
              <span className="node-tag">
                {NAMES[id]} · {devices[id].ip}
              </span>
            </Html>
          )}
        </group>
      ))}
      <mesh ref={wanMesh} position={WAN}>
        <icosahedronGeometry args={[0.055, 1]} />
        <meshBasicMaterial ref={wan} wireframe toneMapped={false} />
      </mesh>
      {station === 'crew' && (
        <Html center position={[WAN.x, WAN.y + 0.1, WAN.z]} style={{ pointerEvents: 'none' }}>
          <span className="node-tag">Internet</span>
        </Html>
      )}
      <instancedMesh ref={parts} args={[undefined, undefined, P]}>
        <sphereGeometry args={[0.011, 6, 6]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <Html center position={[0, 0.98, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={label} className="holo-tag" />
      </Html>
    </group>
  )
}

/** Instance colours must exist before the first render so the shader includes them. */
function useLayoutColors(ref: React.RefObject<THREE.InstancedMesh>) {
  const done = useRef(false)
  useFrame(() => {
    if (done.current || !ref.current) return
    const c = new THREE.Color(1, 1, 1)
    for (let i = 0; i < P; i++) ref.current.setColorAt(i, c)
    ref.current.material && ((ref.current.material as THREE.Material).needsUpdate = true)
    done.current = true
  }, -1)
}

export function NetworkTable() {
  return (
    <Hotspot id="crew" label={[1.7, 2.15, 0.7]}>
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
          <Map />
          <mesh>
            <sphereGeometry args={[R + 0.04, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color="#bfe8ff" transparent opacity={0.07} roughness={0.02} metalness={0.1} clearcoat={1} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
        <PL position={[0, 1.4, 0]} color="#5fd4ff" intensity={4} distance={3.2} />
      </group>
    </Hotspot>
  )
}
