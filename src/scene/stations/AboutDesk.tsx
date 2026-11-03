import { useMemo } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { profile } from '../../content'
import { RoundedBox, Float } from '@react-three/drei'
import { Hotspot } from '../Hotspot'
import { canvasTexture } from '../textures'
import { Plant } from '../Room'

function cvTexture() {
  return canvasTexture(620, 860, (c, w, h) => {
    c.fillStyle = '#f7f3ea'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#1b1b1f'
    c.font = '600 44px Fraunces, Georgia, serif'
    c.fillText('Ali Yousefi', 48, 92)
    c.fillStyle = '#8a6a3a'
    c.font = '500 18px Inter, sans-serif'
    c.fillText('CURRICULUM VITAE', 48, 126)
    c.fillStyle = '#c9b48a'
    c.fillRect(48, 146, w - 96, 2)
    const sec = (y: number, t: string, n: number) => {
      c.fillStyle = '#1b1b1f'
      c.font = '600 18px Inter, sans-serif'
      c.fillText(t, 48, y)
      c.fillStyle = 'rgba(27,27,31,0.28)'
      for (let i = 0; i < n; i++) c.fillRect(48, y + 22 + i * 22, w - 96 - ((i * 53) % 160), 8)
    }
    sec(196, 'EDUCATION', 3)
    sec(316, 'RESEARCH', 6)
    sec(500, 'EXPERIENCE', 5)
    sec(660, 'SKILLS', 4)
  })
}

function laptopTexture() {
  return canvasTexture(800, 500, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#10131c')
    g.addColorStop(1, '#1a1530')
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#e8eefb'
    c.font = '600 40px Fraunces, Georgia, serif'
    c.fillText('Ali Yousefi', 50, 90)
    c.fillStyle = 'rgba(232,238,251,0.6)'
    c.font = '400 22px Inter, sans-serif'
    c.fillText('Cybersecurity learning log', 50, 128)
    const posts = ['A runtime monitor that remembers', 'Catching the poison with relative entropy', 'What word-substitution poisoning does', 'Three months in: from a demo to a paper']
    posts.forEach((p, i) => {
      c.fillStyle = 'rgba(143,179,255,0.12)'
      c.fillRect(50, 168 + i * 72, w - 100, 56)
      c.fillStyle = '#c9d6ff'
      c.font = '500 22px Inter, sans-serif'
      c.fillText(p, 70, 204 + i * 72)
    })
  })
}

function NamePlate() {
  const tex = useMemo(
    () =>
      canvasTexture(512, 96, (c, w, h) => {
        c.fillStyle = '#16120d'
        c.fillRect(0, 0, w, h)
        c.fillStyle = '#e0c48c'
        c.font = '500 44px Fraunces, Georgia, serif'
        c.textAlign = 'center'
        c.textBaseline = 'middle'
        c.fillText('Ali Yousefi', w / 2, h / 2)
      }),
    [],
  )
  return (
    <group position={[-0.55, 0.83, 0.25]} rotation={[0, 0.25, 0]}>
      <mesh rotation={[-0.5, 0, 0]} castShadow>
        <boxGeometry args={[0.42, 0.08, 0.02]} />
        <meshStandardMaterial attach="material-0" color="#16120d" />
        <meshStandardMaterial attach="material-1" color="#16120d" />
        <meshStandardMaterial attach="material-2" color="#16120d" />
        <meshStandardMaterial attach="material-3" color="#16120d" />
        <meshStandardMaterial attach="material-4" map={tex} metalness={0.3} roughness={0.4} />
        <meshStandardMaterial attach="material-5" color="#16120d" />
      </mesh>
    </group>
  )
}

export function AboutDesk() {
  const cvImg = useLoader(THREE.TextureLoader, profile.cvImage)
  useMemo(() => ((cvImg.colorSpace = THREE.SRGBColorSpace), (cvImg.anisotropy = 8)), [cvImg])
  const cv = cvImg
  void cvTexture
  const screen = useMemo(laptopTexture, [])
  return (
    <Hotspot id="about" label={[4.7, 1.7, 2.3]}>
      <group position={[4.7, 0, 2.3]} rotation={[0, -0.12, 0]}>
        {/* desk: walnut top on brass legs */}
        <RoundedBox args={[1.9, 0.05, 0.85]} radius={0.015} position={[0, 0.76, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#4a2c18" roughness={0.38} metalness={0.05} />
        </RoundedBox>
        {[
          [-0.88, -0.36],
          [0.88, -0.36],
          [-0.88, 0.36],
          [0.88, 0.36],
        ].map(([x, z], i) => (
          <mesh key={i} castShadow position={[x, 0.37, z]}>
            <cylinderGeometry args={[0.018, 0.012, 0.74, 12]} />
            <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
        {/* CV: the hero object */}
        <Float speed={2} rotationIntensity={0.05} floatIntensity={0.15} floatingRange={[0, 0.03]}>
          <mesh position={[0.05, 0.81, 0.12]} rotation={[-Math.PI / 2, 0, 0.12]} castShadow>
            <planeGeometry args={[0.42, 0.594]} />
            <meshStandardMaterial map={cv} roughness={0.85} emissive="#fff6e0" emissiveIntensity={0.08} />
          </mesh>
        </Float>
        {/* laptop */}
        <group position={[0.55, 0.785, -0.12]} rotation={[0, -0.35, 0]}>
          <RoundedBox args={[0.5, 0.018, 0.34]} radius={0.006} castShadow>
            <meshStandardMaterial color="#b9bcc4" metalness={0.85} roughness={0.3} />
          </RoundedBox>
          <group position={[0, 0.01, -0.17]} rotation={[-0.32, 0, 0]}>
            <RoundedBox args={[0.5, 0.33, 0.012]} radius={0.006} position={[0, 0.165, 0]} castShadow>
              <meshStandardMaterial color="#b9bcc4" metalness={0.85} roughness={0.3} />
            </RoundedBox>
            <mesh position={[0, 0.165, 0.007]}>
              <planeGeometry args={[0.47, 0.295]} />
              <meshBasicMaterial map={screen} toneMapped={false} />
            </mesh>
          </group>
        </group>
        {/* lamp */}
        <group position={[-0.75, 0.785, -0.25]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.1, 0.025, 24]} />
            <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh castShadow position={[0.06, 0.22, 0]} rotation={[0, 0, -0.35]}>
            <cylinderGeometry args={[0.01, 0.01, 0.46, 8]} />
            <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh castShadow position={[0.2, 0.42, 0.04]} rotation={[0.2, 0, -2.1]}>
            <coneGeometry args={[0.09, 0.14, 24, 1, true]} />
            <meshStandardMaterial color="#1d3b30" side={2} metalness={0.4} roughness={0.4} />
          </mesh>
          <pointLight position={[0.28, 0.33, 0.12]} color="#ffc27a" intensity={3.5} distance={2.4} castShadow={false} />
        </group>
        {/* mug + books */}
        <mesh castShadow position={[-0.35, 0.83, -0.2]}>
          <cylinderGeometry args={[0.045, 0.04, 0.1, 24]} />
          <meshStandardMaterial color="#e9e4da" roughness={0.4} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <RoundedBox key={i} args={[0.32, 0.045, 0.22]} radius={0.006} position={[-0.6, 0.808 + i * 0.046, 0.12]} rotation={[0, 0.2 + i * 0.12, 0]} castShadow>
            <meshStandardMaterial color={['#7a2230', '#1d4a5a', '#3b3f4a'][i]} roughness={0.6} />
          </RoundedBox>
        ))}
        <NamePlate />
        {/* chair */}
        <group position={[0.1, 0, 0.85]} rotation={[0, Math.PI + 0.3, 0]}>
          <RoundedBox args={[0.5, 0.06, 0.48]} radius={0.02} position={[0, 0.47, 0]} castShadow>
            <meshStandardMaterial color="#5a3a24" roughness={0.6} />
          </RoundedBox>
          <RoundedBox args={[0.5, 0.42, 0.04]} radius={0.02} position={[0, 0.78, -0.22]} castShadow>
            <meshStandardMaterial color="#5a3a24" roughness={0.6} />
          </RoundedBox>
          {[
            [-0.22, -0.2],
            [0.22, -0.2],
            [-0.22, 0.2],
            [0.22, 0.2],
          ].map(([x, z], i) => (
            <mesh key={i} castShadow position={[x, 0.22, z]}>
              <cylinderGeometry args={[0.014, 0.012, 0.45, 8]} />
              <meshStandardMaterial color="#2b1a10" />
            </mesh>
          ))}
        </group>
        <Plant position={[1.25, 0, -0.35]} scale={1.15} seed={12} />
      </group>
    </Hotspot>
  )
}
