import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useRoom } from '../../store'
import { CREW, crewTime, Agent } from '../../crew'

function sample(keys: Agent['path'], t: number): [number, number] {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]]
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, x0, z0] = keys[i]
    const [t1, x1, z1] = keys[i + 1]
    if (t >= t0 && t <= t1) {
      const k = t1 === t0 ? 1 : (t - t0) / (t1 - t0)
      const e = k * k * (3 - 2 * k)
      return [x0 + (x1 - x0) * e, z0 + (z1 - z0) * e]
    }
  }
  const l = keys[keys.length - 1]
  return [l[1], l[2]]
}

const active = <T extends { t0: number; t1: number }>(list: T[], t: number) => list.find((b) => t >= b.t0 && t < b.t1)

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const x = c.getContext('2d')!
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

function Bot({ a }: { a: Agent }) {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const carry = useRef<THREE.Mesh>(null)
  const carryMat = useRef<THREE.MeshStandardMaterial>(null)
  const eyes = useRef<THREE.Group>(null)
  const glow = useMemo(glowTexture, [])
  const [say, setSay] = useState<string | null>(null)
  const [tone, setTone] = useState<string>('')
  const [hover, setHover] = useState(false)
  const station = useRoom((s) => s.station)
  const go = useRoom((s) => s.go)
  const last = useRef<string | null>(null)
  const prev = useRef(new THREE.Vector2())
  const heading = useRef(0)
  const accent = useMemo(() => new THREE.Color(a.color), [a.color])

  useFrame(({ clock }, dt) => {
    const t = crewTime()
    const [x, z] = sample(a.path, t)
    const r = root.current!
    r.position.set(x, 0, z)
    // heading from motion, or face the room when idle
    const vx = x - prev.current.x
    const vz = z - prev.current.y
    const moving = Math.hypot(vx, vz) > 0.0008
    const want = moving ? Math.atan2(vx, vz) : a.idleFacing
    let d = want - heading.current
    d = Math.atan2(Math.sin(d), Math.cos(d))
    heading.current += d * Math.min(1, dt * 7)
    r.rotation.y = heading.current
    prev.current.set(x, z)
    const ct = clock.elapsedTime
    body.current!.position.y = 0.12 + Math.sin(ct * 3 + a.seed) * 0.02
    body.current!.rotation.x = moving ? 0.16 : 0
    head.current!.rotation.y = moving ? 0 : Math.sin(ct * 0.7 + a.seed) * 0.35
    eyes.current!.scale.y = Math.sin(ct * 1.3 + a.seed * 3) > 0.985 ? 0.1 : 1
    const c = active(a.carry, t)
    carry.current!.visible = !!c
    if (c && carryMat.current) {
      carryMat.current.color.set(c.color)
      carryMat.current.emissive.set(c.color)
    }
    const b = active(a.says, t)
    const key = b ? b.text : null
    if (key !== last.current) {
      last.current = key
      setSay(key)
      setTone(b?.tone ?? '')
    }
  })

  const showBubbles = station === 'overview' || station === 'crew'
  return (
    <group ref={root} scale={1.55}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial map={glow} color={accent.clone().multiplyScalar(1.6)} transparent opacity={0.55} depthWrite={false} toneMapped={false} />
      </mesh>
      <group
        ref={body}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          e.stopPropagation()
          go('crew')
        }}
      >
        {/* body */}
        <mesh castShadow position={[0, 0.24, 0]}>
          <capsuleGeometry args={[0.12, 0.14, 8, 24]} />
          <meshPhysicalMaterial color="#f2f3f7" roughness={0.32} clearcoat={0.8} clearcoatRoughness={0.2} emissive="#ffffff" emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.125, 0.012, 10, 40]} />
          <meshBasicMaterial color={accent.clone().multiplyScalar(2.4)} toneMapped={false} />
        </mesh>
        {/* chest badge */}
        <mesh position={[0, 0.2, 0.118]}>
          <circleGeometry args={[0.035, 24]} />
          <meshBasicMaterial color={accent.clone().multiplyScalar(1.8)} toneMapped={false} />
        </mesh>
        {/* arms */}
        {[-1, 1].map((s) => (
          <mesh key={s} castShadow position={[s * 0.15, 0.22, 0.02]} rotation={[0.3, 0, s * 0.25]}>
            <capsuleGeometry args={[0.025, 0.09, 4, 10]} />
            <meshPhysicalMaterial color="#d9dce4" roughness={0.4} clearcoat={0.6} />
          </mesh>
        ))}
        {/* carried item: book or page */}
        <mesh ref={carry} position={[0, 0.2, 0.17]} rotation={[0.2, 0, 0]} castShadow visible={false}>
          <boxGeometry args={[0.14, 0.11, 0.03]} />
          <meshStandardMaterial ref={carryMat} emissiveIntensity={0.5} roughness={0.5} />
        </mesh>
        {/* head */}
        <group ref={head} position={[0, 0.5, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.12, 32, 24]} />
            <meshPhysicalMaterial color="#f4f5f8" roughness={0.3} clearcoat={1} />
          </mesh>
          <mesh position={[0, 0, 0.035]} scale={[1, 0.78, 0.8]}>
            <sphereGeometry args={[0.105, 32, 16, -Math.PI / 2.4, Math.PI / 1.2, Math.PI / 3.2, Math.PI / 2.6]} />
            <meshPhysicalMaterial color="#0b0e16" roughness={0.1} metalness={0.4} clearcoat={1} />
          </mesh>
          <group ref={eyes} position={[0, 0.005, 0.112]}>
            {[-0.035, 0.035].map((x) => (
              <mesh key={x} position={[x, 0, 0]}>
                <capsuleGeometry args={[0.011, 0.018, 4, 8]} />
                <meshBasicMaterial color={accent.clone().multiplyScalar(3)} toneMapped={false} />
              </mesh>
            ))}
          </group>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.07, 6]} />
            <meshStandardMaterial color="#9aa0ad" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.19, 0]}>
            <sphereGeometry args={[0.018, 12, 12]} />
            <meshBasicMaterial color={accent.clone().multiplyScalar(3)} toneMapped={false} />
          </mesh>
        </group>
        <pointLight position={[0, 0.5, 0.25]} color={a.color} intensity={0.6} distance={1.4} />
      </group>
      {showBubbles && (say || hover) && (
        <Html position={[0, 0.9, 0]} center zIndexRange={[12, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`bubble ${tone ? `bubble-${tone}` : ''}`} style={{ ['--agent' as string]: a.color }}>
            <span className="bubble-name">{a.name}</span>
            {say ?? a.role}
          </div>
        </Html>
      )}
    </group>
  )
}

export function AgentCrew() {
  return (
    <group>
      {CREW.map((a) => (
        <Bot key={a.id} a={a} />
      ))}
    </group>
  )
}
