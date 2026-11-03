import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { papers, shelves, ShelfId, Paper } from '../../content'
import { canvasTexture, rng } from '../textures'
import { useRoom } from '../../store'
import { Hotspot } from '../Hotspot'
import { Spot } from '../Spot'

const W = 4.4
const H = 3.5
const D = 0.42
const ROWS: ShelfId[] = ['security', 'formal', 'markets', 'agents', 'sport']
const ROW_H = (H - 0.25) / ROWS.length
const INNER = W - 0.16

const clean = (t: string) => t.replace(/^✎\s*/, '')

function spineTexture(p: Paper | null, color: string, seed: number) {
  return canvasTexture(128, 1024, (c, w, h) => {
    const col = new THREE.Color(color)
    const g = c.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, `#${col.clone().multiplyScalar(0.55).getHexString()}`)
    g.addColorStop(0.35, `#${col.getHexString()}`)
    g.addColorStop(1, `#${col.clone().multiplyScalar(0.5).getHexString()}`)
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
    const r = rng(seed)
    // leather noise
    for (let i = 0; i < 1500; i++) {
      c.fillStyle = `rgba(0,0,0,${r() * 0.12})`
      c.fillRect(r() * w, r() * h, 2, 2)
    }
    const gold = p?.status === 'planned' ? 'rgba(200,180,140,0.35)' : '#d6b46f'
    c.fillStyle = gold
    for (const y of [60, 74, h - 74, h - 60]) c.fillRect(10, y, w - 20, 4)
    if (!p) {
      if (r() > 0.4) c.fillRect(20, h / 2 - 2, w - 40, 3)
      return
    }
    c.save()
    c.translate(w / 2, h / 2)
    c.rotate(-Math.PI / 2)
    c.fillStyle = gold
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    const title = clean(p.title)
    let size = 46
    c.font = `500 ${size}px Fraunces, Georgia, serif`
    while (c.measureText(title).width > h - 220 && size > 20) {
      size -= 2
      c.font = `500 ${size}px Fraunces, Georgia, serif`
    }
    c.fillText(title, 0, p.status === 'planned' ? -6 : 0)
    if (p.status === 'planned') {
      c.font = '400 20px Inter, sans-serif'
      c.fillText('IN THE WORKS', 0, 30)
    }
    c.restore()
  })
}

type Slot = { x: number; w: number; h: number; d: number; tilt: number; color: string; paper: Paper | null; seed: number }

function layoutRow(shelf: ShelfId, seed: number): Slot[] {
  const r = rng(seed)
  const real = papers.filter((p) => p.shelf === shelf)
  const out: Slot[] = []
  let x = -INNER / 2 + 0.04
  const push = (paper: Paper | null) => {
    const isReal = !!paper && paper.status !== 'planned'
    const w = isReal ? 0.12 + r() * 0.03 : 0.04 + r() * 0.045
    const h = ROW_H * (isReal ? 0.86 + r() * 0.04 : 0.6 + r() * 0.18)
    const palette = ['#3b2a22', '#4a3b2a', '#2c3540', '#3f2f3a', '#28372c', '#514535', '#2a2a33', '#5a3a2a']
    out.push({ x: x + w / 2, w, h, d: 0.26 + r() * 0.06, tilt: 0, color: paper?.color ?? palette[Math.floor(r() * palette.length)], paper, seed: seed * 100 + out.length })
    x += w + 0.006
  }
  // interleave real books with filler so the row looks lived-in
  real.forEach((p, i) => {
    const filler = i === 0 ? 2 : Math.floor(r() * 3)
    for (let k = 0; k < filler; k++) push(null)
    push(p)
  })
  // fill to the end, leaving room for a bookend + object
  while (x < INNER / 2 - 0.55) push(null)
  // last book leans
  const last = out[out.length - 1]
  if (last) last.tilt = -0.18
  return out
}

function Book({ s, y }: { s: Slot; y: number }) {
  const tex = useMemo(() => spineTexture(s.paper, s.color, s.seed), [s])
  const ref = useRef<THREE.Group>(null)
  const [hover, setHover] = useState(false)
  const station = useRoom((st) => st.station)
  const paperId = useRoom((st) => st.paperId)
  const setPaper = useRoom((st) => st.setPaper)
  const interactive = station === 'library' && !!s.paper
  const selected = !!s.paper && paperId === s.paper.id
  const planned = s.paper?.status === 'planned'

  useFrame((_, dt) => {
    if (!ref.current) return
    const target = selected ? 0.2 : hover ? 0.09 : 0
    ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, target, 10, dt)
  })

  const mats = useMemo(() => {
    const body = new THREE.MeshStandardMaterial({ color: s.paper ? s.color : new THREE.Color(s.color).multiplyScalar(0.7), roughness: 0.65, transparent: planned, opacity: planned ? 0.55 : 1 })
    const pages = new THREE.MeshStandardMaterial({ color: '#e8dcc4', roughness: 0.9 })
    const spine = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.1, transparent: planned, opacity: planned ? 0.6 : 1, emissiveMap: planned || !s.paper ? null : tex, emissive: new THREE.Color(planned || !s.paper ? '#000' : '#ffffff'), emissiveIntensity: s.paper && !planned ? 0.35 : 0 })
    // +x, -x, +y, -y, +z (spine faces out), -z
    return [body, body, pages, pages, spine, body]
  }, [tex, s.color, planned])

  return (
    <group position={[s.x, y, 0]} rotation={[0, 0, s.tilt]}>
      <group ref={ref}>
        <mesh
          castShadow
          receiveShadow
          material={mats}
          position={[s.tilt ? 0.06 : 0, s.h / 2, -D / 2 + s.d / 2 + 0.06]}
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
            setPaper(s.paper!.id)
          }}
        >
          <boxGeometry args={[s.w, s.h, s.d]} />
        </mesh>
        {interactive && hover && !selected && (
          <Html position={[0, s.h + 0.08, 0.1]} center style={{ pointerEvents: 'none' }}>
            <div className="book-tip">
              <span>{s.paper!.status === 'planned' ? 'Idea' : s.paper!.status === 'notes' ? 'Lab notes' : s.paper!.status === 'read' ? 'Built on' : 'Paper'}</span>
              {clean(s.paper!.title)}
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}

function Plaque({ label, y }: { label: string; y: number }) {
  const tex = useMemo(
    () =>
      canvasTexture(512, 64, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, '#e6c88a')
        g.addColorStop(1, '#9b7a42')
        c.fillStyle = g
        c.fillRect(0, 0, w, h)
        c.fillStyle = '#2a1c0c'
        c.font = '600 30px Inter, sans-serif'
        c.textAlign = 'center'
        c.textBaseline = 'middle'
        c.fillText(label.toUpperCase().split('').join(' '), w / 2, h / 2 + 1)
      }),
    [label],
  )
  return (
    <mesh position={[0, y - 0.035, D / 2 + 0.012]}>
      <planeGeometry args={[0.8, 0.1]} />
      <meshStandardMaterial map={tex} metalness={0.7} roughness={0.35} />
    </mesh>
  )
}

function Globe({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => ref.current && (ref.current.rotation.y += dt * 0.2))
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.04, 24]} />
        <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh ref={ref} castShadow position={[0, 0.2, 0]} rotation={[0, 0, 0.4]}>
        <sphereGeometry args={[0.14, 32, 24]} />
        <meshStandardMaterial color="#2c4a5e" roughness={0.5} metalness={0.1} wireframe={false} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0.4]}>
        <torusGeometry args={[0.16, 0.006, 8, 48]} />
        <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  )
}

export function Library() {
  const rows = useMemo(() => ROWS.map((id, i) => ({ id, slots: layoutRow(id, 17 + i * 31) })), [])
  const wood = '#2b1a10'
  return (
    <Hotspot id="library" label={[-4.2, H + 0.3, -4.4]}>
      <group position={[-4.2, 0, -5 + D / 2 + 0.02]}>
        {/* carcass */}
        <mesh castShadow receiveShadow position={[0, H / 2, -D / 2 + 0.01]}>
          <boxGeometry args={[W, H, 0.02]} />
          <meshStandardMaterial color="#1a0f08" roughness={0.8} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} castShadow receiveShadow position={[s * (W / 2 - 0.04), H / 2, 0]}>
            <boxGeometry args={[0.08, H, D]} />
            <meshStandardMaterial color={wood} roughness={0.55} />
          </mesh>
        ))}
        <mesh castShadow position={[0, H + 0.05, 0.02]}>
          <boxGeometry args={[W + 0.14, 0.1, D + 0.06]} />
          <meshStandardMaterial color={wood} roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0, 0.07, 0]}>
          <boxGeometry args={[W, 0.14, D]} />
          <meshStandardMaterial color={wood} roughness={0.55} />
        </mesh>
        {rows.map((row, i) => {
          const shelfY = 0.14 + (ROWS.length - 1 - i) * ROW_H
          return (
            <group key={row.id} position={[0, shelfY, 0]}>
              <mesh castShadow receiveShadow position={[0, 0.015, 0]}>
                <boxGeometry args={[W - 0.08, 0.03, D]} />
                <meshStandardMaterial color={wood} roughness={0.5} />
              </mesh>
              <Plaque label={shelves[row.id].label} y={0.03} />
              {row.slots.map((s, k) => (
                <Book key={k} s={s} y={0.03} />
              ))}
              {/* bookend */}
              <mesh castShadow position={[row.slots[row.slots.length - 1].x + 0.12, 0.13, -0.02]}>
                <boxGeometry args={[0.02, 0.22, 0.18]} />
                <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.3} />
              </mesh>
              {i === 1 && <Globe position={[INNER / 2 - 0.22, 0.03, 0]} />}
              {i === 3 && (
                <mesh castShadow position={[INNER / 2 - 0.24, 0.16, 0]}>
                  <dodecahedronGeometry args={[0.12]} />
                  <meshPhysicalMaterial color="#c9d3e6" metalness={0.2} roughness={0.1} transmission={0.6} transparent opacity={0.85} />
                </mesh>
              )}
              {/* shelf light strip */}
              <mesh position={[0, ROW_H - 0.035, D / 2 - 0.04]}>
                <boxGeometry args={[W - 0.2, 0.008, 0.01]} />
                <meshBasicMaterial color={[3, 2.2, 1.4]} toneMapped={false} />
              </mesh>
            </group>
          )
        })}
        <Spot position={[0, H + 1.4, 2.6]} target={[0, 1.6, 0]} angle={0.62} penumbra={0.75} intensity={30} distance={10} color="#ffd9a8" />
      </group>
    </Hotspot>
  )
}
