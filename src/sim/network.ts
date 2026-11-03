/**
 * Night Watch: a tiny network living in the room, a traffic generator, and a
 * rule-based detection engine. Everything here runs for real in the browser:
 * events are generated, rules evaluate sliding windows over them, alerts are
 * correlated into incidents and contained.
 */
export type DeviceId = 'router' | 'nas' | 'camera' | 'speaker' | 'laptop'
export type Device = { id: DeviceId; name: string; ip: string; pos: [number, number, number]; stand: [number, number]; state: 'ok' | 'alert' | 'contained' }

export const devices: Record<DeviceId, Device> = {
  router: { id: 'router', name: 'Edge router', ip: '10.0.0.1', pos: [-1.55, 1.65, -4.93], stand: [-1.15, -3.55], state: 'ok' },
  nas: { id: 'nas', name: 'NAS', ip: '10.0.0.20', pos: [-6.55, 0, 0.35], stand: [-5.65, 0.35], state: 'ok' },
  camera: { id: 'camera', name: 'IP camera', ip: '10.0.0.31', pos: [6.93, 3.55, 3.7], stand: [6.0, 3.7], state: 'ok' },
  speaker: { id: 'speaker', name: 'Smart speaker', ip: '10.0.0.42', pos: [6.6, 0.46, 1.15], stand: [5.85, 1.0], state: 'ok' },
  laptop: { id: 'laptop', name: 'Laptop', ip: '10.0.0.10', pos: [5.25, 0.8, 2.2], stand: [5.0, 3.35], state: 'ok' },
}

export type Ev =
  | { t: number; kind: 'conn'; src: string; dst: DeviceId; port: number }
  | { t: number; kind: 'auth'; src: string; dst: DeviceId; ok: boolean; user: string }
  | { t: number; kind: 'dns'; src: DeviceId; q: string }

export type Rule = { id: string; name: string; technique: string; tactic: string; severity: 'medium' | 'high' | 'critical'; desc: string }

export const RULES: Rule[] = [
  { id: 'R1', name: 'Port scan', technique: 'T1046', tactic: 'Discovery', severity: 'medium', desc: '≥ 15 distinct destination ports from one source in 10 s' },
  { id: 'R2', name: 'SSH brute force', technique: 'T1110', tactic: 'Credential Access', severity: 'high', desc: '≥ 8 failed logins from one source in 15 s' },
  { id: 'R3', name: 'Login after brute force', technique: 'T1078', tactic: 'Initial Access', severity: 'critical', desc: 'A successful login from a source that just tripped R2' },
  { id: 'R4', name: 'DNS exfiltration', technique: 'T1048.003', tactic: 'Exfiltration', severity: 'high', desc: '≥ 5 queries in 20 s with a label longer than 30 chars and entropy > 3.5 bits' },
  { id: 'R5', name: 'C2 beaconing', technique: 'T1071', tactic: 'Command and Control', severity: 'high', desc: '≥ 6 connections to one external host with interval jitter < 0.35 s' },
]

export type Alert = { id: number; t: number; rule: Rule; device: DeviceId; src: string; evidence: string }
export type Incident = { id: number; t: number; device: DeviceId; src: string; alerts: Alert[]; title: string; severity: Rule['severity']; status: 'open' | 'triaged' | 'contained'; action?: string }

export const ATTACKS = [
  { id: 'scan', label: 'Port scan the router', device: 'router' as DeviceId },
  { id: 'brute', label: 'Brute-force SSH on the NAS', device: 'nas' as DeviceId },
  { id: 'exfil', label: 'Exfiltrate via DNS from the camera', device: 'camera' as DeviceId },
  { id: 'beacon', label: 'Plant a C2 beacon on the speaker', device: 'speaker' as DeviceId },
] as const
export type AttackId = (typeof ATTACKS)[number]['id']

// ── state ────────────────────────────────────────────────────────────────────
export const net = {
  events: [] as Ev[],
  log: [] as { t: number; text: string; tone?: 'bad' | 'good' | 'warn' | 'dim' }[],
  alerts: [] as Alert[],
  incidents: [] as Incident[],
  blocked: new Set<string>(),
  isolated: new Set<DeviceId>(),
  running: [] as { id: AttackId; src: string; until: number; next: number; step: number; by: 'visitor' | 'auto' }[],
  counts: { events: 0, alerts: 0, contained: 0 },
}
let alertId = 0
let incId = 0

const listeners = new Set<(type: 'alert' | 'incident' | 'contained' | 'log', data?: unknown) => void>()
export const onNet = (fn: (type: 'alert' | 'incident' | 'contained' | 'log', data?: unknown) => void) => (listeners.add(fn), () => listeners.delete(fn))
const emit = (type: 'alert' | 'incident' | 'contained' | 'log', data?: unknown) => listeners.forEach((f) => f(type, data))

export function log(text: string, tone?: 'bad' | 'good' | 'warn' | 'dim') {
  net.log.push({ t: Date.now(), text, tone })
  if (net.log.length > 80) net.log.shift()
  emit('log')
}

const randIp = () => `${[185, 45, 91, 103, 194][Math.floor(Math.random() * 5)]}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`
const rand = (s: string, n: number) => Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join('')

function push(e: Ev) {
  net.events.push(e)
  net.counts.events++
  if (net.events.length > 600) net.events.splice(0, net.events.length - 600)
}

export function entropy(s: string) {
  const m = new Map<string, number>()
  for (const ch of s) m.set(ch, (m.get(ch) ?? 0) + 1)
  let h = 0
  m.forEach((c) => {
    const p = c / s.length
    h -= p * Math.log2(p)
  })
  return h
}

// ── traffic ──────────────────────────────────────────────────────────────────
let benignAcc = 0
function benign(now: number, dt: number) {
  benignAcc += dt
  if (benignAcc < 0.6) return
  benignAcc = Math.min(benignAcc - 0.6, 2)
  const r = Math.random()
  if (r < 0.35) push({ t: now, kind: 'dns', src: 'laptop', q: ['github.com', 'arxiv.org', 'api.exchange.coinbase.com', 'fonts.gstatic.com', 'scholar.google.com'][Math.floor(Math.random() * 5)] })
  else if (r < 0.55) push({ t: now, kind: 'dns', src: 'speaker', q: 'time.cloudflare.com' })
  else if (r < 0.75) push({ t: now, kind: 'conn', src: '10.0.0.10', dst: 'nas', port: 445 })
  else if (r < 0.9) push({ t: now, kind: 'auth', src: '10.0.0.10', dst: 'nas', ok: true, user: 'ali' })
  else push({ t: now, kind: 'conn', src: '10.0.0.31', dst: 'router', port: 443 })
}

export function launch(id: AttackId, by: 'visitor' | 'auto' = 'visitor') {
  if (net.running.some((r) => r.id === id)) return
  const src = randIp()
  const a = ATTACKS.find((x) => x.id === id)!
  const t0 = performance.now() / 1000
  net.running.push({ id, src, until: t0 + 16, next: t0, step: 0, by })
  log(`${by === 'visitor' ? 'You launched' : 'Red team launched'}: ${a.label.toLowerCase()} from ${src}`, 'bad')
}

function attackTraffic(now: number) {
  net.running = net.running.filter((r) => now < r.until)
  for (const r of net.running) {
    if (net.blocked.has(r.src)) continue
    // catch up by timestamp so slow frame rates produce the same traffic
    let guard = 0
    while (r.next <= now && r.next < r.until && guard++ < 60) {
      const t = r.next
      r.step++
      if (r.id === 'scan') {
        push({ t, kind: 'conn', src: r.src, dst: 'router', port: [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 1433, 3306, 3389, 5900, 8080, 8443][r.step % 19] + (r.step > 19 ? 1000 : 0) })
        r.next += 0.18
      } else if (r.id === 'brute') {
        const ok = r.step === 14
        push({ t, kind: 'auth', src: r.src, dst: 'nas', ok, user: ['admin', 'root', 'ali', 'backup'][r.step % 4] })
        r.next += 0.5
        if (ok) r.until = t + 2
      } else if (r.id === 'exfil') {
        if (!net.isolated.has('camera')) push({ t, kind: 'dns', src: 'camera', q: `${rand('abcdefghijklmnopqrstuvwxyz0123456789', 38)}.cdn-sync.net` })
        r.next += 1.2
      } else if (r.id === 'beacon') {
        if (!net.isolated.has('speaker')) push({ t, kind: 'conn', src: '10.0.0.42', dst: 'router', port: 8443 })
        r.next += 1.5 + (Math.random() - 0.5) * 0.2
      }
    }
  }
}

// ── detection ────────────────────────────────────────────────────────────────
const fired = new Map<string, number>() // rule+src → last fire time
function fire(rule: Rule, device: DeviceId, src: string, evidence: string, now: number) {
  const key = `${rule.id}:${src}`
  if (now - (fired.get(key) ?? -99) < 20) return
  fired.set(key, now)
  const a: Alert = { id: ++alertId, t: now, rule, device, src, evidence }
  net.alerts.push(a)
  net.counts.alerts++
  if (net.alerts.length > 40) net.alerts.shift()
  devices[device].state = 'alert'
  log(`${rule.id} ${rule.name} · ${rule.technique} · ${devices[device].name} · ${evidence}`, rule.severity === 'critical' ? 'bad' : 'warn')
  emit('alert', a)
  correlate(a, now)
}

function correlate(a: Alert, now: number) {
  let inc = net.incidents.find((i) => i.status !== 'contained' && (i.src === a.src || i.device === a.device) && now - i.t < 60)
  if (inc) {
    inc.alerts.push(a)
    if (sev(a.rule.severity) > sev(inc.severity)) inc.severity = a.rule.severity
    inc.title = inc.alerts.map((x) => x.rule.name).join(' → ')
  } else {
    inc = { id: ++incId, t: now, device: a.device, src: a.src, alerts: [a], title: a.rule.name, severity: a.rule.severity, status: 'open' }
    net.incidents.push(inc)
    if (net.incidents.length > 20) net.incidents.shift()
  }
  emit('incident', inc)
}
const sev = (s: Rule['severity']) => ({ medium: 1, high: 2, critical: 3 })[s]

function detect(now: number) {
  const ev = net.events
  // R1 port scan
  const scan = new Map<string, Set<number>>()
  // R2/R3 brute force
  const fails = new Map<string, number>()
  // R4 dns
  const weird = new Map<DeviceId, string[]>()
  // R5 beacon
  const beacons = new Map<string, number[]>()
  for (const e of ev) {
    const age = now - e.t
    if (e.kind === 'conn' && age < 10 && !e.src.startsWith('10.')) {
      if (!scan.has(e.src)) scan.set(e.src, new Set())
      scan.get(e.src)!.add(e.port)
    }
    if (e.kind === 'auth' && age < 15 && !e.ok) fails.set(e.src, (fails.get(e.src) ?? 0) + 1)
    if (e.kind === 'dns' && age < 20) {
      const label = e.q.split('.')[0]
      if (label.length > 30 && entropy(label) > 3.5) {
        if (!weird.has(e.src)) weird.set(e.src, [])
        weird.get(e.src)!.push(label)
      }
    }
    if (e.kind === 'conn' && age < 12 && e.port === 8443 && e.src === '10.0.0.42') {
      if (!beacons.has(e.src)) beacons.set(e.src, [])
      beacons.get(e.src)!.push(e.t)
    }
  }
  for (const e of ev)
    if (e.kind === 'auth' && now - e.t < 3 && e.ok && (fired.has(`R2:${e.src}`) || (fails.get(e.src) ?? 0) >= 8)) {
      if ((fails.get(e.src) ?? 0) >= 8) fire(RULES[1], 'nas', e.src, `${fails.get(e.src)} failed logins in 15 s`, now)
      fire(RULES[2], e.dst, e.src, `login as “${e.user}” succeeded`, now)
    }
  scan.forEach((ports, src) => ports.size >= 15 && fire(RULES[0], 'router', src, `${ports.size} ports in 10 s`, now))
  fails.forEach((n, src) => n >= 8 && fire(RULES[1], 'nas', src, `${n} failed logins in 15 s`, now))
  weird.forEach((labels, src) => labels.length >= 5 && fire(RULES[3], src, devices[src].ip, `${labels.length} queries, H=${entropy(labels[0]).toFixed(2)} bits`, now))
  beacons.forEach((ts, src) => {
    if (ts.length < 6) return
    const gaps = ts.slice(1).map((t, i) => t - ts[i])
    const m = gaps.reduce((a, b) => a + b, 0) / gaps.length
    const sd = Math.sqrt(gaps.reduce((a, b) => a + (b - m) ** 2, 0) / gaps.length)
    const c2 = net.running.find((r) => r.id === 'beacon')?.src ?? 'external'
    if (sd < 0.35) fire(RULES[4], 'speaker', c2, `every ${m.toFixed(1)} s ± ${sd.toFixed(2)} s`, now)
    void src
  })
}

/** The response playbook Medic follows. */
export function contain(inc: Incident) {
  const d = devices[inc.device]
  let action: string
  if (inc.device === 'camera' || inc.device === 'speaker') {
    net.isolated.add(inc.device)
    action = `isolated ${d.name} (${d.ip}) to a quarantine VLAN`
  } else {
    net.blocked.add(inc.src)
    action = `blocked ${inc.src} at the edge router`
    if (inc.alerts.some((a) => a.rule.id === 'R3')) action += ', reset credentials'
  }
  inc.status = 'contained'
  inc.action = action
  d.state = 'contained'
  net.counts.contained++
  log(`Contained incident #${inc.id}: ${action}`, 'good')
  emit('contained', inc)
  setTimeout(() => {
    d.state = 'ok'
    net.isolated.delete(inc.device)
  }, 14000)
}

let autoAt = 25
export function stepNetwork(now: number, dt: number) {
  benign(now, dt)
  attackTraffic(now)
  detect(now)
  // the red team gets bored too
  if (now > autoAt) {
    autoAt = now + 55 + Math.random() * 40
    if (!net.running.length) launch(ATTACKS[Math.floor(Math.random() * ATTACKS.length)].id, 'auto')
  }
}
