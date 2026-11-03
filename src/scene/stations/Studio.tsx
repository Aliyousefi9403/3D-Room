import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Html } from '@react-three/drei'
import { useRoom } from '../../store'
import { studio } from '../../content'
import { Hotspot } from '../Hotspot'

const W = 960
const H = 540
export const EP_LEN = 32

const ease = (k: number) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k))
const seg = (t: number, a: number, b: number) => ease((t - a) / (b - a))
const C = { bg: '#0e1424', card: '#f4f1ea', ink: '#1b1d26', red: '#ff4f6b', green: '#3ddc97', blue: '#5b8cff', gold: '#f5c26b', dim: '#8a93ad' }

function caption(c: CanvasRenderingContext2D, text: string, k: number) {
  c.globalAlpha = k
  c.fillStyle = 'rgba(0,0,0,0.55)'
  const w = c.measureText(text).width
  c.font = '600 26px Inter, sans-serif'
  const tw = c.measureText(text).width
  c.fillRect(W / 2 - tw / 2 - 16, H - 92, tw + 32, 44)
  c.fillStyle = '#fff'
  c.textAlign = 'center'
  c.fillText(text, W / 2, H - 61)
  c.textAlign = 'left'
  c.globalAlpha = 1
  void w
}

function hook(c: CanvasRenderingContext2D, x: number, y: number, s: number, a: number) {
  c.save()
  c.translate(x, y)
  c.rotate(a)
  c.strokeStyle = C.dim
  c.lineWidth = 3
  c.beginPath()
  c.moveTo(0, -200)
  c.lineTo(0, 0)
  c.stroke()
  c.strokeStyle = C.gold
  c.lineWidth = 9 * s
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(0, 0)
  c.lineTo(0, 50 * s)
  c.arc(-22 * s, 50 * s, 22 * s, 0, Math.PI * 0.9)
  c.stroke()
  c.restore()
}

function email(c: CanvasRenderingContext2D, x: number, y: number, hi: number) {
  c.fillStyle = C.card
  c.beginPath()
  c.roundRect(x, y, 520, 250, 18)
  c.fill()
  c.fillStyle = C.ink
  c.font = '700 24px Inter, sans-serif'
  c.fillText('⚠ URGENT: account locked in 24h', x + 28, y + 52)
  c.font = '400 18px Inter, sans-serif'
  c.fillStyle = '#5a5f70'
  c.fillText('From: Security Team', x + 28, y + 88)
  const dom = '<secur1ty@paypa1-support.co>'
  c.fillText(dom, x + 200, y + 88)
  if (hi > 0) {
    c.strokeStyle = C.red
    c.lineWidth = 3
    c.globalAlpha = hi
    c.beginPath()
    c.ellipse(x + 200 + c.measureText(dom).width / 2, y + 82, c.measureText(dom).width / 2 + 14, 20, 0, 0, Math.PI * 2 * hi)
    c.stroke()
    c.globalAlpha = 1
  }
  c.fillStyle = '#3a3f50'
  c.fillText('We noticed unusual sign-in activity. Verify', x + 28, y + 130)
  c.fillText('your identity now to avoid suspension.', x + 28, y + 156)
  c.fillStyle = C.blue
  c.beginPath()
  c.roundRect(x + 28, y + 182, 170, 44, 10)
  c.fill()
  c.fillStyle = '#fff'
  c.font = '700 18px Inter, sans-serif'
  c.fillText('Verify now →', x + 50, y + 210)
}

function cursor(c: CanvasRenderingContext2D, x: number, y: number) {
  c.fillStyle = '#fff'
  c.strokeStyle = '#000'
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(x, y)
  c.lineTo(x, y + 30)
  c.lineTo(x + 8, y + 23)
  c.lineTo(x + 14, y + 36)
  c.lineTo(x + 19, y + 33)
  c.lineTo(x + 13, y + 21)
  c.lineTo(x + 23, y + 21)
  c.closePath()
  c.fill()
  c.stroke()
}

function login(c: CanvasRenderingContext2D, x: number, y: number, typed: number) {
  c.fillStyle = '#fff'
  c.beginPath()
  c.roundRect(x, y, 380, 300, 16)
  c.fill()
  c.fillStyle = '#eef0f5'
  c.fillRect(x, y, 380, 40)
  c.fillStyle = C.red
  c.font = '500 15px JetBrains Mono, monospace'
  c.fillText('🔓 paypa1-support.co/login', x + 16, y + 26)
  c.fillStyle = C.ink
  c.font = '700 26px Inter, sans-serif'
  c.fillText('Sign in', x + 30, y + 90)
  ;['Email', 'Password'].forEach((l, i) => {
    c.strokeStyle = '#c9ccd6'
    c.lineWidth = 2
    c.strokeRect(x + 30, y + 112 + i * 64, 320, 44)
    c.fillStyle = '#3a3f50'
    c.font = '400 18px Inter, sans-serif'
    const full = i ? '••••••••••' : 'ali@example.com'
    const n = Math.floor(full.length * Math.min(1, Math.max(0, typed * 2 - i)))
    c.fillText(full.slice(0, n) || l, x + 44, y + 141 + i * 64)
  })
}

function hacker(c: CanvasRenderingContext2D, x: number, y: number, glow: number) {
  c.save()
  c.translate(x, y)
  c.fillStyle = '#1b2034'
  c.beginPath()
  c.arc(0, 0, 70, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#0a0d18'
  c.beginPath()
  c.arc(0, -10, 44, Math.PI, 0)
  c.lineTo(44, 40)
  c.lineTo(-44, 40)
  c.fill()
  c.fillStyle = `rgba(255,79,107,${0.6 + glow * 0.4})`
  c.fillRect(-26, -8, 16, 7)
  c.fillRect(10, -8, 16, 7)
  c.restore()
}

function shield(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.save()
  c.translate(x, y)
  c.scale(s, s)
  c.fillStyle = C.green
  c.beginPath()
  c.moveTo(0, -80)
  c.lineTo(70, -50)
  c.quadraticCurveTo(70, 50, 0, 90)
  c.quadraticCurveTo(-70, 50, -70, -50)
  c.closePath()
  c.fill()
  c.strokeStyle = '#0e1424'
  c.lineWidth = 12
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(-28, 4)
  c.lineTo(-6, 28)
  c.lineTo(32, -20)
  c.stroke()
  c.restore()
}

export function drawEpisode(c: CanvasRenderingContext2D, t: number) {
  c.fillStyle = C.bg
  c.fillRect(0, 0, W, H)
  // drifting background dots
  for (let i = 0; i < 40; i++) {
    c.fillStyle = 'rgba(91,140,255,0.12)'
    c.beginPath()
    c.arc((i * 137 + t * 12) % W, (i * 71) % H, 2 + (i % 3), 0, Math.PI * 2)
    c.fill()
  }
  if (t < 5) {
    const k = seg(t, 0, 1)
    hook(c, W / 2, 120 + (1 - k) * -200, 1.4, Math.sin(t * 2) * 0.15)
    c.globalAlpha = seg(t, 0.6, 1.6)
    c.fillStyle = '#fff'
    c.textAlign = 'center'
    c.font = '800 64px Inter, sans-serif'
    c.fillText('PHISHING', W / 2, 330)
    c.font = '500 26px Inter, sans-serif'
    c.fillStyle = C.gold
    c.fillText('step by step', W / 2, 372)
    c.textAlign = 'left'
    c.globalAlpha = 1
  } else if (t < 11) {
    const k = seg(t, 5, 6)
    email(c, W / 2 - 260 + (1 - k) * 700, 110, seg(t, 7.5, 8.6))
    caption(c, t < 7.5 ? 'It starts with urgency.' : 'Look closely: paypa1, with a one.', seg(t, 5.5, 6))
  } else if (t < 16) {
    email(c, W / 2 - 260, 110, 1)
    const k = seg(t, 11, 12.6)
    const cx = 760 - k * 450
    const cy = 470 - k * 150
    cursor(c, cx, cy)
    if (t > 12.6 && t < 13.4) {
      c.strokeStyle = 'rgba(255,255,255,0.8)'
      c.lineWidth = 3
      c.beginPath()
      c.arc(cx + 4, cy + 4, (t - 12.6) * 60, 0, Math.PI * 2)
      c.stroke()
    }
    if (t > 13.4) {
      c.globalAlpha = seg(t, 13.4, 14)
      c.fillStyle = 'rgba(14,20,36,0.85)'
      c.fillRect(0, 0, W, H)
      login(c, W / 2 - 190, 90, 0)
      c.globalAlpha = 1
    }
    caption(c, t < 13.4 ? 'One click…' : '…lands on a perfect lookalike.', 1)
  } else if (t < 22) {
    login(c, 120, 100, seg(t, 16, 18.5))
    hacker(c, 790, 250, Math.sin(t * 6) * 0.5 + 0.5)
    // credentials fly as packets
    if (t > 18.5)
      for (let i = 0; i < 6; i++) {
        const k = ((t - 18.5) * 0.7 + i * 0.16) % 1
        const x = 500 + k * 230
        const y = 260 - Math.sin(k * Math.PI) * 120
        c.fillStyle = i % 2 ? C.red : C.gold
        c.font = '700 22px JetBrains Mono, monospace'
        c.fillText(i % 2 ? '•••' : '@', x, y)
      }
    caption(c, t < 18.5 ? 'You type your password.' : 'And it goes straight to them.', 1)
  } else if (t < 26) {
    const flash = Math.sin(t * 10) > 0 ? 0.25 : 0.1
    c.fillStyle = `rgba(255,79,107,${flash})`
    c.fillRect(0, 0, W, H)
    hacker(c, W / 2, 220, 1)
    c.fillStyle = '#fff'
    c.textAlign = 'center'
    c.font = '800 46px Inter, sans-serif'
    c.fillText('SESSION STOLEN', W / 2, 370)
    c.textAlign = 'left'
    caption(c, 'Account taken over in under a minute.', seg(t, 22.5, 23))
  } else {
    shield(c, 210, 250, 0.6 + seg(t, 26, 27) * 0.6)
    const tips = ['Check the sender’s domain', 'Hover before you click', 'Use MFA or passkeys', 'Type the URL yourself']
    tips.forEach((tip, i) => {
      const k = seg(t, 26.5 + i * 0.6, 27.1 + i * 0.6)
      c.globalAlpha = k
      c.fillStyle = C.green
      c.font = '700 30px Inter, sans-serif'
      c.fillText('✓', 380 + (1 - k) * 40, 170 + i * 64)
      c.fillStyle = '#fff'
      c.font = '600 30px Inter, sans-serif'
      c.fillText(tip, 420 + (1 - k) * 40, 170 + i * 64)
    })
    c.globalAlpha = 1
  }
  // player chrome
  c.fillStyle = 'rgba(0,0,0,0.5)'
  c.fillRect(0, H - 26, W, 26)
  c.fillStyle = '#ff2e2e'
  c.fillRect(0, H - 26, (t / EP_LEN) * W, 4)
  c.fillStyle = '#fff'
  c.font = '500 13px JetBrains Mono, monospace'
  const ss = (n: number) => `0:${String(Math.floor(n)).padStart(2, '0')}`
  c.fillText(`▶  ${ss(t)} / ${ss(EP_LEN)}   Security, Animated · Ep. 1`, 12, H - 8)
}

/** The TV face: the selected BreachLab video's real thumbnail with a play badge. */
function drawThumb(c: CanvasRenderingContext2D, img: HTMLImageElement | null, title: string, short: boolean, t: number) {
  c.fillStyle = '#0b0f1a'
  c.fillRect(0, 0, W, H)
  if (img) {
    if (short) {
      // shorts are vertical: blurred fill + centred frame
      c.filter = 'blur(18px) brightness(0.5)'
      c.drawImage(img, -40, -40, W + 80, H + 80)
      c.filter = 'none'
      const h = H
      const w = (img.width / img.height) * h
      c.drawImage(img, (W - w) / 2, 0, w, h)
    } else c.drawImage(img, 0, 0, W, H)
  }
  const g = c.createLinearGradient(0, H * 0.5, 0, H)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.85)')
  c.fillStyle = g
  c.fillRect(0, 0, W, H)
  // play badge
  const pulse = 1 + Math.sin(t * 3) * 0.04
  c.save()
  c.translate(W / 2, H / 2 - 20)
  c.scale(pulse, pulse)
  c.fillStyle = 'rgba(255,0,0,0.92)'
  c.beginPath()
  c.roundRect(-58, -40, 116, 80, 20)
  c.fill()
  c.fillStyle = '#fff'
  c.beginPath()
  c.moveTo(-16, -22)
  c.lineTo(26, 0)
  c.lineTo(-16, 22)
  c.closePath()
  c.fill()
  c.restore()
  c.fillStyle = '#fff'
  c.font = '700 28px Inter, sans-serif'
  c.fillText(title.length > 58 ? title.slice(0, 56) + '…' : title, 30, H - 58)
  c.fillStyle = 'rgba(255,255,255,0.7)'
  c.font = '500 18px Inter, sans-serif'
  c.fillText(`BreachLab · youtube.com/@Breachlab101${short ? ' · Short' : ''}`, 30, H - 26)
}

export function Studio() {
  const station = useRoom((s) => s.station)
  const video = useRoom((s) => s.video)
  const v = studio.videos.find((x) => x.id === video) ?? studio.videos[0]
  const { tex, ctx } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return { tex: t, ctx: canvas.getContext('2d')! }
  }, [])
  const img = useRef<HTMLImageElement | null>(null)
  useEffect(() => {
    const i = new Image()
    i.crossOrigin = 'anonymous'
    i.onload = () => (img.current = i)
    i.onerror = () => (img.current = null)
    img.current = null
    i.src = `https://i.ytimg.com/vi/${v.id}/${v.kind === 'short' ? 'hq2' : 'maxresdefault'}.jpg`
  }, [v.id, v.kind])
  const acc = useRef(0)
  const ring = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }, dt) => {
    acc.current += dt
    if (acc.current < 1 / 20) return
    acc.current = 0
    // no thumbnail (offline)? fall back to the animated explainer
    if (img.current) drawThumb(ctx, img.current, v.t, v.kind === 'short', clock.elapsedTime)
    else drawEpisode(ctx, clock.elapsedTime % EP_LEN)
    tex.needsUpdate = true
    void ring
  })
  const playing = station === 'studio'
  const sw = 2.2
  const sh = (sw * H) / W
  return (
    <Hotspot id="studio" label={[-6.85, 3.05, 2.6]}>
      <group position={[-6.96, 0, 2.6]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox args={[sw + 0.08, sh + 0.08, 0.05]} radius={0.015} position={[0, 2.05, 0]} castShadow>
          <meshStandardMaterial color="#07090d" metalness={0.6} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, 2.05, 0.027]}>
          <planeGeometry args={[sw, sh]} />
          <meshBasicMaterial map={tex} toneMapped={false} color={[1.2, 1.2, 1.2]} />
        </mesh>
        {playing && (
          <Html transform position={[0, 2.05, 0.03]} scale={sw / 960 * 40} zIndexRange={[5, 0]} className="tv-html">
            <iframe
              key={v.id}
              width={960}
              height={540}
              src={`https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1&playsinline=1`}
              title={v.t}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 0, display: 'block', background: '#000' }}
            />
          </Html>
        )}
        <pointLight position={[0, 2.0, 0.8]} color="#7f9cff" intensity={2} distance={3} />
        {/* ring light on a stand */}
        <group position={[1.35, 0, 0.9]}>
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 1.6, 8]} />
            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.7, 0]} rotation={[0, -0.6, 0]}>
            <torusGeometry args={[0.2, 0.025, 12, 48]} />
            <meshBasicMaterial ref={ring} color={[3.2, 3, 2.8]} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 1.7, 0.1]} color="#fff4e6" intensity={1.5} distance={2.5} />
        </group>
        {/* mic on a stand */}
        <group position={[-0.9, 0, 0.9]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.01, 0.01, 1.4, 8]} />
            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.45, 0.05]} rotation={[0.5, 0, 0]} castShadow>
            <capsuleGeometry args={[0.035, 0.1, 6, 16]} />
            <meshStandardMaterial color="#2a2d36" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.03, 24]} />
            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
        {/* camera on a tripod */}
        <group position={[0.2, 0, 1.6]} rotation={[0, Math.PI, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[Math.cos((i / 3) * Math.PI * 2) * 0.15, 0.55, Math.sin((i / 3) * Math.PI * 2) * 0.15]} rotation={[Math.sin((i / 3) * Math.PI * 2) * 0.25, 0, -Math.cos((i / 3) * Math.PI * 2) * 0.25]} castShadow>
              <cylinderGeometry args={[0.01, 0.01, 1.15, 6]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
          ))}
          <RoundedBox args={[0.22, 0.14, 0.12]} radius={0.02} position={[0, 1.18, 0]} castShadow>
            <meshStandardMaterial color="#15171c" roughness={0.5} />
          </RoundedBox>
          <mesh position={[0, 1.18, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.05, 0.1, 24]} />
            <meshStandardMaterial color="#0a0b0e" metalness={0.5} roughness={0.2} />
          </mesh>
          <mesh position={[0.08, 1.26, -0.04]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshBasicMaterial color={[4, 0.2, 0.2]} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </Hotspot>
  )
}
