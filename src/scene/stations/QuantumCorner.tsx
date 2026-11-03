import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Hotspot } from '../Hotspot'
import { qubit, measure } from '../../sim/qubit'
import { useRoom } from '../../store'

const POS: [number, number, number] = [3.2, 0, -0.4]

function Bloch() {
  const arrow = useRef<THREE.Group>(null)
  const tip = useRef<THREE.MeshBasicMaterial>(null)
  const flash = useRef<THREE.Mesh>(null)
  const station = useRoom((s) => s.station)
  const [hover, setHover] = useState(false)
  const pts = useMemo(() => new Float32Array(90 * 3), [])
  const head = useRef(0)
  const rings = useMemo(
    () =>
      [0, 1, 2].map((k) => {
        const g = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 97 }, (_, i) => {
          const a = (i / 96) * Math.PI * 2
          return k === 0 ? new THREE.Vector3(Math.cos(a), 0, Math.sin(a)) : k === 1 ? new THREE.Vector3(Math.cos(a), Math.sin(a), 0) : new THREE.Vector3(0, Math.sin(a), Math.cos(a))
        }))
        return g
      }),
    [],
  )
  const trailGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3))
    return g
  }, [pts])
  const trailObj = useMemo(() => new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: '#c79bff', transparent: true, opacity: 0.6 })), [trailGeo])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    if (qubit.evolve && !qubit.collapsed) qubit.phi += dt * 0.8
    let th = qubit.theta
    let ph = qubit.phi
    const c = qubit.collapsed
    if (c) {
      th = c.to === 0 ? 0 : Math.PI
      const age = performance.now() / 1000 - c.at
      if (flash.current) {
        flash.current.visible = age < 0.5
        flash.current.position.set(0, c.to === 0 ? 1 : -1, 0)
        flash.current.scale.setScalar(0.2 + age * 2)
      }
      if (age > 1.6) qubit.collapsed = null
    }
    const a = arrow.current!
    // physics convention: z up on the Bloch sphere → three.js y up
    const target = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph))
    const cur = new THREE.Vector3(0, 1, 0).applyQuaternion(a.quaternion)
    cur.lerp(target, c ? 0.35 : 0.15).normalize()
    a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cur)
    tip.current?.color.setRGB(1 + Math.sin(t * 3) * 0.3 + 1.5, 1.2, 3.2)
    // precession trail
    const i = head.current++ % 90
    pts.set([cur.x, cur.y, cur.z], i * 3)
    trailGeo.attributes.position.needsUpdate = true
    trailGeo.setDrawRange(0, Math.min(head.current, 90))
  })

  const interactive = station === 'quantum'
  return (
    <group
      position={[0, 1.18, 0]}
      scale={0.3}
      onPointerOver={(e) => interactive && (e.stopPropagation(), setHover(true), (document.body.style.cursor = 'pointer'))}
      onPointerOut={() => (setHover(false), (document.body.style.cursor = ''))}
      onClick={(e) => interactive && (e.stopPropagation(), measure(1))}
    >
      <mesh>
        <sphereGeometry args={[1, 48, 32]} />
        <meshPhysicalMaterial color="#9fc4ff" transparent opacity={hover ? 0.16 : 0.09} roughness={0.05} clearcoat={1} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {rings.map((g, k) => (
        <lineLoop key={k} geometry={g}>
          <lineBasicMaterial color={k === 0 ? '#8fb3ff' : '#4a5a80'} transparent opacity={0.7} />
        </lineLoop>
      ))}
      {[
        [0, 1.25, 0, '|0⟩'],
        [0, -1.25, 0, '|1⟩'],
        [1.3, 0, 0, '|+⟩'],
      ].map(([x, y, z, l]) => (
        <Html key={l as string} position={[x as number, y as number, z as number]} center style={{ pointerEvents: 'none' }}>
          <span className="ket">{l}</span>
        </Html>
      ))}
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 2.3, 6]} />
        <meshBasicMaterial color="#334" />
      </mesh>
      <group ref={arrow}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.9, 12]} />
          <meshBasicMaterial color={[2.2, 1.5, 3.4]} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <coneGeometry args={[0.07, 0.16, 16]} />
          <meshBasicMaterial ref={tip} toneMapped={false} />
        </mesh>
      </group>
      <primitive object={trailObj} />
      <mesh ref={flash} visible={false}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={[4, 3, 6]} transparent opacity={0.5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 0]} color="#9a7bff" intensity={1.5} distance={2.5} />
    </group>
  )
}

/** Newton's cradle: click to swing. */
function Cradle() {
  const balls = useRef<THREE.Group[]>([])
  const st = useRef({ a: 0.5, w: 0 })
  const station = useRoom((s) => s.station)
  useFrame((_, dt) => {
    const s = st.current
    // energy passes through: left ball swings in, right ball swings out
    s.w += dt * 5.2
    const amp = s.a
    const ph = Math.sin(s.w)
    s.a = Math.max(0, s.a - dt * 0.012)
    balls.current.forEach((b, i) => {
      if (!b) return
      b.rotation.z = i === 0 ? Math.min(0, ph) * amp : i === 4 ? Math.max(0, ph) * amp : 0
    })
  })
  return (
    <group
      position={[-0.2, 0.78, 0.12]}
      rotation={[0, 0.5, 0]}
      onClick={(e) => station === 'quantum' && (e.stopPropagation(), (st.current.a = 0.6))}
    >
      {[-1, 1].map((z) =>
        [-1, 1].map((x) => (
          <mesh key={`${x}${z}`} position={[x * 0.12, 0.09, z * 0.05]}>
            <cylinderGeometry args={[0.004, 0.004, 0.18, 6]} />
            <meshStandardMaterial color="#c0c4cc" metalness={1} roughness={0.2} />
          </mesh>
        )),
      )}
      {[-1, 1].map((z) => (
        <mesh key={z} position={[0, 0.18, z * 0.05]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.004, 0.004, 0.24, 6]} />
          <meshStandardMaterial color="#c0c4cc" metalness={1} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[0.28, 0.01, 0.14]} />
        <meshStandardMaterial color="#0d0f14" metalness={0.4} roughness={0.3} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} ref={(g) => g && (balls.current[i] = g)} position={[-0.08 + i * 0.04, 0.18, 0]}>
          <mesh position={[0, -0.06, 0.025]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.0015, 0.0015, 0.12, 4]} />
            <meshBasicMaterial color="#888" />
          </mesh>
          <mesh position={[0, -0.06, -0.025]} rotation={[-0.4, 0, 0]}>
            <cylinderGeometry args={[0.0015, 0.0015, 0.12, 4]} />
            <meshBasicMaterial color="#888" />
          </mesh>
          <mesh position={[0, -0.12, 0]} castShadow>
            <sphereGeometry args={[0.02, 24, 16]} />
            <meshStandardMaterial color="#e6e8ee" metalness={1} roughness={0.08} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Top() {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }, dt) => {
    if (!ref.current) return
    ref.current.rotation.y += dt * 18
    const t = clock.elapsedTime
    ref.current.rotation.x = Math.sin(t * 1.3) * 0.08
    ref.current.rotation.z = Math.cos(t * 1.3) * 0.08
  })
  return (
    <group position={[0.22, 0.78, -0.1]}>
      <group ref={ref}>
        <mesh position={[0, 0.03, 0]} castShadow>
          <coneGeometry args={[0.035, 0.05, 24]} />
          <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.012, 24]} />
          <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.085, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.04, 8]} />
          <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  )
}

export function QuantumCorner() {
  return (
    <Hotspot id="quantum" label={[POS[0], 1.85, POS[2]]}>
      <group position={POS}>
        {/* round side table */}
        <mesh castShadow receiveShadow position={[0, 0.76, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.035, 48]} />
          <meshPhysicalMaterial color="#1c1f27" metalness={0.3} roughness={0.25} clearcoat={1} />
        </mesh>
        <mesh castShadow position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.76, 12]} />
          <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh castShadow position={[0, 0.012, 0]}>
          <cylinderGeometry args={[0.22, 0.25, 0.025, 32]} />
          <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.25} />
        </mesh>
        {/* sphere plinth */}
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.05, 32]} />
          <meshStandardMaterial color="#0b0d12" metalness={0.6} roughness={0.3} />
        </mesh>
        <Bloch />
        <Cradle />
        <Top />
      </group>
    </Hotspot>
  )
}
