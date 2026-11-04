/**
 * Generative ambient music for the room, made live with the Web Audio API.
 * Nothing is downloaded and nothing loops: slow pads, a soft sub, drifting
 * bell notes and a little vinyl/rain texture, all through a long reverb.
 */

type Ctx = AudioContext

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

// D major, slow and warm: Dmaj9 – Bm9 – Gmaj9 – Em9
const CHORDS = [
  { root: 38, notes: [50, 54, 57, 61, 64] },
  { root: 35, notes: [47, 50, 54, 57, 61] },
  { root: 31, notes: [43, 47, 50, 54, 57] },
  { root: 40, notes: [52, 55, 59, 62, 66] },
]
const SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81] // D major pentatonic, upper register
const BAR = 9 // seconds per chord

let ctx: Ctx | null = null
let master: GainNode | null = null
let duck: BiquadFilterNode | null = null
let running = false
let timers: number[] = []
let targetVolume = 0.6
let nodes: { dry: AudioNode; verb: AudioNode } | null = null

function impulse(c: Ctx, seconds: number, decay: number) {
  const len = Math.floor(c.sampleRate * seconds)
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

function build() {
  const c = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  const out = c.createGain()
  out.gain.value = 0
  const comp = c.createDynamicsCompressor()
  comp.threshold.value = -18
  comp.ratio.value = 3
  // a gentle low-pass the Tesla coil can sweep
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 9000
  out.connect(lp).connect(comp).connect(c.destination)

  const verb = c.createConvolver()
  verb.buffer = impulse(c, 5.5, 2.6)
  const wet = c.createGain()
  wet.gain.value = 0.55
  verb.connect(wet).connect(out)
  const dry = c.createGain()
  dry.gain.value = 0.6
  dry.connect(out)

  ctx = c
  master = out
  duck = lp
  return { c, verb, dry }
}

/** Slow evolving pad: two detuned voices per note through a breathing low-pass. */
function pad(c: Ctx, dest: AudioNode, verb: AudioNode, notes: number[], t: number, len: number) {
  const filt = c.createBiquadFilter()
  filt.type = 'lowpass'
  filt.Q.value = 0.6
  filt.frequency.setValueAtTime(500, t)
  filt.frequency.linearRampToValueAtTime(720 + Math.random() * 280, t + len * 0.5)
  filt.frequency.linearRampToValueAtTime(600, t + len + 3)
  const g = c.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.12, t + 3)
  g.gain.setValueAtTime(0.12, t + len - 0.5)
  g.gain.linearRampToValueAtTime(0, t + len + 3.5)
  filt.connect(g)
  g.connect(dest)
  g.connect(verb)
  for (const n of notes)
    for (const det of [-7, 6]) {
      const o = c.createOscillator()
      o.type = n < 50 ? 'triangle' : 'sawtooth'
      o.frequency.value = midi(n)
      o.detune.value = det + (Math.random() - 0.5) * 4
      const v = c.createGain()
      v.gain.value = n < 50 ? 0.5 : 0.22
      o.connect(v).connect(filt)
      o.start(t)
      o.stop(t + len + 4)
    }
}

function sub(c: Ctx, dest: AudioNode, root: number, t: number, len: number) {
  const o = c.createOscillator()
  o.type = 'sine'
  o.frequency.value = midi(root)
  const g = c.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.14, t + 2.5)
  g.gain.linearRampToValueAtTime(0, t + len + 1.5)
  o.connect(g).connect(dest)
  o.start(t)
  o.stop(t + len + 2)
}

/** Soft bell / electric-piano note. */
function bell(c: Ctx, dest: AudioNode, verb: AudioNode, n: number, t: number) {
  const pan = c.createStereoPanner()
  pan.pan.value = (Math.random() - 0.5) * 1.2
  const g = c.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.03, t + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0005, t + 3.2)
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 2600
  for (const [mult, amp] of [
    [1, 1],
    [2, 0.25],
    [3.01, 0.08],
  ] as const) {
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.value = midi(n) * mult
    const a = c.createGain()
    a.gain.value = amp
    o.connect(a).connect(lp)
    o.start(t)
    o.stop(t + 3.4)
  }
  lp.connect(g).connect(pan)
  pan.connect(dest)
  pan.connect(verb)
}

/** Vinyl crackle and very soft rain: filtered noise and sparse clicks. */
function texture(c: Ctx, dest: AudioNode) {
  const len = c.sampleRate * 4
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    // brown-ish noise for rain
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
    d[i] = last * 3
    // sparse crackle
    if (Math.random() < 0.0004) d[i] += (Math.random() - 0.5) * 0.9
  }
  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 400
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 3800
  const g = c.createGain()
  g.gain.value = 0.05
  src.connect(hp).connect(lp).connect(g).connect(dest)
  src.start()
}

function schedule(c: Ctx, dry: AudioNode, verb: AudioNode) {
  let bar = 0
  let next = c.currentTime + 0.2
  const tick = () => {
    if (!running) return
    // keep ~2 bars scheduled ahead
    while (next < c.currentTime + BAR * 2) {
      const ch = CHORDS[bar % CHORDS.length]
      pad(c, dry, verb, ch.notes, next, BAR)
      sub(c, dry, ch.root, next, BAR)
      // 2–5 drifting bell notes per bar, chosen from the chord's neighbourhood
      const count = 2 + Math.floor(Math.random() * 4)
      for (let k = 0; k < count; k++) {
        const pool = SCALE.filter((n) => ch.notes.some((m) => (n - m) % 12 === 0) || Math.random() < 0.35)
        const n = pool[Math.floor(Math.random() * pool.length)]
        bell(c, dry, verb, n, next + 0.6 + Math.random() * (BAR - 1.5))
      }
      next += BAR
      bar++
    }
    timers.push(window.setTimeout(tick, 1500))
  }
  tick()
}

export const music = {
  get on() {
    return running
  },
  start() {
    if (running) return
    if (!ctx) {
      const { c, verb, dry } = build()
      nodes = { dry, verb }
      texture(c, dry)
      running = true
      schedule(c, dry, verb)
    } else {
      running = true
      ctx.resume()
      if (nodes) schedule(ctx, nodes.dry, nodes.verb)
    }
    const c = ctx!
    c.resume()
    master!.gain.cancelScheduledValues(c.currentTime)
    master!.gain.setValueAtTime(master!.gain.value, c.currentTime)
    master!.gain.linearRampToValueAtTime(targetVolume, c.currentTime + 4)
  },
  stop() {
    if (!ctx || !running) return
    running = false
    timers.forEach(clearTimeout)
    timers = []
    const c = ctx
    master!.gain.cancelScheduledValues(c.currentTime)
    master!.gain.setValueAtTime(master!.gain.value, c.currentTime)
    master!.gain.linearRampToValueAtTime(0, c.currentTime + 1.2)
    setTimeout(() => !running && c.suspend(), 1400)
  },
  /** Tesla coil: a quick crackly low-pass warble. */
  surge() {
    if (!ctx || !running || !duck) return
    const t = ctx.currentTime
    duck.frequency.cancelScheduledValues(t)
    duck.frequency.setValueAtTime(9000, t)
    for (let i = 0; i < 10; i++) duck.frequency.setValueAtTime(300 + Math.random() * 2500, t + 0.05 + i * 0.12)
    duck.frequency.linearRampToValueAtTime(9000, t + 2.6)
  },
  volume(v: number) {
    targetVolume = v
    if (ctx && master && running) master.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.5)
  },
}

// pause in background tabs, resume on return
if (typeof document !== 'undefined')
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) ctx.suspend()
    else if (running) ctx.resume()
  })
