import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Hotspot } from '../Hotspot'
import { PL } from '../Light'
import { Spot } from '../Spot'
import { every } from '../Light'

const W = 1800
const H = 1000

/** The monitor loop from AegisRAG, replayed as a status wall. */
const LOOP = [
  { ev: 'query', text: 'Q: how does a backdoor keep persistent access?', s: [1, 1, 1] },
  { ev: 'retrieve', text: 'retrieve k=10 · drop quarantined · keep top 3', s: [1, 1, 1] },
  { ev: 'generate', text: 'draft: “…attackers engraft malicious package…”', s: [1, 1, 1] },
  { ev: 'φ1', text: 'VIOLATION · rare copied word “engraft” (Zipf 1.9) ∉ MITRE', s: [0, 1, 1] },
  { ev: 'blame', text: 'blame p:backdoor§2 → quarantine (append-only)', s: [0, 1, 1] },
  { ev: 're-ask', text: 'feedback → regenerate (1/2)', s: [2, 1, 1] },
  { ev: 'φ2', text: 'VIOLATION · refusal but MITRE covers T1547', s: [1, 0, 1] },
  { ev: 'restore', text: 'add trusted MITRE entry T1547 to context', s: [1, 2, 1] },
  { ev: 'generate', text: 'answer grounded in ATT&CK T1547 · released', s: [1, 1, 1] },
  { ev: 'φ3', text: 'G(quarantined(p) → G ¬inContext(p)) holds', s: [1, 1, 1] },
]

const C = { ok: '#3ddc97', bad: '#ff5c7a', warn: '#f5c26b', ink: '#e8eefb', dim: 'rgba(200,214,240,0.5)', bg: '#060910', panel: '#0b1019' }

function tile(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string) {
  c.fillStyle = C.panel
  c.fillRect(x, y, w, h)
  c.strokeStyle = 'rgba(143,179,255,0.18)'
  c.lineWidth = 2
  c.strokeRect(x + 1, y + 1, w - 2, h - 2)
  c.fillStyle = C.dim
  c.font = '500 22px JetBrains Mono, monospace'
  c.fillText(title, x + 24, y + 40)
}

function draw(c: CanvasRenderingContext2D, step: number, t: number, quarantined: number) {
  c.fillStyle = C.bg
  c.fillRect(0, 0, W, H)
  const g = 16
  const tw = (W - g * 4) / 3
  const th = (H - g * 3) / 2
  const cur = LOOP[step % LOOP.length]
  const rules = [
    { id: 'φ1', name: 'NO STRANGE WORDS', st: cur.s[0] },
    { id: 'φ2', name: 'DON’T GIVE UP WRONGLY', st: cur.s[1] },
    { id: 'φ3', name: 'NEVER TRUST AGAIN', st: cur.s[2] },
  ]
  rules.forEach((r, i) => {
    const x = g + i * (tw + g)
    tile(c, x, g, tw, th, `RULE ${r.id}`)
    const col = r.st === 0 ? C.bad : r.st === 2 ? C.warn : C.ok
    const pulse = r.st === 0 ? 0.55 + 0.45 * Math.sin(t * 8) : 1
    c.globalAlpha = pulse
    c.fillStyle = col
    c.beginPath()
    c.arc(x + tw / 2, g + th / 2 - 10, 92, 0, Math.PI * 2)
    c.lineWidth = 10
    c.strokeStyle = col
    c.stroke()
    c.globalAlpha = 1
    c.font = '700 64px JetBrains Mono, monospace'
    c.textAlign = 'center'
    c.fillStyle = col
    c.fillText(r.st === 0 ? '✕' : r.st === 2 ? '…' : '✓', x + tw / 2, g + th / 2 + 12)
    c.fillStyle = C.ink
    c.font = '600 28px Inter, sans-serif'
    c.fillText(r.name, x + tw / 2, g + th - 60)
    c.fillStyle = col
    c.font = '500 22px JetBrains Mono, monospace'
    c.fillText(r.st === 0 ? 'VIOLATED' : r.st === 2 ? 'RE-CHECKING' : 'HOLDS', x + tw / 2, g + th - 26)
    c.textAlign = 'left'
  })

  // trace
  const y2 = g * 2 + th
  tile(c, g, y2, tw * 2 + g, th, 'TRACE')
  const shown = LOOP.slice(0, (step % LOOP.length) + 1).slice(-8)
  shown.forEach((e, i) => {
    const yy = y2 + 84 + i * 46
    const bad = e.text.startsWith('VIOLATION')
    c.fillStyle = bad ? C.bad : e.ev === 'restore' || e.ev === 're-ask' ? C.warn : C.ok
    c.font = '600 24px JetBrains Mono, monospace'
    c.fillText(e.ev.padEnd(9), g + 28, yy)
    c.fillStyle = i === shown.length - 1 ? C.ink : C.dim
    c.font = '400 24px JetBrains Mono, monospace'
    c.fillText(e.text, g + 190, yy)
  })
  // cursor
  if (Math.sin(t * 6) > 0) {
    c.fillStyle = C.ink
    c.fillRect(g + 28, y2 + 84 + shown.length * 46 - 22, 14, 26)
  }

  // quarantine memory
  const x3 = g * 3 + tw * 2
  tile(c, x3, y2, tw, th, 'QUARANTINE MEMORY')
  const mem = ['backdoor§2', 'xss§4', 'arp_spoofing§1', 'port_scan§3', 'sql_inj§2', 'udp_flood§5'].slice(0, quarantined)
  mem.forEach((m, i) => {
    const yy = y2 + 90 + i * 50
    c.fillStyle = 'rgba(255,92,122,0.12)'
    c.fillRect(x3 + 24, yy - 30, tw - 48, 40)
    c.fillStyle = C.bad
    c.font = '500 24px JetBrains Mono, monospace'
    c.fillText(`⛔ ${m}`, x3 + 40, yy)
  })
  c.fillStyle = C.dim
  c.font = '400 20px JetBrains Mono, monospace'
  c.fillText('append-only · sha256-pinned MITRE STIX', x3 + 24, y2 + th - 24)
}

export function MonitorWall() {
  const { tex, ctx } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return { tex: t, ctx: canvas.getContext('2d')! }
  }, [])
  const st = useRef({ step: 0, acc: 0, frame: 0, q: 1 })
  useFrame(({ clock }, dt) => {
    const s = st.current
    s.acc += dt
    s.frame += dt
    if (s.acc > 1.6) {
      s.acc = 0
      s.step++
      if (s.step % LOOP.length === 4) s.q = Math.min(6, s.q + 1)
    }
    if (s.frame < every(1 / 10)) return
    s.frame = 0
    draw(ctx, s.step, clock.elapsedTime, s.q)
    tex.needsUpdate = true
  })

  const sw = 3.3
  const sh = (sw * H) / W
  return (
    <Hotspot id="rv" label={[0.6, 3.6, -4.7]}>
      <group position={[0.6, 0, -4.93]}>
        <RoundedBox args={[sw + 0.12, sh + 0.12, 0.06]} radius={0.02} position={[0, 2.3, 0]} castShadow>
          <meshStandardMaterial color="#07090d" metalness={0.6} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, 2.3, 0.032]}>
          <planeGeometry args={[sw, sh]} />
          <meshBasicMaterial map={tex} toneMapped={false} color={[1.25, 1.25, 1.25]} />
        </mesh>
        {/* console */}
        <RoundedBox args={[2.6, 0.82, 0.55]} radius={0.03} position={[0, 0.41, 0.3]} castShadow receiveShadow>
          <meshStandardMaterial color="#141821" metalness={0.4} roughness={0.45} />
        </RoundedBox>
        <mesh position={[0, 0.83, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 0.48]} />
          <meshStandardMaterial color="#0b0e14" metalness={0.5} roughness={0.25} />
        </mesh>
        {Array.from({ length: 18 }).map((_, i) => (
          <mesh key={i} position={[-1.1 + i * 0.13, 0.84, 0.42]}>
            <boxGeometry args={[0.07, 0.012, 0.05]} />
            <meshBasicMaterial color={i % 7 === 3 ? [3, 0.3, 0.4] : i % 3 ? [0.4, 1.2, 2.5] : [0.3, 2.5, 1.2]} toneMapped={false} />
          </mesh>
        ))}
        <PL position={[0, 2.3, 0.8]} color="#6f9bff" intensity={4} distance={4} />
        <Spot position={[0, 4.1, 1.6]} target={[0, 2.2, 0]} angle={0.7} penumbra={0.9} intensity={6} distance={6} color="#b7c8ff" />
      </group>
    </Hotspot>
  )
}
