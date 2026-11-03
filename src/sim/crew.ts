import * as THREE from 'three'
import { ball, aimedShot, shoot, onScore, RIM } from './ball'
import { net, devices, onNet, contain, Incident, log } from './network'
import { path, free } from './nav'

export type Role = 'sentry' | 'analyst' | 'medic'
export type Bot = {
  id: Role
  name: string
  role: string
  color: string
  blurb: string
  pos: THREE.Vector2
  vel: THREE.Vector2
  target: THREE.Vector2 | null
  heading: number
  home: THREE.Vector2
  say: { text: string; tone?: 'bad' | 'good' | 'warn'; until: number } | null
  task: 'idle' | 'respond' | 'play' | 'yield'
  busyUntil: number
  hasBall: boolean
  score: number
  seed: number
  route: THREE.Vector2[]
  routeFor: THREE.Vector2 | null
}

const v2 = (x: number, z: number) => new THREE.Vector2(x, z)
void log
export const bots: Bot[] = [
  { id: 'sentry', name: 'Sentry', role: 'Detection', color: '#8fb3ff', blurb: 'Watches the event stream and runs the detection rules over sliding windows. First to the scene.', pos: v2(-0.6, -2.4), vel: v2(0, 0), target: null, heading: 0, home: v2(-0.6, -2.4), say: null, task: 'idle', busyUntil: 0, hasBall: false, score: 0, seed: 1, route: [], routeFor: null },
  { id: 'analyst', name: 'Analyst', role: 'Triage & correlation', color: '#f5c26b', blurb: 'Groups alerts by source and device into incidents, maps them to MITRE ATT&CK and sets severity.', pos: v2(0.5, -2.7), vel: v2(0, 0), target: null, heading: 0, home: v2(0.5, -2.7), say: null, task: 'idle', busyUntil: 0, hasBall: false, score: 0, seed: 2, route: [], routeFor: null },
  { id: 'medic', name: 'Medic', role: 'Response', color: '#3ddc97', blurb: 'Runs the playbook: blocks the source at the router or isolates the device, then confirms.', pos: v2(1.6, -2.3), vel: v2(0, 0), target: null, heading: 0, home: v2(1.6, -2.3), say: null, task: 'idle', busyUntil: 0, hasBall: false, score: 0, seed: 3, route: [], routeFor: null },
]
const byId = (id: string) => bots.find((b) => b.id === id)

export const crew = {
  get job() {
    return job
  },
  game: null as null | { a: Bot; b: Bot; started: number; phase: 'dribble' | 'shot' | 'loose'; spot: THREE.Vector2; shotAt: number; lastScoreAt: number },
  lastIncidentAt: -30,
  queue: [] as Incident[],
  userAtCourt: false,
}

const say = (b: Bot, text: string, now: number, tone?: 'bad' | 'good' | 'warn', dur = 3.2) => (b.say = { text, tone, until: now + dur })
const near = (b: Bot, p: THREE.Vector2, r = 0.12) => b.pos.distanceTo(p) < r

const COURT = { x0: 3.8, x1: 6.3, z0: -3.9, z1: -1.9 }
const rnd = (a: number, b: number) => a + Math.random() * (b - a)
const now = () => performance.now() / 1000

// ── incident response ────────────────────────────────────────────────────────
type Job = { inc: Incident; stage: 0 | 1 | 2 | 3 | 4; t: number }
let job: Job | null = null

onNet((type, data) => {
  if (type !== 'incident') return
  const inc = data as Incident
  crew.lastIncidentAt = now()
  if (job && job.inc === inc) {
    if (job.stage >= 2) say(byId('analyst')!, `Incident #${inc.id} escalated: ${inc.title}`, now(), 'bad')
    return
  }
  if (!crew.queue.includes(inc) && (!job || job.inc !== inc)) crew.queue.push(inc)
})

onScore((shooter) => {
  const b = shooter ? byId(shooter) : null
  if (b) {
    b.score++
    say(b, ['Swish.', 'Count it.', 'Too easy.', 'Nothing but net.'][Math.floor(Math.random() * 4)], now(), 'good', 2)
    if (crew.game) crew.game.lastScoreAt = now()
  }
})

function standNear(inc: Incident, k: number) {
  const s = devices[inc.device].stand
  const base = v2(s[0], s[1])
  if (k === 0 && free(base.x, base.y)) return base
  // fan out around the device and take the k-th free spot
  const spots: THREE.Vector2[] = []
  for (let r = 0.6; r < 2 && spots.length < 3; r += 0.3)
    for (let i = 0; i < 12 && spots.length < 3; i++) {
      const a = (i / 12) * Math.PI * 2
      const p = v2(base.x + Math.cos(a) * r, base.y + Math.sin(a) * r)
      if (free(p.x, p.y) && spots.every((q) => q.distanceTo(p) > 0.5)) spots.push(p)
    }
  return k === 0 ? spots[0] ?? base : spots[k] ?? spots[0] ?? base
}

function stepJob(t: number) {
  if (!job && crew.queue.length) {
    const inc = crew.queue.shift()!
    if (inc.status === 'contained') return
    endGame('An alert just fired. Game over.', t)
    job = { inc, stage: 0, t }
    bots.forEach((b) => (b.task = 'respond'))
  }
  if (!job) return
  const [s, a, m] = bots
  const { inc } = job
  const first = inc.alerts[0]
  if (job.stage === 0) {
    s.target = standNear(inc, 0)
    say(s, `On it: ${first.rule.name} at the ${devices[inc.device].name.toLowerCase()}`, t, 'warn', 2.4)
    job.stage = 1
  } else if (job.stage === 1 && (near(s, s.target!, 0.25) || t - job.t > 14)) {
    say(s, `${first.rule.id} ${first.rule.name}: ${first.evidence}`, t, 'bad', 4)
    a.target = standNear(inc, 1)
    job.stage = 2
    job.t = t
  } else if (job.stage === 2 && (near(a, a.target!, 0.25) || t - job.t > 14)) {
    const techs = [...new Set(inc.alerts.map((x) => x.rule.technique))].join(', ')
    say(a, `Incident #${inc.id} · ${inc.severity.toUpperCase()} · ATT&CK ${techs} · src ${inc.src}`, t, 'warn', 4.5)
    inc.status = 'triaged'
    m.target = standNear(inc, 2)
    job.stage = 3
    job.t = t
  } else if (job.stage === 3 && ((near(m, m.target!, 0.25) && t - job.t > 1.5) || t - job.t > 14)) {
    contain(inc)
    say(m, `Contained: ${inc.action}`, t, 'good', 4.5)
    job.stage = 4
    job.t = t
  } else if (job.stage === 4 && t - job.t > 4) {
    bots.forEach((b) => ((b.task = 'idle'), (b.target = b.home.clone())))
    say(a, `Report filed. ${net.counts.contained} incident${net.counts.contained === 1 ? '' : 's'} contained tonight.`, t, undefined, 3)
    job = null
  }
}

// ── basketball ───────────────────────────────────────────────────────────────
function startGame(t: number) {
  const free = bots.filter((b) => b.task === 'idle')
  if (free.length < 2) return
  const [a, b] = free.sort(() => Math.random() - 0.5)
  a.task = b.task = 'play'
  a.score = b.score = 0
  crew.game = { a, b, started: t, phase: 'loose', spot: v2(5, -2.6), shotAt: 0, lastScoreAt: 0 }
  if (ball.holder === 'rack') {
    ball.holder = 'free'
    ball.vel.set(-0.6, 0.5, 0.4)
  }
  say(a, `${b.name}, 1v1. First to 5.`, t, undefined, 2.6)
  setTimeout(() => say(b, 'You’re on.', now(), undefined, 2), 900)
}

function endGame(msg: string | null, t: number) {
  const g = crew.game
  if (!g) return
  crew.game = null
  ;[g.a, g.b].forEach((b) => {
    b.hasBall = false
    if (b.task === 'play') b.task = 'idle'
    b.target = b.home.clone()
  })
  if (ball.holder === g.a.id || ball.holder === g.b.id) {
    ball.holder = 'free'
    ball.vel.set(rnd(-0.5, 0.5), 1.2, rnd(0.2, 0.8))
  }
  if (msg) say(g.a, msg, t, 'warn', 2.4)
}

function stepGame(t: number) {
  const g = crew.game
  if (!g) {
    const quiet = t - crew.lastIncidentAt > 10 && !job && !crew.userAtCourt
    if (quiet && Math.random() < 1 - Math.exp(-0.18 * lastDt)) startGame(t)
    return
  }
  if (crew.userAtCourt) return endGame('Visitor on court. All yours.', t)
  const off = ball.holder === g.a.id ? g.a : ball.holder === g.b.id ? g.b : null
  const win = g.a.score >= 5 ? g.a : g.b.score >= 5 ? g.b : null
  if (win && t - g.lastScoreAt > 1.5) {
    say(win, `Game. ${win.score}–${(win === g.a ? g.b : g.a).score}.`, t, 'good', 3)
    return endGame(null, t)
  }
  if (!off) {
    // loose ball: both chase it once it's catchable
    g.phase = 'loose'
    const bp = v2(ball.pos.x, ball.pos.z)
    for (const p of [g.a, g.b]) {
      p.target = bp.clone()
      if (ball.pos.y < 1.1 && p.pos.distanceTo(bp) < 0.38 && (ball.holder === 'free' || ball.holder === 'rack')) {
        ball.holder = p.id
        p.hasBall = true
        g.phase = 'dribble'
        g.spot = v2(rnd(COURT.x0, COURT.x1), rnd(COURT.z0, COURT.z1))
        g.shotAt = t + rnd(1.5, 3.2)
        break
      }
    }
    return
  }
  const def = off === g.a ? g.b : g.a
  off.target = g.spot
  // defender sits between the ball handler and the hoop
  const rim = v2(RIM.x, RIM.z)
  const dir = rim.clone().sub(off.pos).normalize()
  def.target = off.pos.clone().addScaledVector(dir, 0.6)
  if (t > g.shotAt && near(off, g.spot, 0.35)) {
    const from = new THREE.Vector3(off.pos.x, 1.15, off.pos.y)
    const contested = def.pos.distanceTo(off.pos) < 0.8
    off.hasBall = false
    shoot(off.id, aimedShot(from, contested ? 0.45 : 0.62), from)
    g.phase = 'shot'
    if (Math.random() < 0.3) say(def, contested ? 'Hand in your face.' : 'Too slow!', t, undefined, 1.6)
  }
}

// ── movement ─────────────────────────────────────────────────────────────────
function steer(b: Bot, dt: number) {
  if (!b.target) {
    b.vel.multiplyScalar(0.85)
    return
  }
  // re-plan when the goal moves noticeably
  if (!b.routeFor || b.routeFor.distanceTo(b.target) > 0.35) {
    b.route = path(b.pos, b.target)
    b.routeFor = b.target.clone()
  } else if (b.route.length) b.route[b.route.length - 1].copy(b.target)
  while (b.route.length > 1 && b.pos.distanceTo(b.route[0]) < 0.25) b.route.shift()
  const wp = b.route[0] ?? b.target
  const d = wp.clone().sub(b.pos)
  const dist = d.length()
  const speed = b.task === 'play' ? 2.1 : b.task === 'respond' ? 1.7 : 0.8
  const last = b.route.length <= 1
  const want = dist < 0.04 ? new THREE.Vector2() : d.normalize().multiplyScalar(last ? Math.min(speed, dist * 2.5) : speed)
  for (const o of bots)
    if (o !== b) {
      const away = b.pos.clone().sub(o.pos)
      const l = away.length()
      if (l < 0.5 && l > 1e-4) want.addScaledVector(away.normalize(), (0.5 - l) * 4)
    }
  b.vel.lerp(want, Math.min(1, dt * 6))
  const next = b.pos.clone().addScaledVector(b.vel, dt)
  if (free(next.x, next.y) || !free(b.pos.x, b.pos.y)) b.pos.copy(next)
  else b.vel.multiplyScalar(0.3)
}

let wanderAt = 0
let lastDt = 0.016
export function stepCrew(t: number, dt: number) {
  lastDt = dt
  stepJob(t)
  stepGame(t)
  // idle wander near home
  if (t > wanderAt) {
    wanderAt = t + 4
    bots.forEach((b) => {
      if (b.task === 'idle') b.target = b.home.clone().add(v2(rnd(-0.5, 0.5), rnd(-0.4, 0.4)))
    })
  }
  if (crew.userAtCourt) {
    bots.forEach((b) => {
      if (b.task === 'idle' && b.pos.x > 3) b.target = b.home.clone()
    })
  }
  bots.forEach((b) => {
    steer(b, dt)
    if (b.say && t > b.say.until) b.say = null
  })
  // dribbling: the ball follows its handler
  const h = byId(ball.holder)
  if (h) {
    const f = new THREE.Vector2(Math.sin(h.heading), Math.cos(h.heading))
    const bounce = Math.abs(Math.sin(t * 9))
    ball.pos.set(h.pos.x + f.x * 0.28 + 0.12, 0.14 + bounce * 0.55, h.pos.y + f.y * 0.28)
    ball.vel.set(h.vel.x, 0, h.vel.y)
  }
}

export function pingLog() {
  log('Night Watch online · 5 devices · 5 rules', 'dim')
}
