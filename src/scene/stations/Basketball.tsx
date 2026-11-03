import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Hotspot } from '../Hotspot'
import { Spot } from '../Spot'
import { canvasTexture } from '../textures'
import { useRoom } from '../../store'

const RIM: [number, number, number] = [5.0, 3.05, -4.38]
const BALL_R = 0.12
const RACK: [number, number, number] = [5.95, 0, -3.0]

function ballTexture() {
  return canvasTexture(1024, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#d2601f')
    g.addColorStop(1, '#b44d14')
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
    for (let i = 0; i < 30000; i++) {
      c.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`
      c.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    }
    c.strokeStyle = '#1a0c05'
    c.lineWidth = 9
    c.beginPath()
    c.moveTo(0, h / 2)
    c.lineTo(w, h / 2)
    c.stroke()
    for (const x of [w / 4, (3 * w) / 4]) {
      c.beginPath()
      c.moveTo(x, 0)
      c.lineTo(x, h)
      c.stroke()
    }
    for (const x of [0, w / 2]) {
      c.beginPath()
      c.ellipse(x + w / 4, h / 2, w / 5.2, h / 2, 0, 0, Math.PI * 2)
      c.stroke()
    }
  })
}

function Hoop() {
  const board = useMemo(
    () =>
      canvasTexture(512, 300, (c, w, h) => {
        c.fillStyle = 'rgba(240,246,255,0.18)'
        c.fillRect(0, 0, w, h)
        c.strokeStyle = '#f4f6fb'
        c.lineWidth = 10
        c.strokeRect(6, 6, w - 12, h - 12)
        c.strokeRect(w / 2 - 80, h - 150, 160, 120)
      }),
    [],
  )
  const netGeo = useMemo(() => new THREE.CylinderGeometry(0.23, 0.14, 0.42, 16, 5, true), [])
  return (
    <group>
      <mesh position={[RIM[0], RIM[1] + 0.5, -4.86]} castShadow>
        <boxGeometry args={[1.8, 1.05, 0.03]} />
        <meshPhysicalMaterial map={board} transparent roughness={0.05} metalness={0} clearcoat={1} color="#ffffff" />
      </mesh>
      <mesh position={[RIM[0], RIM[1] - 0.02, -4.75]}>
        <boxGeometry args={[0.3, 0.2, 0.2]} />
        <meshStandardMaterial color="#c43b1e" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={RIM} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.23, 0.012, 12, 48]} />
        <meshStandardMaterial color="#e2481e" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh geometry={netGeo} position={[RIM[0], RIM[1] - 0.22, RIM[2]]}>
        <meshBasicMaterial color="#f2f2f2" wireframe transparent opacity={0.75} />
      </mesh>
    </group>
  )
}

function Jersey() {
  const profile = { name: 'YOUSEFI' }
  const tex = useMemo(
    () =>
      canvasTexture(512, 640, (c, w, h) => {
        // frame matte
        c.fillStyle = '#efe9df'
        c.fillRect(0, 0, w, h)
        // jersey silhouette
        c.fillStyle = '#12306b'
        c.beginPath()
        c.moveTo(150, 90)
        c.quadraticCurveTo(256, 150, 362, 90)
        c.lineTo(420, 110)
        c.lineTo(400, 240)
        c.lineTo(395, 560)
        c.lineTo(117, 560)
        c.lineTo(112, 240)
        c.lineTo(92, 110)
        c.closePath()
        c.fill()
        c.strokeStyle = '#d9b35b'
        c.lineWidth = 10
        c.stroke()
        c.fillStyle = '#fff'
        c.font = '700 44px Inter, sans-serif'
        c.textAlign = 'center'
        c.fillText(profile.name, 256, 250)
        c.font = '800 150px Inter, sans-serif'
        c.fillStyle = '#d9b35b'
        c.fillText('#', 256, 420)
        c.fillStyle = '#7a6f60'
        c.font = '500 22px Inter, sans-serif'
        c.fillText('NATIONAL TEAM', 256, 610)
      }),
    [profile.name],
  )
  return (
    <group position={[6.95, 2.2, -2.5]} rotation={[0, -Math.PI / 2, 0]}>
      <RoundedBox args={[1.0, 1.24, 0.05]} radius={0.01} castShadow>
        <meshStandardMaterial color="#1b130c" roughness={0.4} metalness={0.2} />
      </RoundedBox>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.86, 1.08]} />
        <meshStandardMaterial map={tex} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[0.86, 1.08]} />
        <meshPhysicalMaterial transparent opacity={0.08} roughness={0} clearcoat={1} />
      </mesh>
    </group>
  )
}

function CourtKey() {
  const tex = useMemo(
    () =>
      canvasTexture(1024, 1024, (c, w, h) => {
        c.clearRect(0, 0, w, h)
        c.strokeStyle = 'rgba(245,240,230,0.85)'
        c.lineWidth = 10
        // paint area (lane) from the baseline (top edge)
        c.fillStyle = 'rgba(160,48,30,0.55)'
        c.fillRect(w / 2 - 200, 0, 400, 640)
        c.strokeRect(w / 2 - 200, 0, 400, 640)
        c.beginPath()
        c.arc(w / 2, 640, 200, 0, Math.PI)
        c.stroke()
        c.setLineDash([30, 24])
        c.beginPath()
        c.arc(w / 2, 640, 200, Math.PI, 0)
        c.stroke()
      }),
    [],
  )
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5.0, 0.007, -3.3]}>
      <planeGeometry args={[3.4, 3.4]} />
      <meshStandardMaterial map={tex} transparent roughness={0.5} depthWrite={false} />
    </mesh>
  )
}

type Shot = { t: number; made: boolean; from: THREE.Vector3; done: boolean }

function Balls() {
  const tex = useMemo(ballTexture, [])
  const station = useRoom((s) => s.station)
  const shot = useRoom((s) => s.shot)
  const ball = useRef<THREE.Mesh>(null)
  const [hover, setHover] = useState(false)
  const s = useRef<Shot | null>(null)
  const vel = useRef(new THREE.Vector3())
  const home = useMemo(() => new THREE.Vector3(RACK[0], 0.95, RACK[2]), [])

  useFrame((_, dtRaw) => {
    const m = ball.current
    if (!m) return
    const dt = Math.min(dtRaw, 0.04)
    const cur = s.current
    if (!cur) {
      m.position.lerp(home, 0.2)
      m.rotation.y += dt * 0.3
      return
    }
    cur.t += dt
    const T = 1.05
    if (cur.t <= T) {
      // parabolic flight to just above the rim (or off the front of it on a miss)
      const k = cur.t / T
      const end = new THREE.Vector3(RIM[0] + (cur.made ? 0 : 0.18), RIM[1] + 0.02, RIM[2] + (cur.made ? 0 : 0.21))
      m.position.lerpVectors(cur.from, end, k)
      m.position.y += Math.sin(k * Math.PI) * 1.25
      m.rotation.x -= dt * 9
      if (cur.t + dt > T) vel.current.set(cur.made ? 0 : 0.9, cur.made ? -1.2 : 1.0, cur.made ? 0.05 : 1.6)
    } else {
      const v = vel.current
      v.y -= 9.8 * dt
      m.position.addScaledVector(v, dt)
      m.rotation.x -= dt * 5
      if (m.position.y < BALL_R) {
        m.position.y = BALL_R
        v.y = Math.abs(v.y) * 0.62
        v.x *= 0.8
        v.z *= 0.8
        if (Math.abs(v.y) < 0.4 && !cur.done) {
          cur.done = true
          setTimeout(() => (s.current = null), 500)
        }
      }
      // keep inside the room
      m.position.x = Math.min(6.8, m.position.x)
      m.position.z = Math.max(-4.8, m.position.z)
    }
  })

  const shoot = () => {
    if (s.current || !ball.current) return
    const made = Math.random() < 0.72
    s.current = { t: 0, made, from: ball.current.position.clone(), done: false }
    setTimeout(() => shot(made), 1050)
  }

  const interactive = station === 'basketball'
  return (
    <group>
      {/* rack */}
      <group position={RACK}>
        {[-0.25, 0.25].map((z) => (
          <mesh key={z} castShadow position={[0, 0.42, z]}>
            <boxGeometry args={[0.04, 0.84, 0.04]} />
            <meshStandardMaterial color="#1b1f29" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {[0.82, 0.165].map((y) => (
          <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.03, 0.56]} />
            <meshStandardMaterial color="#1b1f29" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {[-0.14, 0.14].map((z) => (
          <mesh key={z} castShadow position={[0, 0.3, z]}>
            <sphereGeometry args={[BALL_R, 48, 32]} />
            <meshStandardMaterial map={tex} roughness={0.75} />
          </mesh>
        ))}
      </group>
      <mesh
        ref={ball}
        castShadow
        position={home}
        onPointerOver={(e) => {
          if (!interactive) return
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          if (interactive) document.body.style.cursor = ''
        }}
        onClick={(e) => {
          if (!interactive) return
          e.stopPropagation()
          shoot()
        }}
      >
        <sphereGeometry args={[BALL_R, 48, 32]} />
        <meshStandardMaterial map={tex} roughness={0.75} emissive="#ff7a2e" emissiveIntensity={interactive && hover ? 0.35 : 0} />
      </mesh>
    </group>
  )
}

export function Basketball() {
  return (
    <Hotspot id="basketball" label={[5.0, 4.0, -4.3]}>
      <group>
        <Hoop />
        <Jersey />
        <CourtKey />
        <Balls />
        <Spot position={[4.4, 4.1, -1.0]} target={[5.0, 2.6, -4.6]} angle={0.55} penumbra={0.7} intensity={22} distance={8} color="#ffe1b8" castShadow={false} />
      </group>
    </Hotspot>
  )
}
