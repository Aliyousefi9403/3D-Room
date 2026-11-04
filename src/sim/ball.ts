import * as THREE from 'three'

/** One shared basketball with simple rigid-body physics: gravity, floor, walls, backboard, rim, net. */
export const RIM = new THREE.Vector3(5.0, 3.05, -4.38)
export const RIM_R = 0.23
export const BALL_R = 0.12
const BOARD_Z = -4.84
const G = 9.81

export type Holder = 'rack' | 'user' | string // robot id

export const ball = {
  pos: new THREE.Vector3(5.95, 0.95, -3.0),
  vel: new THREE.Vector3(),
  spin: new THREE.Vector3(),
  holder: 'rack' as Holder,
  /** who shot last, for scoring */
  shooter: null as string | null,
  wasAbove: false,
  madeAt: 0,
  lastTouchFloor: 0,
  inFlight: false,
}

/** shots attempted / made per shooter, for CourtVision */
export const shotStats: Record<string, { att: number; made: number }> = {}

type ScoreFn = (shooter: string | null) => void
const scored = new Set<ScoreFn>()
export const onScore = (fn: ScoreFn) => (scored.add(fn), () => scored.delete(fn))

/** Initial velocity that lands the ball at `target` after `t` seconds. */
export function solveShot(from: THREE.Vector3, target: THREE.Vector3, t: number) {
  // exact launch velocity under the integrator's linear drag (k = 0.08 /s) and gravity
  const k = 0.08
  const f = k / (1 - Math.exp(-k * t))
  return new THREE.Vector3((target.x - from.x) * f, (target.y - from.y + (G * t) / k) * f - G / k, (target.z - from.z) * f)
}

/** A shot at the rim with some error; `skill` 0..1 shrinks the error. */
export function aimedShot(from: THREE.Vector3, skill: number) {
  const d = Math.hypot(RIM.x - from.x, RIM.z - from.z)
  const t = 0.75 + d * 0.16
  const err = (1 - skill) * 0.28
  const target = RIM.clone().add(new THREE.Vector3((Math.random() - 0.5) * err, 0.02, (Math.random() - 0.5) * err + 0.03))
  return solveShot(from, target, t)
}

export function shoot(shooter: string, vel: THREE.Vector3, from?: THREE.Vector3) {
  if (from) ball.pos.copy(from)
  ball.vel.copy(vel)
  ball.spin.set(-8, 0, 0)
  ball.holder = 'free'
  ball.shooter = shooter
  ball.inFlight = true
  ball.wasAbove = false
  ;(shotStats[shooter] ??= { att: 0, made: 0 }).att++
}

const tmp = new THREE.Vector3()
export function stepBall(dt: number, now: number) {
  if (ball.holder !== 'free') return
  const steps = 4
  const h = dt / steps
  for (let s = 0; s < steps; s++) {
    ball.vel.y -= G * h
    ball.vel.multiplyScalar(1 - 0.08 * h)
    ball.pos.addScaledVector(ball.vel, h)

    // floor
    if (ball.pos.y < BALL_R) {
      ball.pos.y = BALL_R
      if (ball.vel.y < 0) ball.vel.y *= -0.68
      ball.vel.x *= 0.86
      ball.vel.z *= 0.86
      ball.inFlight = false
      ball.lastTouchFloor = now
      if (Math.abs(ball.vel.y) < 0.35) ball.vel.y = 0
    }
    // room walls (x: -7..7, z: -5..5)
    if (ball.pos.x > 7 - BALL_R) (ball.pos.x = 7 - BALL_R), (ball.vel.x *= -0.6)
    if (ball.pos.x < -7 + BALL_R) (ball.pos.x = -7 + BALL_R), (ball.vel.x *= -0.6)
    if (ball.pos.z < -5 + BALL_R) (ball.pos.z = -5 + BALL_R), (ball.vel.z *= -0.6)
    if (ball.pos.z > 4.9) (ball.pos.z = 4.9), (ball.vel.z *= -0.6)
    // backboard (1.8 × 1.05, centred above the rim)
    if (ball.pos.z - BALL_R < BOARD_Z + 0.02 && Math.abs(ball.pos.x - RIM.x) < 0.9 && ball.pos.y > RIM.y - 0.03 && ball.pos.y < RIM.y + 1.02 && ball.vel.z < 0) {
      ball.pos.z = BOARD_Z + 0.02 + BALL_R
      ball.vel.z *= -0.55
    }
    // rim: torus of radius RIM_R in the horizontal plane
    tmp.set(ball.pos.x - RIM.x, 0, ball.pos.z - RIM.z)
    const rr = tmp.length() || 1e-6
    tmp.multiplyScalar(RIM_R / rr).add(RIM) // closest point on the rim circle
    const dx = ball.pos.x - tmp.x
    const dy = ball.pos.y - tmp.y
    const dz = ball.pos.z - tmp.z
    const dist = Math.hypot(dx, dy, dz)
    const minD = BALL_R + 0.012
    if (dist < minD) {
      const nx = dx / dist
      const ny = dy / dist
      const nz = dz / dist
      ball.pos.set(tmp.x + nx * minD, tmp.y + ny * minD, tmp.z + nz * minD)
      const vn = ball.vel.x * nx + ball.vel.y * ny + ball.vel.z * nz
      if (vn < 0) {
        ball.vel.x -= 1.55 * vn * nx
        ball.vel.y -= 1.55 * vn * ny
        ball.vel.z -= 1.55 * vn * nz
      }
    }
    // net: made basket when the centre passes down through the rim disc
    const inside = Math.hypot(ball.pos.x - RIM.x, ball.pos.z - RIM.z) < RIM_R - 0.04
    if (ball.pos.y > RIM.y) ball.wasAbove = inside || ball.wasAbove
    if (ball.wasAbove && inside && ball.pos.y < RIM.y - 0.05 && ball.vel.y < 0 && now - ball.madeAt > 1) {
      ball.madeAt = now
      ball.wasAbove = false
      ball.vel.x *= 0.2
      ball.vel.z *= 0.2
      if (ball.shooter) (shotStats[ball.shooter] ??= { att: 0, made: 0 }).made++
      scored.forEach((fn) => fn(ball.shooter))
    }
    if (ball.pos.y < RIM.y - 0.3) ball.wasAbove = false
  }
}
