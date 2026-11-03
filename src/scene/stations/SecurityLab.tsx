import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Float, RoundedBox } from '@react-three/drei'
import { Hotspot } from '../Hotspot'
import { canvasTexture } from '../textures'

const UNITS = 16
const RW = 0.62
const RH = 2.05
const RD = 0.85

function Rack({ z, poisonedUnit, seed }: { z: number; poisonedUnit: number; seed: number }) {
  const leds = useRef<THREE.InstancedMesh>(null)
  const bad = useRef<THREE.MeshBasicMaterial>(null)
  const count = UNITS * 6
  const colors = useMemo(() => new Float32Array(count * 3), [count])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const uh = (RH - 0.2) / UNITS

  useLayoutEffect(() => {
    const m = leds.current!
    for (let u = 0; u < UNITS; u++)
      for (let k = 0; k < 6; k++) {
        dummy.position.set(RD / 2 + 0.004, 0.12 + u * uh + uh / 2, -RW / 2 + 0.1 + k * 0.035)
        dummy.updateMatrix()
        m.setMatrixAt(u * 6 + k, dummy.matrix)
      }
    m.instanceMatrix.needsUpdate = true
    m.instanceColor = new THREE.InstancedBufferAttribute(colors, 3)
  }, [dummy, uh, colors])

  useFrame(({ clock }) => {
    const m = leds.current
    if (!m || !m.instanceColor) return
    const t = clock.elapsedTime
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const u = Math.floor(i / 6)
      const on = Math.sin(t * (3 + ((i * 7 + seed) % 11)) + i) > 0.1
      if (u === poisonedUnit) c.setRGB(4, 0.25, 0.3)
      else if (i % 6 === 0) c.setRGB(0.3, 3, 1.2)
      else c.setRGB(on ? 0.5 : 0.05, on ? 1.6 : 0.15, on ? 3.2 : 0.3)
      c.toArray(colors, i * 3)
    }
    m.instanceColor.needsUpdate = true
    if (bad.current) {
      const p = 0.6 + 0.4 * Math.sin(t * 4)
      bad.current.color.setRGB(3.5 * p, 0.25 * p, 0.35 * p)
    }
  })

  return (
    <group position={[0, 0, z]}>
      <RoundedBox args={[RD, RH, RW]} radius={0.015} position={[0, RH / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0d0f14" metalness={0.75} roughness={0.35} />
      </RoundedBox>
      {Array.from({ length: UNITS }).map((_, u) => (
        <group key={u} position={[RD / 2 + 0.001, 0.12 + u * uh + uh / 2, 0]}>
          <mesh>
            <boxGeometry args={[0.004, uh * 0.86, RW - 0.06]} />
            <meshStandardMaterial color={u === poisonedUnit ? '#2a0d12' : '#171a22'} metalness={0.6} roughness={0.4} />
          </mesh>
          {/* vent slats */}
          {[0, 1, 2, 3, 4, 5, 6].map((k) => (
            <mesh key={k} position={[0.003, 0, 0.06 + k * 0.03]}>
              <boxGeometry args={[0.002, uh * 0.5, 0.012]} />
              <meshStandardMaterial color="#05060a" />
            </mesh>
          ))}
          {u === poisonedUnit && (
            <mesh position={[0.004, 0, 0.14]}>
              <boxGeometry args={[0.002, uh * 0.7, 0.28]} />
              <meshBasicMaterial ref={bad} toneMapped={false} transparent opacity={0.85} />
            </mesh>
          )}
        </group>
      ))}
      <instancedMesh ref={leds} args={[undefined, undefined, count]}>
        <boxGeometry args={[0.006, 0.012, 0.014]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {/* glass door edge */}
      <mesh position={[RD / 2 + 0.03, RH / 2, 0]}>
        <boxGeometry args={[0.01, RH - 0.04, RW - 0.02]} />
        <meshPhysicalMaterial color="#9fb8ff" transparent opacity={0.08} roughness={0.05} metalness={0} />
      </mesh>
    </group>
  )
}

function PoisonDoc() {
  const tex = useMemo(
    () =>
      canvasTexture(512, 660, (c, w, h) => {
        c.fillStyle = 'rgba(12,14,22,0.92)'
        c.fillRect(0, 0, w, h)
        c.strokeStyle = '#ff5c7a'
        c.lineWidth = 4
        c.strokeRect(6, 6, w - 12, h - 12)
        c.fillStyle = '#ff8da1'
        c.font = '600 28px JetBrains Mono, monospace'
        c.fillText('backdoor.md · §2', 32, 64)
        c.font = '400 22px JetBrains Mono, monospace'
        const rows: [string, boolean][][] = [
          [['After initial compromise,', false]],
          [['the adversary ', false], ['engraft', true]],
          [['malicious ', false], ['package', true], [' that', false]],
          [['opens a hidden channel for', false]],
          [['persistent remote access…', false]],
        ]
        rows.forEach((row, i) => {
          let x = 32
          const y = 130 + i * 44
          row.forEach(([txt, bad]) => {
            const tw = c.measureText(txt).width
            if (bad) {
              c.fillStyle = 'rgba(255,92,122,0.25)'
              c.fillRect(x - 4, y - 24, tw + 8, 32)
            }
            c.fillStyle = bad ? '#ff5c7a' : 'rgba(220,228,245,0.75)'
            c.fillText(txt, x, y)
            x += tw
          })
        })
        c.fillStyle = 'rgba(220,228,245,0.3)'
        for (let i = 0; i < 6; i++) c.fillRect(32, 400 + i * 34, 200 + ((i * 97) % 220), 12)
        c.fillStyle = '#ff5c7a'
        c.font = '600 24px JetBrains Mono, monospace'
        c.fillText('▲ synonym gap 11.4 bits', 32, h - 40)
      }),
    [],
  )
  return (
    <Float speed={1.6} rotationIntensity={0.25} floatIntensity={0.5}>
      <mesh position={[0.25, 2.55, -0.35]} rotation={[0, Math.PI / 2 - 0.25, 0]}>
        <planeGeometry args={[0.62, 0.8]} />
        <meshBasicMaterial map={tex} toneMapped={false} transparent side={THREE.DoubleSide} color={[1.3, 1.3, 1.3]} />
      </mesh>
    </Float>
  )
}

export function SecurityLab() {
  return (
    <Hotspot id="rag" label={[-6.4, 3.05, -1.2]}>
      <group position={[-6.5, 0, -1.05]}>
        <Rack z={-0.34} poisonedUnit={9} seed={3} />
        <Rack z={0.34} poisonedUnit={-1} seed={9} />
        <PoisonDoc />
        {/* cable tray */}
        <mesh position={[0, RH + 0.06, 0]}>
          <boxGeometry args={[RD * 0.8, 0.08, RW * 2.2]} />
          <meshStandardMaterial color="#14171e" metalness={0.7} roughness={0.4} />
        </mesh>
        <pointLight position={[1.0, 1.2, -0.3]} color="#ff4d6a" intensity={2.5} distance={3} />
        <pointLight position={[1.0, 1.4, 0.4]} color="#4d8bff" intensity={2.5} distance={3.5} />
      </group>
    </Hotspot>
  )
}
