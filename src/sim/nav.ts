import * as THREE from 'three'

/** Floor obstacles (x, z). Circles and axis-aligned rectangles, inflated by the robot radius. */
const R = 0.32
const circles: [number, number, number][] = [
  [-3, 1.4, 1.35], // trading desk
  [1.7, 0.7, 0.98], // swarm table
  [3.2, -0.4, 0.48], // quantum table
  [5.95, -3.0, 0.32], // ball rack
  [-1.7, -4.4, 0.28], // floor lamp
  [2.6, -4.4, 0.32], // plant
  [6.35, 4.3, 0.3], // plant
  [-6.4, 3.9, 0.35], // plant
  [-5.36, 2.4, 0.3], // tripod
  [-6.06, 1.25, 0.22], // ring light
  [-6.06, 3.5, 0.2], // mic
  [4.8, 3.2, 0.3], // desk chair
]
const rects: [number, number, number, number][] = [
  [-7, -6.15, -1.8, -0.3], // server racks
  [-6.8, -6.3, 0.1, 0.6], // NAS
  [-6.45, -1.95, -5, -4.5], // bookshelf
  [-0.7, 1.9, -5, -4.1], // monitor console
  [6.35, 7, -0.6, 1.4], // window bench
  [3.75, 5.65, 1.85, 2.75], // writing desk
]

export function free(x: number, z: number) {
  if (x < -6.7 || x > 6.7 || z < -4.75 || z > 4.75) return false
  for (const [cx, cz, r] of circles) if ((x - cx) ** 2 + (z - cz) ** 2 < (r + R) ** 2) return false
  for (const [x0, x1, z0, z1] of rects) if (x > x0 - R && x < x1 + R && z > z0 - R && z < z1 + R) return false
  return true
}

export function clear(a: THREE.Vector2, b: THREE.Vector2) {
  const d = a.distanceTo(b)
  const n = Math.ceil(d / 0.1)
  for (let i = 1; i <= n; i++) {
    const k = i / n
    if (!free(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k)) return false
  }
  return true
}

const C = 0.2
const X0 = -6.8
const Z0 = -4.8
const NX = 69
const NZ = 49
let grid: Uint8Array | null = null
const build = () => {
  grid = new Uint8Array(NX * NZ)
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) grid[j * NX + i] = free(X0 + i * C, Z0 + j * C) ? 1 : 0
}
const cell = (p: THREE.Vector2) => [Math.round((p.x - X0) / C), Math.round((p.y - Z0) / C)] as const

function nearestFree(i: number, j: number) {
  for (let r = 0; r < 8; r++)
    for (let di = -r; di <= r; di++)
      for (let dj = -r; dj <= r; dj++) {
        const a = i + di
        const b = j + dj
        if (a >= 0 && b >= 0 && a < NX && b < NZ && grid![b * NX + a]) return [a, b] as const
      }
  return [i, j] as const
}

/** A* on the grid, then string-pulled with line-of-sight checks. */
export function path(from: THREE.Vector2, to: THREE.Vector2): THREE.Vector2[] {
  if (clear(from, to)) return [to.clone()]
  if (!grid) build()
  const g = grid!
  const [si, sj] = nearestFree(...cell(from))
  const [ti, tj] = nearestFree(...cell(to))
  const start = sj * NX + si
  const goal = tj * NX + ti
  const cost = new Float32Array(NX * NZ).fill(Infinity)
  const prev = new Int32Array(NX * NZ).fill(-1)
  const open: [number, number][] = [[0, start]]
  cost[start] = 0
  const h = (k: number) => Math.hypot((k % NX) - ti, Math.floor(k / NX) - tj)
  while (open.length) {
    let bi = 0
    for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k
    const [, cur] = open.splice(bi, 1)[0]
    if (cur === goal) break
    const ci = cur % NX
    const cj = Math.floor(cur / NX)
    for (let di = -1; di <= 1; di++)
      for (let dj = -1; dj <= 1; dj++) {
        if (!di && !dj) continue
        const ni = ci + di
        const nj = cj + dj
        if (ni < 0 || nj < 0 || ni >= NX || nj >= NZ) continue
        const nk = nj * NX + ni
        if (!g[nk]) continue
        const c = cost[cur] + (di && dj ? 1.414 : 1)
        if (c < cost[nk]) {
          cost[nk] = c
          prev[nk] = cur
          open.push([c + h(nk), nk])
        }
      }
  }
  if (prev[goal] < 0 && goal !== start) return [to.clone()]
  const pts: THREE.Vector2[] = []
  for (let k = goal; k !== -1; k = prev[k]) pts.unshift(new THREE.Vector2(X0 + (k % NX) * C, Z0 + Math.floor(k / NX) * C))
  pts.push(to.clone())
  // string-pull
  const out: THREE.Vector2[] = []
  let anchor = from.clone()
  for (let k = 0; k < pts.length; k++) {
    const next = pts[k + 1]
    if (!next || !clear(anchor, next)) {
      out.push(pts[k])
      anchor = pts[k]
    }
  }
  return out
}
