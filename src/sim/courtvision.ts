import * as THREE from 'three'
import { bots, crew } from './crew'
import { ball, shotStats } from './ball'

/** CourtVision-style tracker over the room's players: identity, action, distance, shooting. */
const dist: Record<string, number> = {}
const last: Record<string, THREE.Vector2> = {}

export function stepVision() {
  for (const b of bots) {
    const p = last[b.id]
    if (p) dist[b.id] = (dist[b.id] ?? 0) + p.distanceTo(b.pos)
    last[b.id] = b.pos.clone()
  }
}

export function action(id: string) {
  const b = bots.find((x) => x.id === id)!
  const sp = b.vel.length()
  if (b.task === 'respond') return 'responding to incident'
  if (b.task === 'play') {
    if (ball.holder === b.id) return sp > 0.4 ? 'driving' : 'dribbling'
    if (ball.holder === 'free' && ball.inFlight && ball.shooter === b.id) return 'shot in the air'
    const g = crew.game
    if (g && ball.holder !== 'free' && ball.holder !== b.id) return 'defending'
    return 'chasing rebound'
  }
  return sp > 0.2 ? 'walking' : 'idle'
}

export function cvTracks() {
  return bots.map((b, i) => ({
    id: i + 1,
    key: b.id,
    name: b.name,
    color: b.color,
    action: action(b.id),
    dist: dist[b.id] ?? 0,
    att: shotStats[b.id]?.att ?? 0,
    made: shotStats[b.id]?.made ?? 0,
  }))
}

export const userShots = () => shotStats.user ?? { att: 0, made: 0 }
