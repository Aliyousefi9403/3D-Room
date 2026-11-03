import * as THREE from 'three'

export function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, srgb = true) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** seeded PRNG so procedural art is stable between reloads */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function woodFloor() {
  const r = rng(7)
  const tex = canvasTexture(1024, 1024, (c, w, h) => {
    const rows = 8
    const rh = h / rows
    for (let i = 0; i < rows; i++) {
      let x = -r() * 400
      while (x < w) {
        const len = 260 + r() * 260
        const base = 26 + r() * 10
        const g = c.createLinearGradient(0, i * rh, 0, (i + 1) * rh)
        g.addColorStop(0, `hsl(24, 34%, ${base}%)`)
        g.addColorStop(1, `hsl(22, 36%, ${base - 6}%)`)
        c.fillStyle = g
        c.fillRect(x, i * rh, len, rh)
        // grain
        c.globalAlpha = 0.09
        for (let k = 0; k < 14; k++) {
          c.strokeStyle = r() > 0.5 ? '#2a160b' : '#d9a777'
          c.lineWidth = 0.5 + r() * 1.5
          c.beginPath()
          const y = i * rh + r() * rh
          c.moveTo(x, y)
          c.bezierCurveTo(x + len * 0.3, y + (r() - 0.5) * 10, x + len * 0.6, y + (r() - 0.5) * 10, x + len, y + (r() - 0.5) * 6)
          c.stroke()
        }
        c.globalAlpha = 1
        c.fillStyle = 'rgba(20,10,4,0.55)'
        c.fillRect(x, i * rh, 2, rh)
        x += len
      }
      c.fillStyle = 'rgba(20,10,4,0.6)'
      c.fillRect(0, i * rh, w, 2)
    }
  })
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 3)
  return tex
}

export function wallPanel(hue = 220) {
  const tex = canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = `hsl(${hue}, 18%, 14%)`
    c.fillRect(0, 0, w, h)
    const r = rng(hue)
    for (let i = 0; i < 4000; i++) {
      c.fillStyle = `rgba(255,255,255,${r() * 0.025})`
      c.fillRect(r() * w, r() * h, 1.5, 1.5)
    }
  })
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 2)
  return tex
}

export function rugTexture() {
  return canvasTexture(1024, 640, (c, w, h) => {
    c.fillStyle = '#1b2333'
    c.fillRect(0, 0, w, h)
    c.strokeStyle = '#c8a46a'
    c.lineWidth = 6
    c.strokeRect(30, 30, w - 60, h - 60)
    c.lineWidth = 2
    c.strokeRect(50, 50, w - 100, h - 100)
    c.globalAlpha = 0.5
    for (let i = 0; i < 9; i++) {
      c.beginPath()
      c.ellipse(w / 2, h / 2, 60 + i * 42, 30 + i * 26, 0, 0, Math.PI * 2)
      c.strokeStyle = i % 2 ? '#7a2e2e' : '#c8a46a'
      c.stroke()
    }
    const r = rng(3)
    c.globalAlpha = 0.06
    for (let i = 0; i < 20000; i++) {
      c.fillStyle = r() > 0.5 ? '#fff' : '#000'
      c.fillRect(r() * w, r() * h, 2, 2)
    }
  })
}

export function skyline() {
  return canvasTexture(1024, 768, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#0a1024')
    g.addColorStop(0.55, '#2a2348')
    g.addColorStop(0.8, '#6b3a5a')
    g.addColorStop(1, '#e0895a')
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
    const r = rng(11)
    for (let i = 0; i < 160; i++) {
      c.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.6})`
      c.fillRect(r() * w, r() * h * 0.5, 1.5, 1.5)
    }
    // moon
    c.fillStyle = 'rgba(255,240,220,0.9)'
    c.beginPath()
    c.arc(w * 0.78, h * 0.18, 26, 0, Math.PI * 2)
    c.fill()
    for (let layer = 0; layer < 3; layer++) {
      let x = 0
      while (x < w) {
        const bw = 30 + r() * 70
        const bh = (0.15 + r() * 0.35) * h * (1 - layer * 0.22)
        c.fillStyle = ['#151629', '#0e0f1e', '#07070f'][layer]
        c.fillRect(x, h - bh, bw, bh)
        if (layer > 0)
          for (let wy = h - bh + 8; wy < h - 6; wy += 12)
            for (let wx = x + 5; wx < x + bw - 5; wx += 9)
              if (r() > 0.7) {
                c.fillStyle = r() > 0.3 ? 'rgba(255,200,120,0.85)' : 'rgba(150,200,255,0.8)'
                c.fillRect(wx, wy, 4, 6)
              }
        x += bw + 2
      }
    }
  })
}
