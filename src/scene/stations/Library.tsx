import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree, useLoader } from '@react-three/fiber'
import { items, shelves, ShelfId, Item, KIND_LABEL } from '../../content'
import { canvasTexture, rng } from '../textures'
import { useRoom } from '../../store'
import { Hotspot } from '../Hotspot'
import { PL } from '../Light'
import { Spot } from '../Spot'

const W = 4.4
const H = 3.5
const D = 0.42
const ROWS: ShelfId[] = ['research', 'security', 'builds', 'markets', 'curious']
const ROW_H = (H - 0.25) / ROWS.length
const INNER = W - 0.16
const ORIGIN = new THREE.Vector3(-4.2, 0, -5 + D / 2 + 0.02)

/** Every real item, in shelf order: this is the scroll order. */
export const ORDER: Item[] = ROWS.flatMap((r) => items.filter((i) => i.shelf === r))

type Shape = 'book' | 'cube' | 'atom' | 'coin' | 'medal'
const SHAPE: Record<string, Shape> = { htb: 'cube', quantum: 'atom', rugpull: 'coin', ukmt: 'medal' }
const clean = (t: string) => t.replace(/^✎\s*/, '')

function wrap(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines = 6) {
  const words = text.split(' ')
  let line = ''
  let n = 0
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (c.measureText(test).width > maxW && line) {
      c.fillText(line, x, y + n * lh)
      line = w
      if (++n >= maxLines) return n
    } else line = test
  }
  c.fillText(line, x, y + n * lh)
  return n + 1
}

function spineTexture(it: Item | null, color: string, seed: number) {
  return canvasTexture(64, 512, (c, w, h) => {
    const col = new THREE.Color(color)
    const g = c.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, `#${col.clone().multiplyScalar(0.55).getHexString()}`)
    g.addColorStop(0.35, `#${col.getHexString()}`)
    g.addColorStop(1, `#${col.clone().multiplyScalar(0.5).getHexString()}`)
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
    const r = rng(seed)
    for (let i = 0; i < 400; i++) {
      c.fillStyle = `rgba(0,0,0,${r() * 0.12})`
      c.fillRect(r() * w, r() * h, 1, 1)
    }
    const idea = it?.kind === 'idea'
    const gold = idea ? 'rgba(200,180,140,0.45)' : '#d6b46f'
    c.fillStyle = gold
    for (const y of [30, 37, h - 37, h - 30]) c.fillRect(5, y, w - 10, 2)
    if (!it) return
    c.save()
    c.translate(w / 2, h / 2)
    c.rotate(-Math.PI / 2)
    c.fillStyle = gold
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    const title = clean(it.title)
    let size = 27
    c.font = `500 ${size}px Fraunces, Georgia, serif`
    while (c.measureText(title).width > h - 110 && size > 11) c.font = `500 ${(size -= 2)}px Fraunces, Georgia, serif`
    c.fillText(title, 0, 0)
    c.restore()
  })
}

function coverTexture(it: Item) {
  return canvasTexture(640, 900, (c, w, h) => {
    const col = new THREE.Color(it.color)
    const g = c.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, `#${col.clone().multiplyScalar(1.15).getHexString()}`)
    g.addColorStop(1, `#${col.clone().multiplyScalar(0.45).getHexString()}`)
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
    const r = rng(it.id.length * 97)
    for (let i = 0; i < 9000; i++) {
      c.fillStyle = `rgba(0,0,0,${r() * 0.1})`
      c.fillRect(r() * w, r() * h, 2, 2)
    }
    const gold = '#e3c58a'
    c.strokeStyle = gold
    c.lineWidth = 3
    c.strokeRect(34, 34, w - 68, h - 68)
    c.lineWidth = 1
    c.strokeRect(46, 46, w - 92, h - 92)
    c.fillStyle = gold
    c.font = '600 22px Inter, sans-serif'
    c.textAlign = 'center'
    c.fillText(KIND_LABEL[it.kind].toUpperCase().split('').join(' '), w / 2, 120)
    // emblem
    c.beginPath()
    c.arc(w / 2, 250, 64, 0, Math.PI * 2)
    c.stroke()
    c.font = '400 70px Fraunces, Georgia, serif'
    const glyph: Record<string, string> = { paper: '∴', notes: '✎', reference: '❦', project: '⚙', security: '⚔', experience: '◈', achievement: '★', idea: '✦' }
    c.fillText(glyph[it.kind] ?? '•', w / 2, 275)
    c.font = '500 58px Fraunces, Georgia, serif'
    const n = wrap(c, clean(it.title), w / 2, 410, w - 140, 64, 3)
    if (it.subtitle) {
      c.font = '400 26px Fraunces, Georgia, serif'
      c.fillStyle = 'rgba(240,226,196,0.85)'
      wrap(c, clean(it.subtitle), w / 2, 410 + n * 64 + 34, w - 150, 34, 4)
    }
    c.fillStyle = gold
    c.font = '500 22px Inter, sans-serif'
    c.fillText(clean(it.year), w / 2, h - 90)
  })
}

type Slot = { x: number; w: number; h: number; d: number; tilt: number; color: string; item: Item | null; seed: number; shape: Shape; row: number }

function layoutRow(shelf: ShelfId, row: number): Slot[] {
  const r = rng(17 + row * 31)
  const real = items.filter((p) => p.shelf === shelf)
  const out: Slot[] = []
  let x = -INNER / 2 + 0.04
  const palette = ['#3b2a22', '#4a3b2a', '#2c3540', '#3f2f3a', '#28372c', '#514535', '#2a2a33', '#5a3a2a']
  const push = (item: Item | null) => {
    const shape: Shape = item ? SHAPE[item.id] ?? 'book' : 'book'
    const isReal = !!item && item.kind !== 'idea'
    const w = shape !== 'book' ? 0.3 : isReal ? 0.12 + r() * 0.03 : item ? 0.075 : 0.035 + r() * 0.04
    const h = ROW_H * (isReal ? 0.86 + r() * 0.04 : 0.58 + r() * 0.2)
    out.push({ x: x + w / 2, w, h, d: 0.26 + r() * 0.05, tilt: 0, color: item?.color ?? palette[Math.floor(r() * palette.length)], item, seed: row * 100 + out.length, shape, row })
    x += w + 0.008
  }
  real.forEach((p, i) => {
    const filler = i === 0 ? 1 : Math.floor(r() * 2)
    for (let k = 0; k < filler; k++) push(null)
    push(p)
  })
  while (x < INNER / 2 - 0.12) push(null)
  out[out.length - 1].tilt = -0.16
  return out
}

/** Non-book shelf objects. */
function Shape({ shape, color }: { shape: Shape; color: string }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => ref.current && (ref.current.rotation.y += dt * 0.6))
  if (shape === 'cube')
    return (
      <group ref={ref} position={[0, 0.16, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshPhysicalMaterial color="#0e1a0c" metalness={0.3} roughness={0.2} clearcoat={1} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.205, 0.205, 0.205]} />
          <meshBasicMaterial color={[0.5, 3, 0.4]} wireframe toneMapped={false} />
        </mesh>
      </group>
    )
  if (shape === 'atom')
    return (
      <group ref={ref} position={[0, 0.17, 0]}>
        <mesh>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color={[1.5, 1.8, 3.5]} toneMapped={false} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2 + i * 1.05, i * 0.6, 0]}>
            <torusGeometry args={[0.12, 0.004, 8, 64]} />
            <meshBasicMaterial color={[0.6, 0.9, 2.2]} toneMapped={false} />
          </mesh>
        ))}
      </group>
    )
  if (shape === 'coin')
    return (
      <group ref={ref} position={[0, 0.15, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.025, 6]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.25} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      </group>
    )
  return (
    <group ref={ref} position={[0, 0.14, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 40]} />
        <meshStandardMaterial color="#c0c4cc" metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <boxGeometry args={[0.05, 0.16, 0.005]} />
        <meshStandardMaterial color="#2a3f8a" />
      </mesh>
    </group>
  )
}

const tmpV = new THREE.Vector3()
const tmpQ = new THREE.Quaternion()

function Piece({ s, shelfY, firstPage }: { s: Slot; shelfY: number; firstPage: THREE.Texture | null }) {
  const spine = useMemo(() => spineTexture(s.item, s.color, s.seed), [s])
  const [cover, setCover] = useState<THREE.Texture | null>(null)
  const outer = useRef<THREE.Group>(null)
  const [hover, setHover] = useState(false)
  const station = useRoom((st) => st.station)
  const libIndex = useRoom((st) => st.libIndex)
  const setLibIndex = useRoom((st) => st.setLibIndex)
  const camera = useThree((st) => st.camera)
  const idx = s.item ? ORDER.indexOf(s.item) : -1
  const active = station === 'library' && idx === libIndex
  const interactive = station === 'library' && idx >= 0
  const idea = s.item?.kind === 'idea'
  const home = useMemo(() => (s.shape === 'book' ? new THREE.Vector3(s.x + (s.tilt ? 0.05 : 0), shelfY + s.h / 2, -D / 2 + s.d / 2 + 0.06) : new THREE.Vector3(s.x, shelfY, 0)), [s, shelfY])
  const homeQ = useMemo(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, s.tilt)), [s.tilt])
  const show = useRef(0)
  const rest = useRef(true)
  // the cover is only drawn the first time the item is pulled out
  useEffect(() => {
    if (active && !cover && s.item) setCover(coverTexture(s.item))
  }, [active, cover, s.item])

  useFrame((_, dt) => {
    const g = outer.current
    if (!g) return
    show.current = THREE.MathUtils.damp(show.current, active ? 1 : 0, 5, dt)
    const k = show.current
    // sitting on the shelf: nothing to animate
    if (k < 0.001 && !active && !hover) {
      if (!rest.current) {
        g.position.copy(home)
        g.quaternion.copy(homeQ)
        g.scale.setScalar(1)
        rest.current = true
      }
      return
    }
    rest.current = false
    // presentation pose: in front of the shelf, facing the camera, cover out
    const pres = tmpV.set(0.15, 1.75, D / 2 + 0.75)
    const e = k * k * (3 - 2 * k)
    // arc out of the shelf first, then glide to the front
    const pull = Math.min(1, k * 3)
    g.position.lerpVectors(home, pres, e)
    g.position.z += pull * 0.25 * (1 - e)
    if (!active && hover && k < 0.05) g.position.z = THREE.MathUtils.damp(g.position.z, 0.09, 10, dt)
    // orientation: books turn their cover (+x face → after -90° yaw) towards the camera
    const lookQ = tmpQ.setFromRotationMatrix(new THREE.Matrix4().lookAt(camera.position.clone().sub(ORIGIN), g.position, new THREE.Vector3(0, 1, 0)))
    const coverQ = lookQ.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)))
    g.quaternion.slerpQuaternions(homeQ, s.shape === 'book' ? coverQ : lookQ, e)
    const sc = 1 + e * (s.shape === 'book' ? 1.25 : 2.2)
    g.scale.setScalar(sc)
    if (k > 0.5) g.position.y += Math.sin(performance.now() / 700) * 0.015 * e
  })

  const mats = useMemo(() => {
    const body = new THREE.MeshStandardMaterial({ color: s.item ? s.color : new THREE.Color(s.color).multiplyScalar(0.7), roughness: 0.6, transparent: idea, opacity: idea ? 0.6 : 1 })
    const pages = new THREE.MeshStandardMaterial({ color: '#e8dcc4', roughness: 0.9 })
    const sp = new THREE.MeshStandardMaterial({ map: spine, roughness: 0.5, transparent: idea, opacity: idea ? 0.65 : 1, emissiveMap: s.item && !idea ? spine : null, emissive: new THREE.Color(s.item && !idea ? '#fff' : '#000'), emissiveIntensity: s.item && !idea ? 0.3 : 0 })
    const front = cover || firstPage ? new THREE.MeshStandardMaterial({ map: firstPage ?? cover, roughness: 0.7, color: firstPage ? '#b8b4ac' : '#fff', emissive: '#fff', emissiveMap: firstPage ?? cover, emissiveIntensity: firstPage ? 0.02 : 0.12 }) : body
    // box faces: +x (front cover), -x (back), +y, -y, +z (spine), -z
    return [front, body, pages, pages, sp, pages]
  }, [spine, cover, firstPage, s, idea])

  const handlers = {
    onPointerOver: (e: { stopPropagation: () => void }) => {
      if (!interactive) return
      e.stopPropagation()
      setHover(true)
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: () => {
      setHover(false)
      if (interactive) document.body.style.cursor = ''
    },
    onClick: (e: { stopPropagation: () => void }) => {
      if (!interactive) return
      e.stopPropagation()
      setLibIndex(idx)
    },
  }

  return (
    <group ref={outer} position={home} quaternion={homeQ}>
      {s.shape === 'book' ? (
        <mesh castShadow receiveShadow material={mats} {...handlers}>
          {/* +z is the spine (faces out of the shelf), +x is the front cover */}
          <boxGeometry args={[s.w, s.h, s.d]} />
        </mesh>
      ) : (
        <group {...handlers}>
          <Shape shape={s.shape} color={s.color} />
          <mesh visible={false}>
            <boxGeometry args={[0.28, 0.32, 0.28]} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function Plaque({ label }: { label: string }) {
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
    <mesh position={[0, -0.005, D / 2 + 0.012]}>
      <planeGeometry args={[0.8, 0.1]} />
      <meshStandardMaterial map={tex} metalness={0.7} roughness={0.35} />
    </mesh>
  )
}

/** Every filler book on every shelf in one instanced draw, sharing one texture. */
function FillerBooks({ rows }: { rows: { slots: Slot[]; shelfY: number }[] }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const fill = useMemo(() => rows.flatMap((r) => r.slots.filter((s) => !s.item).map((s) => ({ s, y: r.shelfY }))), [rows])
  const tex = useMemo(() => spineTexture(null, '#8a8a8a', 5), [])
  useLayoutEffect(() => {
    const m = mesh.current!
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    fill.forEach(({ s, y }, i) => {
      o.position.set(s.x + (s.tilt ? 0.05 : 0), y + s.h / 2, -D / 2 + s.d / 2 + 0.06)
      o.rotation.set(0, 0, s.tilt)
      o.scale.set(s.w, s.h, s.d)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      m.setColorAt(i, c.set(s.color).multiplyScalar(1.1))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [fill])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, fill.length]} receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial map={tex} roughness={0.65} />
    </instancedMesh>
  )
}

/** Wheel / swipe over the canvas scrolls through the shelf. */
function ScrollControl() {
  const station = useRoom((s) => s.station)
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    if (station !== 'library') return
    const el = gl.domElement
    let lock = 0
    let ty = 0
    const step = (d: number) => {
      const now = performance.now()
      if (now < lock) return
      lock = now + 320
      const st = useRoom.getState()
      st.setLibIndex((st.libIndex + d + ORDER.length) % ORDER.length)
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      if (Math.abs(e.deltaY) > 4) step(e.deltaY > 0 ? 1 : -1)
    }
    const ts = (e: TouchEvent) => (ty = e.touches[0].clientY)
    const te = (e: TouchEvent) => {
      const dy = ty - e.changedTouches[0].clientY
      if (Math.abs(dy) > 30) step(dy > 0 ? 1 : -1)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') step(1)
      if (e.key === 'ArrowUp') step(-1)
    }
    el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('touchstart', ts, { passive: true })
    el.addEventListener('touchend', te, { passive: true })
    window.addEventListener('keydown', key)
    return () => {
      el.removeEventListener('wheel', wheel)
      el.removeEventListener('touchstart', ts)
      el.removeEventListener('touchend', te)
      window.removeEventListener('keydown', key)
    }
  }, [station, gl])
  return null
}

export function Library() {
  const rows = useMemo(() => ROWS.map((id, i) => ({ id, slots: layoutRow(id, i) })), [])
  const paperCover = useLoader(THREE.TextureLoader, 'papers/aegisrag-p-1.jpg')
  useMemo(() => (paperCover.colorSpace = THREE.SRGBColorSpace), [paperCover])
  const wood = '#2b1a10'
  return (
    <Hotspot id="library" label={[-4.2, H + 0.3, -4.4]}>
      <ScrollControl />
      <group position={ORIGIN}>
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
          const shelfY = 0.14 + (ROWS.length - 1 - i) * ROW_H + 0.03
          return (
            <group key={row.id}>
              <group position={[0, shelfY - 0.03, 0]}>
                <mesh castShadow receiveShadow position={[0, 0.015, 0]}>
                  <boxGeometry args={[W - 0.08, 0.03, D]} />
                  <meshStandardMaterial color={wood} roughness={0.5} />
                </mesh>
                <Plaque label={shelves[row.id].label} />
                <mesh position={[0, ROW_H - 0.035, D / 2 - 0.04]}>
                  <boxGeometry args={[W - 0.2, 0.008, 0.01]} />
                  <meshBasicMaterial color={[3, 2.2, 1.4]} toneMapped={false} />
                </mesh>
              </group>
              {row.slots.map((s, k) => (s.item ? <Piece key={k} s={s} shelfY={shelfY} firstPage={s.item.id === 'aegisrag' ? paperCover : null} /> : null))}
            </group>
          )
        })}
        <FillerBooks rows={rows.map((r, i) => ({ slots: r.slots, shelfY: 0.14 + (ROWS.length - 1 - i) * ROW_H + 0.03 }))} />
        <Spot keep position={[0, H + 1.4, 2.6]} target={[0, 1.6, 0]} angle={0.62} penumbra={0.75} intensity={30} distance={10} color="#ffd9a8" />
        <PL position={[0.15, 1.9, D / 2 + 1.4]} intensity={2.5} distance={3} color="#ffe2b8" />
      </group>
    </Hotspot>
  )
}
