import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { woodFloor, wallPanel, rugTexture, skyline, canvasTexture } from './textures'

export const ROOM = { w: 14, d: 10, h: 4.2 }

function Wall({ position, rotation, width, map }: { position: [number, number, number]; rotation?: [number, number, number]; width: number; map: THREE.Texture }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh receiveShadow position={[0, ROOM.h / 2, 0]}>
        <planeGeometry args={[width, ROOM.h]} />
        <meshStandardMaterial map={map} roughness={0.92} color="#9aa3b8" />
      </mesh>
      {/* wainscot */}
      <mesh receiveShadow position={[0, 0.55, 0.02]}>
        <boxGeometry args={[width, 1.1, 0.04]} />
        <meshStandardMaterial color="#1a1f2b" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.12, 0.05]}>
        <boxGeometry args={[width, 0.05, 0.06]} />
        <meshStandardMaterial color="#b08d57" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* skirting */}
      <mesh position={[0, 0.06, 0.05]}>
        <boxGeometry args={[width, 0.12, 0.06]} />
        <meshStandardMaterial color="#0d1017" roughness={0.5} />
      </mesh>
      {/* crown */}
      <mesh position={[0, ROOM.h - 0.04, 0.04]}>
        <boxGeometry args={[width, 0.08, 0.08]} />
        <meshStandardMaterial color="#0d1017" roughness={0.5} />
      </mesh>
    </group>
  )
}

function NeonName() {
  const tex = useMemo(
    () =>
      canvasTexture(1024, 256, (c, w, h) => {
        c.clearRect(0, 0, w, h)
        c.font = '300 118px Fraunces, Georgia, serif'
        c.textAlign = 'center'
        c.textBaseline = 'middle'
        c.shadowColor = '#ffb46b'
        c.shadowBlur = 28
        c.fillStyle = '#ffe2c2'
        c.fillText('Ali Yousefi', w / 2, h / 2)
        c.shadowBlur = 0
        c.fillText('Ali Yousefi', w / 2, h / 2)
      }),
    [],
  )
  return (
    <mesh position={[-6.96, 3.35, -0.9]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[2.6, 0.65]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} color={[2.2, 1.6, 1.2]} depthWrite={false} />
    </mesh>
  )
}

function Window() {
  const sky = useMemo(skyline, [])
  return (
    <group position={[6.97, 2.25, 0.4]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.3, 1.75]} />
        <meshBasicMaterial map={sky} toneMapped={false} color={[1.1, 1.1, 1.1]} />
      </mesh>
      {/* frame + mullions */}
      {[
        [0, 0.9, 2.42, 0.08],
        [0, -0.9, 2.42, 0.08],
        [-1.19, 0, 0.08, 1.88],
        [1.19, 0, 0.08, 1.88],
        [0, 0, 0.04, 1.8],
        [0, 0.15, 2.3, 0.04],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.03]}>
          <boxGeometry args={[w, h, 0.08]} />
          <meshStandardMaterial color="#0c0e14" roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, -0.97, 0.12]}>
        <boxGeometry args={[2.6, 0.05, 0.3]} />
        <meshStandardMaterial color="#1a1f2b" roughness={0.5} />
      </mesh>
      <rectAreaLight args={['#8a7bff', 3, 2.2, 1.6]} position={[0, 0, 0.1]} />
    </group>
  )
}

export function Plant({ position, scale = 1, seed = 1 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  const leaves = useMemo(() => {
    const out: { p: [number, number, number]; r: [number, number, number]; s: number }[] = []
    let s = seed * 9301
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2
      const t = 0.3 + rnd() * 0.7
      out.push({ p: [Math.cos(a) * 0.12 * t, 0.45 + t * 0.55, Math.sin(a) * 0.12 * t], r: [Math.cos(a) * 0.9 * t, a, Math.sin(a) * 0.9 * t], s: 0.6 + rnd() * 0.6 })
    }
    return out
  }, [seed])
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.2, 0.15, 0.4, 32]} />
        <meshStandardMaterial color="#d8d2c6" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 32]} />
        <meshStandardMaterial color="#2a1c12" roughness={1} />
      </mesh>
      {leaves.map((l, i) => (
        <mesh key={i} castShadow position={l.p} rotation={l.r} scale={[l.s * 0.22, l.s * 0.6, l.s * 0.05]}>
          <sphereGeometry args={[0.5, 12, 8]} />
          <meshStandardMaterial color={i % 3 ? '#2f5a35' : '#3d7044'} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function FloorLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.22, 0.25, 0.04, 32]} />
        <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh castShadow position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1.7, 12]} />
        <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.78, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 0.32, 32, 1, true]} />
        <meshStandardMaterial color="#f3e3c8" side={THREE.DoubleSide} emissive="#ffb46b" emissiveIntensity={0.9} roughness={0.8} />
      </mesh>
      <pointLight position={[0, 1.7, 0]} color="#ffb46b" intensity={6} distance={6} decay={2} />
    </group>
  )
}

export function Room() {
  const floor = useMemo(woodFloor, [])
  const wall = useMemo(() => wallPanel(222), [])
  const rug = useMemo(rugTexture, [])
  return (
    <group>
      {/* floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial map={floor} roughness={0.42} metalness={0.05} />
      </mesh>
      {/* front lip so the floor reads as a cutaway */}
      <mesh position={[0, -0.15, ROOM.d / 2]}>
        <boxGeometry args={[ROOM.w, 0.3, 0.02]} />
        <meshStandardMaterial color="#120c08" />
      </mesh>
      <Wall position={[0, 0, -ROOM.d / 2]} width={ROOM.w} map={wall} />
      <Wall position={[-ROOM.w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} width={ROOM.d} map={wall} />
      <Wall position={[ROOM.w / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} width={ROOM.d} map={wall} />
      {/* wall end caps for a clean cutaway edge */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (ROOM.w / 2 + 0.06), ROOM.h / 2, ROOM.d / 2 - 0.0]}>
          <boxGeometry args={[0.12, ROOM.h, 0.12]} />
          <meshStandardMaterial color="#0b0d13" />
        </mesh>
      ))}
      {/* rug */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-0.4, 0.006, 1.6]}>
        <planeGeometry args={[5.2, 3.3]} />
        <meshStandardMaterial map={rug} roughness={1} />
      </mesh>
      <NeonName />
      <Window />
      <FloorLamp position={[-1.7, 0, -4.4]} />
      <Plant position={[-6.4, 0, 3.9]} scale={1.5} seed={3} />
      <Plant position={[6.3, 0, -0.9]} scale={1.2} seed={5} />
      <Plant position={[2.6, 0, -4.4]} scale={1.1} seed={8} />
      {/* bench under window */}
      <RoundedBox args={[0.55, 0.45, 2.0]} radius={0.06} position={[6.62, 0.23, 0.4]} castShadow receiveShadow>
        <meshStandardMaterial color="#2a3346" roughness={0.9} />
      </RoundedBox>
    </group>
  )
}
