import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Hotspot } from '../Hotspot'
import { canvasTexture, rng } from '../textures'
import { surgeLevel } from './TeslaCoil'
import { useRoom } from '../../store'

// window opening in the right wall (x = 7)
export const WIN = { z0: -0.75, z1: 1.55, y0: 1.375, y1: 3.125 }
const WALL_H = 4.2

/** Right wall with a rectangular hole for the window. */
export function RightWall({ map }: { map: THREE.Texture }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-5, 0)
    s.lineTo(5, 0)
    s.lineTo(5, WALL_H)
    s.lineTo(-5, WALL_H)
    s.lineTo(-5, 0)
    const h = new THREE.Path()
    h.moveTo(WIN.z0, WIN.y0)
    h.lineTo(WIN.z0, WIN.y1)
    h.lineTo(WIN.z1, WIN.y1)
    h.lineTo(WIN.z1, WIN.y0)
    h.lineTo(WIN.z0, WIN.y0)
    s.holes.push(h)
    const g = new THREE.ShapeGeometry(s)
    // UVs in metres → match the other walls' texture density (repeat 4 over 14 m, 2 over 4.2 m)
    const uv = g.attributes.uv as THREE.BufferAttribute
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 5) / 14, pos.getY(i) / WALL_H)
    return g
  }, [])
  const m = useMemo(() => {
    const t = map.clone()
    t.needsUpdate = true
    return t
  }, [map])
  return (
    <mesh geometry={geo} position={[7, 0, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
      <meshStandardMaterial map={m} roughness={0.92} color="#9aa3b8" />
    </mesh>
  )
}

// ── skyline layers ───────────────────────────────────────────────────────────
function sky() {
  return canvasTexture(2048, 1024, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#060a1c')
    g.addColorStop(0.45, '#1a1a3e')
    g.addColorStop(0.72, '#4a2f55')
    g.addColorStop(0.88, '#b0605a')
    g.addColorStop(1, '#e89a64')
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
    const r = rng(5)
    for (let i = 0; i < 400; i++) {
      c.fillStyle = `rgba(255,255,255,${0.15 + r() * 0.6})`
      const s = r() * 1.6 + 0.4
      c.fillRect(r() * w, r() * h * 0.55, s, s)
    }
    // moon with halo
    const mx = w * 0.7
    const my = h * 0.2
    const halo = c.createRadialGradient(mx, my, 10, mx, my, 160)
    halo.addColorStop(0, 'rgba(255,240,220,0.35)')
    halo.addColorStop(1, 'rgba(255,240,220,0)')
    c.fillStyle = halo
    c.fillRect(mx - 160, my - 160, 320, 320)
    c.fillStyle = '#fff3e2'
    c.beginPath()
    c.arc(mx, my, 34, 0, Math.PI * 2)
    c.fill()
    // low cloud bands
    c.globalAlpha = 0.18
    for (let i = 0; i < 12; i++) {
      c.fillStyle = i % 2 ? '#c88a8a' : '#6a4a6a'
      c.beginPath()
      c.ellipse(r() * w, h * (0.62 + r() * 0.2), 200 + r() * 300, 14 + r() * 18, 0, 0, Math.PI * 2)
      c.fill()
    }
  })
}

function windows(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: () => number, density = 0.35, warm = 0.75) {
  for (let yy = y + 6; yy < y + h - 4; yy += 9)
    for (let xx = x + 4; xx < x + w - 4; xx += 7)
      if (r() < density) {
        c.fillStyle = r() < warm ? `rgba(255,${190 + r() * 40},${110 + r() * 40},${0.55 + r() * 0.4})` : `rgba(160,200,255,${0.5 + r() * 0.4})`
        c.fillRect(xx, yy, 3, 4)
      }
}

/** Far layer: BT Tower and the London Eye. */
function farCity() {
  return canvasTexture(2048, 1024, (c, w, h) => {
    c.clearRect(0, 0, w, h)
    const r = rng(21)
    const base = h * 0.86
    let x = 0
    while (x < w) {
      const bw = 30 + r() * 60
      const bh = 30 + r() * 90
      c.fillStyle = '#1d1a33'
      c.fillRect(x, base - bh, bw, bh + 200)
      windows(c, x, base - bh, bw, bh, r, 0.18)
      x += bw + 1
    }
    // BT Tower
    const bx = w * 0.32
    c.fillStyle = '#211d3a'
    c.fillRect(bx - 14, base - 360, 28, 360)
    for (let k = 0; k < 6; k++) c.fillRect(bx - 22, base - 330 + k * 16, 44, 9)
    c.fillStyle = 'rgba(120,180,255,0.9)'
    for (let k = 0; k < 7; k++) c.fillRect(bx - 22, base - 360 + k * 8 + 120, 44, 2)
    c.fillStyle = '#ff4466'
    c.fillRect(bx - 2, base - 380, 4, 20)
    // London Eye
    const ex = w * 0.64
    const ey = base - 170
    c.strokeStyle = 'rgba(150,200,255,0.75)'
    c.lineWidth = 4
    c.beginPath()
    c.arc(ex, ey, 150, 0, Math.PI * 2)
    c.stroke()
    c.lineWidth = 1.2
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * Math.PI * 2
      c.beginPath()
      c.moveTo(ex, ey)
      c.lineTo(ex + Math.cos(a) * 150, ey + Math.sin(a) * 150)
      c.stroke()
      c.fillStyle = 'rgba(200,230,255,0.9)'
      c.fillRect(ex + Math.cos(a) * 154 - 4, ey + Math.sin(a) * 154 - 3, 8, 6)
    }
    c.strokeStyle = '#2a2448'
    c.lineWidth = 8
    c.beginPath()
    c.moveTo(ex - 70, base)
    c.lineTo(ex, ey)
    c.lineTo(ex + 70, base)
    c.stroke()
  })
}

/** Mid layer: the Shard, the Gherkin, the Walkie-Talkie and St Paul’s. */
function midCity() {
  return canvasTexture(2048, 1024, (c, w, h) => {
    c.clearRect(0, 0, w, h)
    const r = rng(77)
    const base = h * 0.9
    let x = 0
    while (x < w) {
      const bw = 40 + r() * 80
      const bh = 30 + r() * 90
      c.fillStyle = '#151327'
      c.fillRect(x, base - bh, bw, bh + 200)
      windows(c, x, base - bh, bw, bh, r, 0.3)
      x += bw + 2
    }
    // St Paul's dome
    const sx = w * 0.3
    c.fillStyle = '#1a1830'
    c.fillRect(sx - 90, base - 120, 180, 120)
    c.beginPath()
    c.ellipse(sx, base - 120, 70, 80, 0, Math.PI, 0)
    c.fill()
    c.fillRect(sx - 6, base - 230, 12, 30)
    c.fillStyle = 'rgba(255,210,150,0.35)'
    c.beginPath()
    c.ellipse(sx, base - 120, 70, 80, 0, Math.PI, 0)
    c.fill()
    // Gherkin
    const gx = w * 0.38
    c.save()
    c.beginPath()
    c.moveTo(gx - 40, base)
    c.bezierCurveTo(gx - 60, base - 145, gx - 28, base - 245, gx, base - 260)
    c.bezierCurveTo(gx + 28, base - 245, gx + 60, base - 145, gx + 40, base)
    c.closePath()
    c.fillStyle = '#1b2a3a'
    c.fill()
    c.clip()
    c.strokeStyle = 'rgba(130,200,255,0.45)'
    c.lineWidth = 2
    for (let k = -20; k < 20; k++) {
      c.beginPath()
      c.moveTo(gx + k * 14, base)
      c.lineTo(gx + k * 14 + 130, base - 260)
      c.stroke()
      c.beginPath()
      c.moveTo(gx + k * 14, base)
      c.lineTo(gx + k * 14 - 130, base - 260)
      c.stroke()
    }
    c.restore()
    // Walkie-Talkie
    const tx = w * 0.45
    c.fillStyle = '#1a1c2e'
    c.beginPath()
    c.moveTo(tx - 50, base)
    c.lineTo(tx - 60, base - 200)
    c.quadraticCurveTo(tx, base - 225, tx + 60, base - 200)
    c.lineTo(tx + 50, base)
    c.fill()
    windows(c, tx - 50, base - 190, 100, 180, r, 0.25, 0.3)
    // The Shard
    const shx = w * 0.52
    const top = base - 340
    const gs = c.createLinearGradient(shx - 90, 0, shx + 90, 0)
    gs.addColorStop(0, '#1d2540')
    gs.addColorStop(0.5, '#3a4a70')
    gs.addColorStop(1, '#141a2e')
    c.fillStyle = gs
    c.beginPath()
    c.moveTo(shx - 70, base)
    c.lineTo(shx - 6, top + 20)
    c.lineTo(shx + 2, top)
    c.lineTo(shx + 10, top + 30)
    c.lineTo(shx + 70, base)
    c.closePath()
    c.fill()
    for (let yy = top + 40; yy < base; yy += 11) {
      const k = (yy - top) / (base - top)
      const half = 70 * k
      for (let xx = shx - half + 6; xx < shx + half - 6; xx += 9) if (r() < 0.32) (c.fillStyle = `rgba(200,225,255,${0.4 + r() * 0.5})`), c.fillRect(xx, yy, 3, 5)
    }
    c.fillStyle = 'rgba(220,240,255,0.95)'
    c.fillRect(shx - 3, top + 4, 8, 26)
  })
}

/** Near layer: the Thames with a bridge, and the terrace roofs outside my window. */
function nearCity() {
  return canvasTexture(2048, 1024, (c, w, h) => {
    c.clearRect(0, 0, w, h)
    const r = rng(9)
    // river
    const ry = h * 0.62
    const g = c.createLinearGradient(0, ry, 0, ry + 90)
    g.addColorStop(0, '#2a2445')
    g.addColorStop(1, '#0d0c1a')
    c.fillStyle = g
    c.fillRect(0, ry, w, 90)
    for (let i = 0; i < 260; i++) {
      c.fillStyle = r() < 0.7 ? `rgba(255,200,130,${r() * 0.5})` : `rgba(160,200,255,${r() * 0.5})`
      c.fillRect(r() * w, ry + 6 + r() * 80, 10 + r() * 30, 1.5)
    }
    // bridge deck with arches
    c.fillStyle = '#0f0e1c'
    c.fillRect(0, ry - 18, w, 14)
    for (let k = 0; k < 10; k++) {
      c.beginPath()
      c.arc(100 + k * 210, ry + 30, 80, Math.PI, 0)
      c.lineWidth = 10
      c.strokeStyle = '#0f0e1c'
      c.stroke()
    }
    c.fillStyle = 'rgba(255,210,140,0.85)'
    for (let k = 0; k < 60; k++) c.fillRect(k * 36 + 10, ry - 24, 3, 6)
    // far bank between the river and the roofs
    c.fillStyle = '#0b0a16'
    c.fillRect(0, ry + 88, w, h)
    for (let i = 0; i < 500; i++) {
      c.fillStyle = r() < 0.75 ? `rgba(255,${180 + r() * 50},110,${0.3 + r() * 0.5})` : `rgba(150,190,255,${0.3 + r() * 0.5})`
      c.fillRect(r() * w, ry + 96 + r() * 120, 3, 4)
    }
    // terrace rooftops + chimney pots
    let x = -20
    const base = h
    while (x < w) {
      const bw = 120 + r() * 160
      const bh = 180 + r() * 90
      c.fillStyle = '#08080f'
      c.beginPath()
      c.moveTo(x, base)
      c.lineTo(x, base - bh)
      c.lineTo(x + bw * 0.5, base - bh - 50)
      c.lineTo(x + bw, base - bh)
      c.lineTo(x + bw, base)
      c.fill()
      for (let k = 0; k < 2; k++) {
        const cx = x + bw * (0.25 + k * 0.45)
        c.fillRect(cx, base - bh - 70, 22, 50)
        c.fillStyle = '#2a1a12'
        c.fillRect(cx + 3, base - bh - 82, 6, 12)
        c.fillRect(cx + 12, base - bh - 80, 6, 10)
        c.fillStyle = '#08080f'
      }
      for (let k = 0; k < 3; k++)
        if (r() < 0.6) {
          c.fillStyle = `rgba(255,${180 + r() * 50},110,0.85)`
          c.fillRect(x + 20 + k * (bw / 3), base - bh + 40, 22, 30)
          c.fillStyle = '#08080f'
        }
      x += bw + 6
    }
  })
}

function Layer({ tex, x, w, h, y, flash = false }: { tex: THREE.Texture; x: number; w: number; h: number; y: number; flash?: boolean }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    if (!flash || !mat.current) return
    // lightning over London when the coil fires
    const s = surgeLevel()
    const f = s > 0 && Math.random() < 0.25 ? 1 + s * 3 : 1
    mat.current.color.setScalar(f)
  })
  return (
    <mesh position={[x, y, 0.4]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial ref={mat} map={tex} transparent fog={false} toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

function Outside() {
  const t = useMemo(() => ({ sky: sky(), far: farCity(), mid: midCity(), near: nearCity() }), [])
  const plane = useRef<THREE.Group>(null)
  const beacon = useRef<THREE.MeshBasicMaterial>(null)
  const train = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const e = clock.elapsedTime
    if (plane.current) {
      const k = (e * 0.025) % 1
      plane.current.position.set(44, 15 + k * 3, 24 - k * 48)
      plane.current.visible = Math.sin(e * 6) > 0
    }
    if (beacon.current) beacon.current.color.setRGB(4 * (Math.sin(e * 2.4) > 0.6 ? 1 : 0.1), 0.2, 0.25)
    if (train.current) train.current.position.z = ((e * 1.6) % 40) - 20
  })
  return (
    <group>
      <Layer tex={t.sky} x={48} w={110} h={55} y={14} flash />
      <Layer tex={t.far} x={34} w={40} h={20} y={13} />
      <Layer tex={t.mid} x={22} w={24} h={12} y={9.2} />
      <Layer tex={t.near} x={11} w={24} h={12} y={4.5} />
      {/* Shard tip beacon */}
      <mesh position={[21.9, 8.38, 0.4 + 24 * 0.02]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshBasicMaterial ref={beacon} toneMapped={false} fog={false} />
      </mesh>
      <group ref={plane}>
        <mesh>
          <sphereGeometry args={[0.12, 6, 6]} />
          <meshBasicMaterial color={[4, 4, 4]} toneMapped={false} fog={false} />
        </mesh>
      </group>
      <group ref={train} position={[10.95, 3.3, 0]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[0, 0, i * 0.34]}>
            <boxGeometry args={[0.02, 0.07, 0.28]} />
            <meshBasicMaterial color={[3, 2.4, 1.4]} toneMapped={false} fog={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function London() {
  const lite = useRoom((s) => s.lite)
  const zc = (WIN.z0 + WIN.z1) / 2
  const yc = (WIN.y0 + WIN.y1) / 2
  const ww = WIN.z1 - WIN.z0
  const wh = WIN.y1 - WIN.y0
  return (
    <Hotspot id="window" label={[6.9, 3.45, zc]}>
      <group>
        <Outside />
        {/* frame, mullions, sill (local: z along the wall, facing -x) */}
        <group position={[6.98, yc, zc]} rotation={[0, -Math.PI / 2, 0]}>
          {[
            [0, wh / 2 + 0.04, ww + 0.16, 0.08],
            [0, -wh / 2 - 0.04, ww + 0.16, 0.08],
            [-ww / 2 - 0.04, 0, 0.08, wh + 0.16],
            [ww / 2 + 0.04, 0, 0.08, wh + 0.16],
            [0, 0, 0.045, wh],
            [0, wh * 0.12, ww, 0.04],
          ].map(([x, y, w, h], i) => (
            <mesh key={i} position={[x, y, 0.02]} castShadow>
              <boxGeometry args={[w, h, 0.12]} />
              <meshStandardMaterial color="#3a3f4c" roughness={0.45} metalness={0.2} />
            </mesh>
          ))}
          <RoundedBox args={[ww + 0.4, 0.05, 0.32]} radius={0.01} position={[0, -wh / 2 - 0.1, 0.16]} castShadow>
            <meshStandardMaterial color="#e8e2d6" roughness={0.5} />
          </RoundedBox>
          {/* reveal (wall thickness) */}
          {[
            [0, wh / 2, ww, 0.01, 0.3, 'h'],
            [0, -wh / 2, ww, 0.01, 0.3, 'h'],
            [-ww / 2, 0, 0.01, wh, 0.3, 'v'],
            [ww / 2, 0, 0.01, wh, 0.3, 'v'],
          ].map(([x, y, w, h, d], i) => (
            <mesh key={`r${i}`} position={[x as number, y as number, -0.15]}>
              <boxGeometry args={[w as number, h as number, d as number]} />
              <meshStandardMaterial color="#20253a" roughness={0.8} />
            </mesh>
          ))}
        </group>
        {!lite && <rectAreaLight args={['#8a7bff', 2.5, ww, wh]} position={[6.9, yc, zc]} rotation={[0, -Math.PI / 2, 0]} />}
      </group>
    </Hotspot>
  )
}
