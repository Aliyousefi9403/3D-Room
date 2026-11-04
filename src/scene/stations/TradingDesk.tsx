import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Hotspot } from '../Hotspot'
import { PL } from '../Light'
import { Spot } from '../Spot'
import { every } from '../Light'
import { feeds, startMarket, read, Feed, isLive, ago } from '../../market'

const W = 768
const H = 448
const C = { bg: '#060a11', grid: 'rgba(120,160,220,0.07)', ink: '#e8eefb', dim: 'rgba(200,214,240,0.5)', up: '#3ddc97', dn: '#ff5c7a', gold: '#f5c26b', blue: '#8fb3ff' }
const fmt = (v: number, d = 2) => v.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d })

function badge(c: CanvasRenderingContext2D, f: Feed, t: number, x: number, y: number) {
  const live = isLive(f)
  const col = live ? C.dn : f.status === 'simulated' ? C.gold : C.blue
  c.globalAlpha = live ? 0.55 + 0.45 * Math.sin(t * 5) : 1
  c.fillStyle = col
  c.beginPath()
  c.arc(x, y - 6, 6, 0, Math.PI * 2)
  c.fill()
  c.globalAlpha = 1
  c.font = '600 15px JetBrains Mono, monospace'
  c.fillText(live ? 'LIVE' : f.status === 'simulated' ? 'SIM' : 'STALE', x + 12, y)
  c.fillStyle = C.dim
  c.font = '400 12px JetBrains Mono, monospace'
  const a = ago(f)
  c.fillText(a === null ? f.source : f.source + ' · ' + a + 's ago', x + 12, y + 16)
}

function grid(c: CanvasRenderingContext2D) {
  c.fillStyle = C.bg
  c.fillRect(0, 0, W, H)
  c.strokeStyle = C.grid
  c.lineWidth = 1
  for (let x = 0; x < W; x += 48) (c.beginPath(), c.moveTo(x, 0), c.lineTo(x, H), c.stroke())
  for (let y = 0; y < H; y += 48) (c.beginPath(), c.moveTo(0, y), c.lineTo(W, y), c.stroke())
}

/** Screen 2: BTC 1m candles, EMA20/50 and Bollinger bands. */
function drawChart(c: CanvasRenderingContext2D, f: Feed, t: number) {
  grid(c)
  const cs = f.candles.slice(-80)
  const off = f.candles.length - cs.length
  if (cs.length < 2) {
    c.fillStyle = C.dim
    c.font = '500 22px JetBrains Mono, monospace'
    c.fillText('connecting to market…', 40, H / 2)
    return
  }
  const i = f.ind
  const lo = Math.min(...cs.map((d, k) => Math.min(d.l, i.bbL[off + k] ?? d.l)))
  const hi = Math.max(...cs.map((d, k) => Math.max(d.h, i.bbU[off + k] ?? d.h)))
  const top = 74
  const bot = H - 28
  const Y = (v: number) => top + (1 - (v - lo) / (hi - lo || 1)) * (bot - top)
  const cw = (W - 100) / cs.length
  const X = (k: number) => 16 + k * cw + cw / 2
  // bollinger band fill
  c.beginPath()
  cs.forEach((_, k) => (k ? c.lineTo(X(k), Y(i.bbU[off + k])) : c.moveTo(X(k), Y(i.bbU[off + k]))))
  for (let k = cs.length - 1; k >= 0; k--) c.lineTo(X(k), Y(i.bbL[off + k]))
  c.fillStyle = 'rgba(143,179,255,0.07)'
  c.fill()
  cs.forEach((d, k) => {
    const up = d.c >= d.o
    c.strokeStyle = c.fillStyle = up ? C.up : C.dn
    c.beginPath()
    c.moveTo(X(k), Y(d.h))
    c.lineTo(X(k), Y(d.l))
    c.stroke()
    c.fillRect(X(k) - cw / 2 + 1, Math.min(Y(d.o), Y(d.c)), Math.max(1, cw - 2), Math.max(1.5, Math.abs(Y(d.o) - Y(d.c))))
  })
  const line = (arr: number[], col: string, w = 2) => {
    c.strokeStyle = col
    c.lineWidth = w
    c.beginPath()
    cs.forEach((_, k) => (k ? c.lineTo(X(k), Y(arr[off + k])) : c.moveTo(X(k), Y(arr[off + k]))))
    c.stroke()
    c.lineWidth = 1
  }
  line(i.ema20, C.gold)
  line(i.ema50, C.blue)
  // last price tag
  const last = cs[cs.length - 1].c
  c.setLineDash([4, 4])
  c.strokeStyle = 'rgba(232,238,251,0.35)'
  c.beginPath()
  c.moveTo(16, Y(last))
  c.lineTo(W - 84, Y(last))
  c.stroke()
  c.setLineDash([])
  c.fillStyle = C.ink
  c.fillRect(W - 84, Y(last) - 12, 80, 24)
  c.fillStyle = '#0a0c12'
  c.font = '600 14px JetBrains Mono, monospace'
  c.fillText('$' + fmt(last, 0), W - 80, Y(last) + 5)
  // header
  c.fillStyle = C.ink
  c.font = '600 26px JetBrains Mono, monospace'
  c.fillText('BTC-USD · 1m', 20, 40)
  if (f.change24 !== undefined) {
    c.fillStyle = f.change24 >= 0 ? C.up : C.dn
    c.font = '500 16px JetBrains Mono, monospace'
    c.fillText(`${f.change24 >= 0 ? '+' : ''}${(f.change24 * 100).toFixed(2)}% 24h`, 230, 40)
  }
  c.font = '400 12px JetBrains Mono, monospace'
  c.fillStyle = C.gold
  c.fillText('EMA20', 20, 62)
  c.fillStyle = C.blue
  c.fillText('EMA50', 74, 62)
  c.fillStyle = C.dim
  c.fillText('BB(20,2)', 128, 62)
  c.fillStyle = C.dn
  badge(c, f, t, W - 150, 34)
}

/** Screen 1: the live trade tape plus an ETH sparkline. */
function drawTape(c: CanvasRenderingContext2D, btc: Feed, eth: Feed) {
  grid(c)
  c.fillStyle = C.blue
  c.font = '600 20px JetBrains Mono, monospace'
  c.fillText('TAPE · BTC-USD', 22, 36)
  c.font = '400 15px JetBrains Mono, monospace'
  btc.trades.slice(-11).reverse().forEach((tr, k) => {
    const y = 70 + k * 24
    c.globalAlpha = 1 - k * 0.06
    c.fillStyle = C.dim
    c.fillText(new Date(tr.t).toTimeString().slice(0, 8), 22, y)
    c.fillStyle = tr.side === 'buy' ? C.up : C.dn
    c.fillText('$' + fmt(tr.price), 124, y)
    c.fillStyle = C.ink
    c.fillText(tr.size.toFixed(5), 270, y)
    c.fillStyle = tr.side === 'buy' ? C.up : C.dn
    c.fillRect(380, y - 11, Math.min(330, Math.sqrt(tr.size) * 260), 12)
  })
  c.globalAlpha = 1
  // ETH sparkline
  const e = eth.candles.slice(-80).map((x) => x.c)
  const y0 = H - 92
  c.strokeStyle = 'rgba(200,214,240,0.15)'
  c.beginPath()
  c.moveTo(22, y0 - 8)
  c.lineTo(W - 22, y0 - 8)
  c.stroke()
  c.fillStyle = C.ink
  c.font = '600 16px JetBrains Mono, monospace'
  c.fillText(`ETH-USD  ${eth.last ? '$' + fmt(eth.last) : '…'}`, 22, y0 + 14)
  if (e.length > 2) {
    const lo = Math.min(...e)
    const hi = Math.max(...e)
    c.strokeStyle = C.blue
    c.lineWidth = 2
    c.beginPath()
    e.forEach((v, k) => {
      const x = 260 + (k / (e.length - 1)) * (W - 290)
      const y = y0 + 64 - ((v - lo) / (hi - lo || 1)) * 60
      k ? c.lineTo(x, y) : c.moveTo(x, y)
    })
    c.stroke()
    c.lineWidth = 1
  }
}

/** Screen 3: indicators and a transparent rule-based read. */
function drawSignals(c: CanvasRenderingContext2D, f: Feed) {
  grid(c)
  c.fillStyle = C.ink
  c.font = '600 20px JetBrains Mono, monospace'
  c.fillText('SIGNALS · computed live', 22, 36)
  const r = read(f)
  if (!r) return
  const k = f.candles.length - 1
  // RSI gauge
  const cx = 150
  const cy = 190
  c.lineWidth = 16
  c.strokeStyle = 'rgba(255,255,255,0.08)'
  c.beginPath()
  c.arc(cx, cy, 90, Math.PI, 0)
  c.stroke()
  const a = Math.PI + (r.rsi / 100) * Math.PI
  c.strokeStyle = r.rsi > 70 ? C.dn : r.rsi < 30 ? C.up : C.gold
  c.beginPath()
  c.arc(cx, cy, 90, Math.PI, a)
  c.stroke()
  c.lineWidth = 1
  c.fillStyle = C.ink
  c.font = '600 38px JetBrains Mono, monospace'
  c.textAlign = 'center'
  c.fillText(r.rsi.toFixed(0), cx, cy - 6)
  c.font = '400 14px JetBrains Mono, monospace'
  c.fillStyle = C.dim
  c.fillText('RSI(14)', cx, cy + 20)
  c.textAlign = 'left'
  // MACD histogram
  const hist = f.ind.macd.slice(-60).map((m, j) => m - f.ind.signal[f.ind.signal.length - 60 + j])
  const mx = Math.max(...hist.map(Math.abs)) || 1
  const hx = 300
  const hy = 160
  c.fillStyle = C.dim
  c.fillText('MACD(12,26,9)', hx, 80)
  hist.forEach((v, j) => {
    c.fillStyle = v >= 0 ? C.up : C.dn
    const hgt = (v / mx) * 60
    c.fillRect(hx + j * 7, hy - Math.max(0, hgt), 5, Math.abs(hgt))
  })
  // read
  const rows: [string, string, string][] = [
    ['trend', r.trend > 0 ? 'EMA20 > EMA50' : 'EMA20 < EMA50', r.trend > 0 ? C.up : C.dn],
    ['momentum', r.mom > 0 ? 'MACD above signal' : 'MACD below signal', r.mom > 0 ? C.up : C.dn],
    ['band', `${(r.bbPos * 100).toFixed(0)}% of Bollinger range`, C.blue],
  ]
  rows.forEach(([kk, v, col], j) => {
    const y = 290 + j * 30
    c.fillStyle = C.dim
    c.font = '400 15px JetBrains Mono, monospace'
    c.fillText(kk.padEnd(10), 22, y)
    c.fillStyle = col
    c.fillText(v, 140, y)
  })
  // score bar
  const y = H - 36
  c.fillStyle = 'rgba(255,255,255,0.07)'
  c.fillRect(22, y, W - 44, 10)
  c.fillStyle = r.score >= 0 ? C.up : C.dn
  const mid = 22 + (W - 44) / 2
  c.fillRect(Math.min(mid, mid + r.score * (W - 44) / 2), y, Math.abs(r.score * (W - 44) / 2), 10)
  c.fillStyle = C.ink
  c.fillRect(mid - 1, y - 4, 2, 18)
  c.fillStyle = C.dim
  c.font = '400 12px JetBrains Mono, monospace'
  c.fillText('bearish', 22, y - 8)
  c.fillText('bullish', W - 80, y - 8)
  void k
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
  useEffect(startMarket, [])
  const screens = useMemo(
    () =>
      [0, 1, 2].map(() => {
        const canvas = document.createElement('canvas')
        canvas.width = W
        canvas.height = H
        const tex = new THREE.CanvasTexture(canvas)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 8
        return { ctx: canvas.getContext('2d')!, tex }
      }),
    [],
  )
  const acc = useRef(0)
  useFrame(({ clock }, dt) => {
    acc.current += dt
    if (acc.current < every(0.15)) return
    acc.current = 0
    const btc = feeds['BTC-USD']
    drawTape(screens[0].ctx, btc, feeds['ETH-USD'])
    drawChart(screens[1].ctx, btc, clock.elapsedTime)
    drawSignals(screens[2].ctx, btc)
    screens.forEach((s) => (s.tex.needsUpdate = true))
  })
  const st = { screens }

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
        <PL position={[0, 1.2, 0.6]} color="#7aa6ff" intensity={3} distance={3.5} />
        <Spot position={[0, 3.9, 1.6]} target={[0, 0.8, 0]} angle={0.55} penumbra={0.8} intensity={14} distance={6} color="#cfe0ff" />
      </group>
    </Hotspot>
  )
}
