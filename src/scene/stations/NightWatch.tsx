import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useRoom } from '../../store'
import { bots, stepCrew, crew, pingLog, Bot as BotT } from '../../sim/crew'
import { ball, stepBall, shoot, solveShot, RIM, BALL_R, onScore } from '../../sim/ball'
import { devices, stepNetwork, DeviceId } from '../../sim/network'
import { canvasTexture } from '../textures'

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

function Bot({ b }: { b: BotT }) {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Mesh>(null)
  const armR = useRef<THREE.Mesh>(null)
  const glow = useMemo(glowTexture, [])
  const [say, setSay] = useState<BotT['say']>(null)
  const [hover, setHover] = useState(false)
  const station = useRoom((s) => s.station)
  const go = useRoom((s) => s.go)
  const accent = useMemo(() => new THREE.Color(b.color), [b.color])

  useFrame(({ clock }, dt) => {
    const r = root.current!
    r.position.set(b.pos.x, 0, b.pos.y)
    const sp = b.vel.length()
    if (sp > 0.05) {
      const want = Math.atan2(b.vel.x, b.vel.y)
      let d = want - b.heading
      d = Math.atan2(Math.sin(d), Math.cos(d))
      b.heading += d * Math.min(1, dt * 8)
    }
    r.rotation.y = b.heading
    const t = clock.elapsedTime
    body.current!.position.y = 0.12 + Math.sin(t * 3 + b.seed) * 0.02
    body.current!.rotation.x = Math.min(0.3, sp * 0.12)
    head.current!.rotation.y = sp > 0.1 ? 0 : Math.sin(t * 0.7 + b.seed) * 0.4
    eyes.current!.scale.y = Math.sin(t * 1.3 + b.seed * 3) > 0.985 ? 0.1 : 1
    const dribble = b.hasBall ? Math.sin(t * 9) * 0.5 : 0
    armR.current!.rotation.x = 0.3 + dribble
    armL.current!.rotation.x = 0.3 + (b.task === 'respond' ? Math.sin(t * 6) * 0.3 : 0)
    if (b.say !== say) setSay(b.say)
  })

  const show = station === 'overview' || station === 'crew' || station === 'basketball'
  return (
    <group ref={root} scale={1.5}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial map={glow} color={accent.clone().multiplyScalar(1.6)} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
      </mesh>
      <group
        ref={body}
        onPointerOver={(e) => (e.stopPropagation(), setHover(true), (document.body.style.cursor = 'pointer'))}
        onPointerOut={() => (setHover(false), (document.body.style.cursor = ''))}
        onClick={(e) => (e.stopPropagation(), go('crew'))}
      >
        <mesh castShadow position={[0, 0.24, 0]}>
          <capsuleGeometry args={[0.12, 0.14, 8, 24]} />
          <meshPhysicalMaterial color="#f2f3f7" roughness={0.32} clearcoat={0.8} clearcoatRoughness={0.2} emissive="#ffffff" emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.125, 0.012, 10, 40]} />
          <meshBasicMaterial color={accent.clone().multiplyScalar(2.4)} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.2, 0.118]}>
          <circleGeometry args={[0.035, 24]} />
          <meshBasicMaterial color={accent.clone().multiplyScalar(1.8)} toneMapped={false} />
        </mesh>
        <mesh ref={armL} castShadow position={[-0.15, 0.24, 0.02]} rotation={[0.3, 0, -0.25]}>
          <capsuleGeometry args={[0.025, 0.09, 4, 10]} />
          <meshPhysicalMaterial color="#d9dce4" roughness={0.4} clearcoat={0.6} />
        </mesh>
        <mesh ref={armR} castShadow position={[0.15, 0.24, 0.02]} rotation={[0.3, 0, 0.25]}>
          <capsuleGeometry args={[0.025, 0.09, 4, 10]} />
          <meshPhysicalMaterial color="#d9dce4" roughness={0.4} clearcoat={0.6} />
        </mesh>
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
      </group>
      {show && (say || hover) && (
        <Html position={[0, 0.92, 0]} center zIndexRange={[12, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`bubble ${say?.tone ? `bubble-${say.tone}` : ''}`} style={{ ['--agent' as string]: b.color }}>
            <span className="bubble-name">
              {b.name} · {b.role}
            </span>
            {say?.text ?? b.blurb}
          </div>
        </Html>
      )}
    </group>
  )
}

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
    for (const x of [w / 4, (3 * w) / 4]) (c.beginPath(), c.moveTo(x, 0), c.lineTo(x, h), c.stroke())
    for (const x of [0, w / 2]) (c.beginPath(), c.ellipse(x + w / 4, h / 2, w / 5.2, h / 2, 0, 0, Math.PI * 2), c.stroke())
  })
}

/** The shared ball. In the Court station: press on it, pull back, release. */
function Ball() {
  const tex = useMemo(ballTexture, [])
  const mesh = useRef<THREE.Mesh>(null)
  const dots = useRef<THREE.InstancedMesh>(null)
  const station = useRoom((s) => s.station)
  const setDragging = useRoom((s) => s.setDragging)
  const shot = useRoom((s) => s.shot)
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const drag = useRef<{ x0: number; y0: number; x: number; y: number } | null>(null)
  const [hover, setHover] = useState(false)
  const hand = useMemo(() => new THREE.Vector3(), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const interactive = station === 'basketball'

  useEffect(() => {
    const off = onScore((s) => s === 'user' && shot(true))
    return () => void off()
  }, [shot])

  const launchVel = (dx: number, dy: number) => {
    // pull back (drag down) for power, sideways to aim
    const ideal = solveShot(hand, RIM.clone().add(new THREE.Vector3(0, 0.02, 0.04)), 0.75 + Math.hypot(RIM.x - hand.x, RIM.z - hand.z) * 0.16)
    const power = THREE.MathUtils.clamp(dy / 170, 0.35, 1.5)
    const v = ideal.multiplyScalar(0.55 + power * 0.45)
    const yaw = -dx * 0.0022
    const c = Math.cos(yaw)
    const s = Math.sin(yaw)
    return new THREE.Vector3(v.x * c - v.z * s, v.y, v.x * s + v.z * c)
  }

  useEffect(() => {
    const el = gl.domElement
    const move = (e: PointerEvent) => {
      if (!drag.current) return
      drag.current.x = e.clientX
      drag.current.y = e.clientY
    }
    const up = () => {
      const d = drag.current
      if (!d) return
      drag.current = null
      setDragging(false)
      const dy = d.y - d.y0
      const dx = d.x - d.x0
      if (dy < 12) {
        ball.holder = 'free'
        return
      }
      shoot('user', launchVel(dx, dy), hand.clone())
      setTimeout(() => useRoom.getState().shot(false, true), 50)
    }
    el.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  })

  useFrame((_, dt) => {
    const m = mesh.current!
    if (ball.holder === 'user') {
      // hold the ball in front of the camera, offset toward the hoop
      const dir = new THREE.Vector3()
      camera.getWorldDirection(dir)
      hand.copy(camera.position).addScaledVector(dir, 1.6)
      hand.y = Math.max(hand.y - 0.45, 0.9)
      const d = drag.current
      if (d) hand.y -= Math.min(0.25, (d.y - d.y0) / 900)
      ball.pos.copy(hand)
      ball.vel.set(0, 0, 0)
    }
    m.position.copy(ball.pos)
    const sp = ball.vel.length()
    if (sp > 0.02) m.rotateOnWorldAxis(new THREE.Vector3(ball.vel.z, 0, -ball.vel.x).normalize(), (sp * dt) / BALL_R)
    // trajectory preview
    const inst = dots.current!
    const d = drag.current
    inst.visible = !!d && d.y - d.y0 > 12
    if (inst.visible && d) {
      const v = launchVel(d.x - d.x0, d.y - d.y0)
      const p = hand.clone()
      for (let i = 0; i < 24; i++) {
        for (let k = 0; k < 3; k++) {
          v.y -= 9.81 * 0.02
          p.addScaledVector(v, 0.02)
        }
        dummy.position.copy(p)
        dummy.scale.setScalar(1 - i / 30)
        dummy.updateMatrix()
        inst.setMatrixAt(i, dummy.matrix)
      }
      inst.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <mesh
        ref={mesh}
        castShadow
        onPointerOver={(e) => interactive && (e.stopPropagation(), setHover(true), (document.body.style.cursor = 'grab'))}
        onPointerOut={() => (setHover(false), interactive && (document.body.style.cursor = ''))}
        onPointerDown={(e) => {
          if (!interactive || ball.holder.length > 4 && ball.holder !== 'free') return
          e.stopPropagation()
          ball.holder = 'user'
          drag.current = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY }
          setDragging(true)
          document.body.style.cursor = 'grabbing'
        }}
      >
        <sphereGeometry args={[BALL_R, 48, 32]} />
        <meshStandardMaterial map={tex} roughness={0.75} emissive="#ff7a2e" emissiveIntensity={interactive && hover ? 0.4 : 0} />
      </mesh>
      <instancedMesh ref={dots} args={[undefined, undefined, 24]} visible={false}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshBasicMaterial color={[3, 2, 1]} toneMapped={false} transparent opacity={0.8} />
      </instancedMesh>
    </>
  )
}

function DeviceMesh({ id }: { id: DeviceId }) {
  const d = devices[id]
  const led = useRef<THREE.MeshBasicMaterial>(null)
  const ring = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const c = d.state === 'alert' ? [4 * (0.5 + 0.5 * Math.sin(t * 10)), 0.2, 0.3] : d.state === 'contained' ? [3, 2, 0.3] : [0.3, 2.6, 1.2]
    led.current?.color.setRGB(c[0], c[1], c[2])
    if (ring.current) {
      ring.current.visible = d.state === 'alert'
      const s = 1 + ((t * 1.5) % 1) * 2.5
      ring.current.scale.setScalar(s)
      ;(ring.current.material as THREE.MeshBasicMaterial).opacity = 1 - ((t * 1.5) % 1)
    }
  })
  const shape =
    id === 'router' ? (
      <group rotation={[0, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.08, 0.2]} />
          <meshStandardMaterial color="#14171e" metalness={0.5} roughness={0.4} />
        </mesh>
        {[-0.15, 0.15].map((x) => (
          <mesh key={x} position={[x, 0.14, -0.04]}>
            <cylinderGeometry args={[0.008, 0.008, 0.22, 6]} />
            <meshStandardMaterial color="#14171e" />
          </mesh>
        ))}
      </group>
    ) : id === 'nas' ? (
      <mesh castShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[0.3, 0.5, 0.4]} />
        <meshStandardMaterial color="#1b1f29" metalness={0.6} roughness={0.35} />
      </mesh>
    ) : id === 'camera' ? (
      <group rotation={[0.4, -Math.PI / 2 - 0.6, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.06, 0.16, 6, 16]} />
          <meshStandardMaterial color="#e8e9ee" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.13, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          <meshStandardMaterial color="#05060a" roughness={0.1} metalness={0.5} />
        </mesh>
      </group>
    ) : id === 'speaker' ? (
      <mesh castShadow position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.22, 32]} />
        <meshStandardMaterial color="#2a2f3a" roughness={0.9} />
      </mesh>
    ) : null
  const ledPos: [number, number, number] = id === 'router' ? [0.16, 0, 0.101] : id === 'nas' ? [0.1, 0.42, 0.201] : id === 'camera' ? [0, 0.1, 0.04] : id === 'speaker' ? [0, 0.225, 0] : [0, 0.25, 0]
  return (
    <group position={d.pos}>
      {shape}
      <mesh position={ledPos}>
        <sphereGeometry args={[0.018, 10, 10]} />
        <meshBasicMaterial ref={led} toneMapped={false} />
      </mesh>
      <mesh ref={ring} position={ledPos} visible={false}>
        <ringGeometry args={[0.1, 0.12, 40]} />
        <meshBasicMaterial color={[4, 0.3, 0.4]} transparent toneMapped={false} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function NightWatch() {
  const station = useRoom((s) => s.station)
  useEffect(() => {
    pingLog()
    if (location.search.includes('debug')) Object.assign(window, { __sim: { bots, net: devices, ball, crew } })
  }, [])
  useEffect(() => {
    crew.userAtCourt = station === 'basketball'
    if (station === 'basketball' && ball.holder !== 'user' && ball.pos.distanceTo(new THREE.Vector3(5.95, 0.95, -3)) > 0.3 && ball.holder !== 'free') ball.holder = 'free'
  }, [station])
  useFrame((_, dt) => {
    const t = performance.now() / 1000
    stepNetwork(t, dt)
    // sub-step so slow devices move at the same real-time speed
    let rem = Math.min(dt, 0.5)
    while (rem > 1e-4) {
      const h = Math.min(rem, 0.05)
      stepCrew(t, h)
      stepBall(h, t)
      rem -= h
    }
  })
  return (
    <group>
      {bots.map((b) => (
        <Bot key={b.id} b={b} />
      ))}
      <Ball />
      {(['router', 'nas', 'camera', 'speaker'] as DeviceId[]).map((id) => (
        <DeviceMesh key={id} id={id} />
      ))}
    </group>
  )
}
