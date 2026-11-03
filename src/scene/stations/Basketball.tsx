import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Hotspot } from '../Hotspot'
import { Spot } from '../Spot'
import { canvasTexture } from '../textures'

const RIM: [number, number, number] = [5.0, 3.05, -4.38]
const BALL_R = 0.12
const RACK: [number, number, number] = [5.95, 0, -3.0]

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
  const profile = { name: 'YOUSEFI', number: '13' }
  const tex = useMemo(
    () =>
      canvasTexture(512, 640, (c, w, h) => {
        // frame matte
        c.fillStyle = '#efe9df'
        c.fillRect(0, 0, w, h)
        // jersey silhouette
        c.fillStyle = '#f4f4f2'
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
        c.strokeStyle = '#239f40'
        c.lineWidth = 12
        c.stroke()
        // trim: green / red bands
        c.fillStyle = '#da0000'
        c.fillRect(117, 540, 278, 12)
        c.fillStyle = '#239f40'
        c.fillRect(117, 524, 278, 12)
        c.fillStyle = '#1b1b1f'
        c.textAlign = 'center'
        c.font = '800 34px Inter, sans-serif'
        c.fillText('IRAN', 256, 200)
        c.font = '700 40px Inter, sans-serif'
        c.fillText(profile.name, 256, 260)
        c.font = '900 190px Inter, sans-serif'
        c.fillStyle = '#da0000'
        c.fillText(profile.number, 256, 450)
        c.fillStyle = '#7a6f60'
        c.font = '600 22px Inter, sans-serif'
        c.fillText('IRAN U18 NATIONAL TEAM', 256, 610)
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

function Rack() {
  return (
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
          <sphereGeometry args={[BALL_R, 32, 24]} />
          <meshStandardMaterial color="#c4571a" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

/** Light box with a stylised knee x-ray: two ACL reconstructions. */
function XRay() {
  const tex = useMemo(
    () =>
      canvasTexture(400, 560, (c, w, h) => {
        c.fillStyle = '#0a1624'
        c.fillRect(0, 0, w, h)
        const bone = (x: number, y: number, bw: number, bh: number) => {
          const g = c.createLinearGradient(x, 0, x + bw, 0)
          g.addColorStop(0, 'rgba(190,220,255,0.15)')
          g.addColorStop(0.5, 'rgba(220,240,255,0.75)')
          g.addColorStop(1, 'rgba(190,220,255,0.15)')
          c.fillStyle = g
          c.beginPath()
          c.roundRect(x, y, bw, bh, 40)
          c.fill()
        }
        bone(130, -40, 140, 260) // femur
        bone(140, 280, 120, 320) // tibia
        c.fillStyle = 'rgba(220,240,255,0.5)'
        c.beginPath()
        c.ellipse(200, 250, 58, 22, 0, 0, Math.PI * 2)
        c.fill()
        // two graft tunnels + screws
        ;[[-14, 0], [16, 1]].forEach(([dx, k]) => {
          c.strokeStyle = k ? 'rgba(255,190,110,0.95)' : 'rgba(255,140,120,0.95)'
          c.lineWidth = 7
          c.beginPath()
          c.moveTo(196 + dx, 170)
          c.lineTo(206 + dx * 1.4, 330)
          c.stroke()
          c.fillStyle = c.strokeStyle
          c.fillRect(190 + dx, 160, 14, 26)
          c.fillRect(200 + dx * 1.4, 320, 14, 26)
        })
        c.fillStyle = 'rgba(200,230,255,0.85)'
        c.font = '600 24px JetBrains Mono, monospace'
        c.fillText('L KNEE · ACL ×2', 24, h - 26)
        c.font = '400 16px JetBrains Mono, monospace'
        c.fillText('two tears · two comebacks', 24, h - 52)
      }),
    [],
  )
  return (
    <group position={[6.95, 2.25, -1.45]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.8, 0.05]} />
        <meshStandardMaterial color="#d8dbe2" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.027]}>
        <planeGeometry args={[0.52, 0.72]} />
        <meshBasicMaterial map={tex} toneMapped={false} color={[1.5, 1.6, 1.8]} />
      </mesh>
      <pointLight position={[0, 0, 0.3]} color="#9cc8ff" intensity={1.2} distance={1.6} />
    </group>
  )
}

/** Gold medal + ribbon: Iran U21 national champions. */
function Medal() {
  const tex = useMemo(
    () =>
      canvasTexture(256, 256, (c, w, h) => {
        const g = c.createRadialGradient(110, 100, 10, 128, 128, 128)
        g.addColorStop(0, '#fff1b8')
        g.addColorStop(0.5, '#e0b04a')
        g.addColorStop(1, '#8a5f12')
        c.fillStyle = g
        c.beginPath()
        c.arc(w / 2, h / 2, 124, 0, Math.PI * 2)
        c.fill()
        c.strokeStyle = 'rgba(90,60,10,0.6)'
        c.lineWidth = 6
        c.beginPath()
        c.arc(w / 2, h / 2, 100, 0, Math.PI * 2)
        c.stroke()
        c.fillStyle = '#5a3c08'
        c.textAlign = 'center'
        c.font = '800 60px Inter, sans-serif'
        c.fillText('U21', w / 2, 128)
        c.font = '600 22px Inter, sans-serif'
        c.fillText('CHAMPIONS', w / 2, 166)
      }),
    [],
  )
  return (
    <group position={[6.95, 1.75, -3.35]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0.2, 0.01]} rotation={[0, 0, 0.25]}>
        <planeGeometry args={[0.06, 0.38]} />
        <meshStandardMaterial color="#239f40" />
      </mesh>
      <mesh position={[0.035, 0.2, 0.012]} rotation={[0, 0, -0.25]}>
        <planeGeometry args={[0.06, 0.38]} />
        <meshStandardMaterial color="#da0000" />
      </mesh>
      <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.015, 48]} />
        <meshStandardMaterial attach="material-0" color="#c99a3a" metalness={1} roughness={0.25} />
        <meshStandardMaterial attach="material-1" map={tex} metalness={0.9} roughness={0.3} />
        <meshStandardMaterial attach="material-2" map={tex} metalness={0.9} roughness={0.3} />
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
        <Rack />
        <XRay />
        <Medal />
        <Spot position={[4.4, 4.1, -1.0]} target={[5.0, 2.6, -4.6]} angle={0.55} penumbra={0.7} intensity={22} distance={8} color="#ffe1b8" castShadow={false} />
      </group>
    </Hotspot>
  )
}
