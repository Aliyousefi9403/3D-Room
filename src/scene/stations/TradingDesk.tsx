import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Hotspot } from '../Hotspot'
import { Spot } from '../Spot'

/** Live-drawn screens. Decorative simulation, clearly not real fund data. */
function useScreens() {
  return useMemo(() => {
    const mk = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 768
      canvas.height = 448
      const tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      return { canvas, ctx: canvas.getContext('2d')!, tex }
    }
    const candles: { o: number; c: number; h: number; l: number }[] = []
    let p = 100
    for (let i = 0; i < 70; i++) {
      const o = p
      p = p + (Math.random() - 0.47) * 2.2
      candles.push({ o, c: p, h: Math.max(o, p) + Math.random() * 1.2, l: Math.min(o, p) - Math.random() * 1.2 })
    }
    const equity: number[] = [1]
    for (let i = 0; i < 160; i++) equity.push(equity[i] * (1 + (Math.random() - 0.46) * 0.012))
    const log: string[] = []
    return { screens: [mk(), mk(), mk()], candles, equity, log, price: p }
  }, [])
}

const AGENTS = ['research', 'signal', 'portfolio', 'risk', 'execution']
const MSG = [
  'thesis updated · sector rotation',
  'score 0.62 → 0.71',
  'rebalance proposed · 4 legs',
  'check passed · gross 1.4x',
  'VETO · single-name limit',
  'routed · TWAP 12 slices',
  'filled · slippage 1.8bp',
  'news ingested · 38 items',
  'regime: low-vol trend',
]

function drawCandles(ctx: CanvasRenderingContext2D, w: number, h: number, data: { o: number; c: number; h: number; l: number }[], t: number) {
  ctx.fillStyle = '#070b12'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(120,160,220,0.08)'
  for (let x = 0; x < w; x += 48) (ctx.beginPath(), ctx.moveTo(x, 0), ctx.lineTo(x, h), ctx.stroke())
  for (let y = 0; y < h; y += 48) (ctx.beginPath(), ctx.moveTo(0, y), ctx.lineTo(w, y), ctx.stroke())
  const lo = Math.min(...data.map((d) => d.l))
  const hi = Math.max(...data.map((d) => d.h))
  const Y = (v: number) => 70 + (1 - (v - lo) / (hi - lo)) * (h - 110)
  const cw = (w - 40) / data.length
  data.forEach((d, i) => {
    const x = 20 + i * cw
    const up = d.c >= d.o
    ctx.strokeStyle = ctx.fillStyle = up ? '#3ddc97' : '#ff5c7a'
    ctx.beginPath()
    ctx.moveTo(x + cw / 2, Y(d.h))
    ctx.lineTo(x + cw / 2, Y(d.l))
    ctx.stroke()
    ctx.fillRect(x + 1, Math.min(Y(d.o), Y(d.c)), cw - 2, Math.max(2, Math.abs(Y(d.o) - Y(d.c))))
  })
  // moving average
  ctx.strokeStyle = '#f5c26b'
  ctx.lineWidth = 2
  ctx.beginPath()
  data.forEach((_, i) => {
    const s = data.slice(Math.max(0, i - 9), i + 1)
    const m = s.reduce((a, b) => a + b.c, 0) / s.length
    const x = 20 + i * cw + cw / 2
    i ? ctx.lineTo(x, Y(m)) : ctx.moveTo(x, Y(m))
  })
  ctx.stroke()
  ctx.lineWidth = 1
  const last = data[data.length - 1]
  ctx.fillStyle = '#e8eefb'
  ctx.font = '600 26px JetBrains Mono, monospace'
  ctx.fillText('AGNT · 5m', 22, 40)
  ctx.fillStyle = last.c >= data[data.length - 2].c ? '#3ddc97' : '#ff5c7a'
  ctx.fillText(last.c.toFixed(2), w - 130, 40)
  ctx.fillStyle = 'rgba(232,238,251,0.45)'
  ctx.font = '400 14px JetBrains Mono, monospace'
  ctx.fillText('SIMULATED FEED', w - 150, h - 14)
  // live dot
  ctx.fillStyle = `rgba(255,92,122,${0.5 + 0.5 * Math.sin(t * 6)})`
  ctx.beginPath()
  ctx.arc(w - 150, 32, 6, 0, Math.PI * 2)
  ctx.fill()
}

function drawLog(ctx: CanvasRenderingContext2D, w: number, h: number, log: string[]) {
  ctx.fillStyle = '#060a10'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#8fb3ff'
  ctx.font = '600 22px JetBrains Mono, monospace'
  ctx.fillText('AGENT BUS', 22, 38)
  ctx.font = '400 17px JetBrains Mono, monospace'
  log.slice(-14).forEach((line, i) => {
    const veto = line.includes('VETO')
    ctx.fillStyle = veto ? '#ff5c7a' : i === Math.min(13, log.length - 1) ? '#e8eefb' : 'rgba(200,214,240,0.6)'
    ctx.fillText(line, 22, 76 + i * 26)
  })
}

function drawEquity(ctx: CanvasRenderingContext2D, w: number, h: number, eq: number[], t: number) {
  ctx.fillStyle = '#070b12'
  ctx.fillRect(0, 0, w, h)
  const lo = Math.min(...eq)
  const hi = Math.max(...eq)
  const Y = (v: number) => 70 + (1 - (v - lo) / (hi - lo + 1e-6)) * (h * 0.5)
  const g = ctx.createLinearGradient(0, 70, 0, h * 0.6 + 70)
  g.addColorStop(0, 'rgba(143,179,255,0.45)')
  g.addColorStop(1, 'rgba(143,179,255,0)')
  ctx.beginPath()
  eq.forEach((v, i) => {
    const x = 20 + (i / (eq.length - 1)) * (w - 40)
    i ? ctx.lineTo(x, Y(v)) : ctx.moveTo(x, Y(v))
  })
  ctx.strokeStyle = '#8fb3ff'
  ctx.lineWidth = 2.5
  ctx.stroke()
  ctx.lineTo(w - 20, h * 0.6 + 70)
  ctx.lineTo(20, h * 0.6 + 70)
  ctx.fillStyle = g
  ctx.fill()
  ctx.lineWidth = 1
  ctx.fillStyle = '#e8eefb'
  ctx.font = '600 22px JetBrains Mono, monospace'
  ctx.fillText('BOOK · EQUITY', 22, 38)
  // agent consensus bars
  AGENTS.forEach((a, i) => {
    const y = h * 0.6 + 100 + i * 20
    const v = 0.5 + 0.45 * Math.sin(t * 0.8 + i * 1.7)
    ctx.fillStyle = 'rgba(200,214,240,0.55)'
    ctx.font = '400 14px JetBrains Mono, monospace'
    ctx.fillText(a.padEnd(10), 22, y)
    ctx.fillStyle = i === 3 ? '#f5c26b' : '#3ddc97'
    ctx.fillRect(130, y - 11, v * (w - 170), 10)
  })
}

function Monitor({ position, rotationY, tex }: { position: [number, number, number]; rotationY: number; tex: THREE.Texture }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[0.82, 0.5, 0.035]} radius={0.012} castShadow>
        <meshStandardMaterial color="#0b0d12" metalness={0.6} roughness={0.35} />
      </RoundedBox>
      <mesh position={[0, 0, 0.019]}>
        <planeGeometry args={[0.78, 0.455]} />
        <meshBasicMaterial map={tex} toneMapped={false} color={[1.35, 1.35, 1.35]} />
      </mesh>
      <mesh position={[0, -0.32, -0.04]}>
        <boxGeometry args={[0.04, 0.2, 0.03]} />
        <meshStandardMaterial color="#1b1f29" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

export function TradingDesk() {
  const st = useScreens()
  const acc = useRef({ t: 0, tick: 0, logT: 0 })
  useFrame((_, dt) => {
    const a = acc.current
    a.t += dt
    a.tick += dt
    a.logT += dt
    if (a.tick < 0.1) return
    a.tick = 0
    // evolve the last candle, occasionally open a new one
    const c = st.candles
    const last = c[c.length - 1]
    st.price += (Math.random() - 0.48) * 0.5
    last.c = st.price
    last.h = Math.max(last.h, st.price)
    last.l = Math.min(last.l, st.price)
    if (Math.random() < 0.04) {
      c.shift()
      c.push({ o: st.price, c: st.price, h: st.price, l: st.price })
      st.equity.shift()
      st.equity.push(st.equity[st.equity.length - 1] * (1 + (Math.random() - 0.46) * 0.012))
    }
    if (a.logT > 0.9) {
      a.logT = 0
      const ag = AGENTS[Math.floor(Math.random() * AGENTS.length)]
      const ts = new Date().toISOString().slice(11, 19)
      st.log.push(`${ts} [${ag.padEnd(9)}] ${MSG[Math.floor(Math.random() * MSG.length)]}`)
      if (st.log.length > 40) st.log.shift()
    }
    const [s1, s2, s3] = st.screens
    drawLog(s1.ctx, 768, 448, st.log)
    drawCandles(s2.ctx, 768, 448, c, a.t)
    drawEquity(s3.ctx, 768, 448, st.equity, a.t)
    st.screens.forEach((s) => (s.tex.needsUpdate = true))
  })

  return (
    <Hotspot id="quant" label={[-3, 2.05, 1.4]}>
      <group position={[-3, 0, 1.4]}>
        {/* desk */}
        <RoundedBox args={[2.5, 0.06, 0.9]} radius={0.02} position={[0, 0.76, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#1a1d24" roughness={0.35} metalness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0.735, 0.452]}>
          <boxGeometry args={[2.5, 0.012, 0.004]} />
          <meshBasicMaterial color={[0.6, 1.4, 3]} toneMapped={false} />
        </mesh>
        {[-1.15, 1.15].map((x) => (
          <mesh key={x} castShadow position={[x, 0.37, 0]}>
            <boxGeometry args={[0.06, 0.74, 0.8]} />
            <meshStandardMaterial color="#0f1116" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        <Monitor position={[-0.84, 1.18, 0.02]} rotationY={0.38} tex={st.screens[0].tex} />
        <Monitor position={[0, 1.18, -0.12]} rotationY={0} tex={st.screens[1].tex} />
        <Monitor position={[0.84, 1.18, 0.02]} rotationY={-0.38} tex={st.screens[2].tex} />
        {/* keyboard + mouse */}
        <RoundedBox args={[0.5, 0.02, 0.16]} radius={0.006} position={[0, 0.8, 0.26]} castShadow>
          <meshStandardMaterial color="#20242e" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0.4, 0.8, 0.26]} castShadow>
          <capsuleGeometry args={[0.025, 0.04, 4, 12]} />
          <meshStandardMaterial color="#20242e" roughness={0.4} />
        </mesh>
        {/* chair */}
        <group position={[0.95, 0, 0.95]} rotation={[0, Math.PI + 0.7, 0]}>
          <RoundedBox args={[0.55, 0.08, 0.52]} radius={0.03} position={[0, 0.5, 0]} castShadow>
            <meshStandardMaterial color="#111318" roughness={0.7} />
          </RoundedBox>
          <RoundedBox args={[0.52, 0.7, 0.07]} radius={0.04} position={[0, 0.92, -0.25]} rotation={[-0.12, 0, 0]} castShadow>
            <meshStandardMaterial color="#111318" roughness={0.7} />
          </RoundedBox>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.45, 12]} />
            <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[Math.cos((i / 5) * Math.PI * 2) * 0.2, 0.04, Math.sin((i / 5) * Math.PI * 2) * 0.2]} rotation={[0, -(i / 5) * Math.PI * 2, 0]} castShadow>
              <boxGeometry args={[0.4, 0.03, 0.04]} />
              <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
        <pointLight position={[0, 1.2, 0.6]} color="#7aa6ff" intensity={3} distance={3.5} />
        <Spot position={[0, 3.9, 1.6]} target={[0, 0.8, 0]} angle={0.55} penumbra={0.8} intensity={14} distance={6} color="#cfe0ff" />
      </group>
    </Hotspot>
  )
}
