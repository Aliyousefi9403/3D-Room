import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { canvasTexture } from '../textures'
import { useRoom } from '../../store'

export const COIL: [number, number, number] = [4.15, 0, 0.5]
const TOP = 1.32
const ARCS = 7
const SEG = 14

/** How strongly the room is surging right now (0..1), shared with the lights and the sky. */
export function surgeLevel(now = performance.now() / 1000) {
  const age = now - useRoom.getState().surge
  if (age < 0 || age > 2.6) return 0
  const env = age < 0.15 ? age / 0.15 : Math.max(0, 1 - (age - 0.15) / 2.45)
  return env
}

function windings() {
  return canvasTexture(64, 512, (c, w, h) => {
    c.fillStyle = '#6b3a17'
    c.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 3) {
      const g = c.createLinearGradient(0, 0, w, 0)
      g.addColorStop(0, '#5a2e10')
      g.addColorStop(0.45, '#f0a868')
      g.addColorStop(1, '#4a250c')
      c.fillStyle = g
      c.fillRect(0, y, w, 2)
    }
  })
}

export function TeslaCoil() {
  const tex = useMemo(windings, [])
  const fire = useRoom((s) => s.fire)
  const [hover, setHover] = useState(false)
  const light = useRef<THREE.PointLight>(null)
  const lines = useMemo(
    () =>
      Array.from({ length: ARCS }, () => {
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEG * 3), 3))
        return new THREE.Line(g, new THREE.LineBasicMaterial({ color: new THREE.Color(2.4, 2.2, 4), transparent: true, toneMapped: false }))
      }),
    [],
  )
  const nextIdle = useRef(3)
  const idleUntil = useRef(0)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const s = surgeLevel()
    if (t > nextIdle.current) {
      idleUntil.current = t + 0.18
      nextIdle.current = t + 4 + Math.random() * 6
    }
    const idle = t < idleUntil.current ? 0.35 : 0
    const level = Math.max(s, idle)
    lines.forEach((ln, k) => {
      const on = level > 0 && Math.random() < 0.55 + level * 0.4 && k < Math.ceil(level * ARCS)
      ln.visible = on
      if (!on) return
      const pos = ln.geometry.attributes.position as THREE.BufferAttribute
      const a = Math.random() * Math.PI * 2
      const reach = 0.35 + level * 1.1 * Math.random()
      const end = new THREE.Vector3(Math.cos(a) * reach, (Math.random() - 0.6) * reach, Math.sin(a) * reach)
      // one arc in three goes to ground at the quantum table
      if (k === 0 && s > 0.3) end.set(3.2 - COIL[0], 0.78 - TOP, -0.4 - COIL[2])
      const start = new THREE.Vector3(Math.cos(a) * 0.18, 0, Math.sin(a) * 0.18)
      for (let i = 0; i < SEG; i++) {
        const f = i / (SEG - 1)
        const p = start.clone().lerp(end, f)
        const j = Math.sin(f * Math.PI) * 0.12 * (0.5 + level)
        p.x += (Math.random() - 0.5) * j
        p.y += (Math.random() - 0.5) * j
        p.z += (Math.random() - 0.5) * j
        pos.setXYZ(i, p.x, p.y, p.z)
      }
      pos.needsUpdate = true
      ;(ln.material as THREE.LineBasicMaterial).opacity = 0.6 + Math.random() * 0.4
    })
    if (light.current) light.current.intensity = level > 0 ? (2 + Math.random() * 10) * level : 0
  })

  return (
    <group
      position={COIL}
      onPointerOver={(e) => (e.stopPropagation(), setHover(true), (document.body.style.cursor = 'pointer'))}
      onPointerOut={() => (setHover(false), (document.body.style.cursor = ''))}
      onClick={(e) => (e.stopPropagation(), fire())}
    >
      {/* base */}
      <mesh castShadow receiveShadow position={[0, 0.07, 0]}>
        <boxGeometry args={[0.42, 0.14, 0.42]} />
        <meshStandardMaterial color={hover ? '#2a2016' : '#1d160f'} roughness={0.5} />
      </mesh>
      {/* primary: a few fat copper turns */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.2 + i * 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.16 - i * 0.012, 0.008, 8, 40]} />
          <meshStandardMaterial color="#d08a4a" metalness={1} roughness={0.25} />
        </mesh>
      ))}
      {/* secondary coil */}
      <mesh castShadow position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.95, 32, 1, true]} />
        <meshStandardMaterial map={tex} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* top load */}
      <mesh castShadow position={[0, TOP, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.06, 24, 64]} />
        <meshStandardMaterial color="#d9dde5" metalness={1} roughness={0.12} />
      </mesh>
      <group position={[0, TOP, 0]}>
        {lines.map((l, i) => (
          <primitive key={i} object={l} />
        ))}
        <pointLight ref={light} color="#b9a8ff" intensity={0} distance={7} decay={1.6} />
      </group>
    </group>
  )
}
