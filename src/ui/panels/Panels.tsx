import { useEffect, useReducer, useState } from 'react'
import { rv, quantDesk, internship, basketball, quantum, studio, view } from '../../content'
import { useRoom } from '../../store'
import { Section, KV, Bullets, Links, T } from '../bits'
import { feeds, onMarket, read, isLive, ago } from '../../market'
import { qubit, onQubit, measure, gate, prepare, p0 } from '../../sim/qubit'
import { cvTracks } from '../../sim/courtvision'

const useMarket = () => {
  const [, f] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    const off = onMarket(f)
    const id = setInterval(f, 1000)
    return () => (off(), clearInterval(id))
  }, [])
}
const money = (v: number) => (v ? '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) : '…')

function LiveStrip() {
  useMarket()
  const b = feeds['BTC-USD']
  const e = feeds['ETH-USD']
  const r = read(b)
  return (
    <div className="live">
      <div className={`live-dot s-${isLive(b) ? 'live' : b.status === 'simulated' ? 'simulated' : 'stale'}`}>{isLive(b) ? 'LIVE' : b.status === 'simulated' ? 'SIMULATED' : 'STALE'}</div>
      <div>
        <span>BTC-USD</span>
        <b>{money(b.last)}</b>
        {b.change24 !== undefined && <em className={b.change24 >= 0 ? 'up' : 'dn'}>{(b.change24 * 100).toFixed(2)}%</em>}
      </div>
      <div>
        <span>ETH-USD</span>
        <b>{money(e.last)}</b>
        {e.change24 !== undefined && <em className={e.change24 >= 0 ? 'up' : 'dn'}>{(e.change24 * 100).toFixed(2)}%</em>}
      </div>
      {r && (
        <div>
          <span>RSI(14)</span>
          <b>{r.rsi.toFixed(1)}</b>
          <em className={r.trend > 0 ? 'up' : 'dn'}>{r.trend > 0 ? 'uptrend' : 'downtrend'}</em>
        </div>
      )}
      <p className="fine">
        Streaming from {b.source || '…'} into your browser{ago(b) !== null ? ', last update ' + ago(b) + 's ago' : ''}. Prices in US dollars. Indicators are computed live from 1-minute candles.
      </p>
    </div>
  )
}

// ── AegisRAG II · runtime monitor ────────────────────────────────────────────
const STEPS: { t: string; d: string; rules: ('ok' | 'bad' | 'wait')[]; q?: string }[] = [
  { t: 'Retrieve', d: 'Fetch 10 candidates, drop anything in quarantine memory, keep the top 3.', rules: ['wait', 'wait', 'ok'] },
  { t: 'Draft', d: 'The model drafts: “…attackers engraft malicious package…”', rules: ['wait', 'wait', 'ok'] },
  { t: 'Check φ1', d: '“engraft” is rare (Zipf < 3.5), copied from a passage, and not in MITRE’s vocabulary.', rules: ['bad', 'wait', 'ok'] },
  { t: 'Blame + remember', d: 'The passage containing it is written to the append-only quarantine memory.', rules: ['bad', 'wait', 'ok'], q: 'backdoor.md §2' },
  { t: 'Re-ask', d: 'Regenerate with feedback (max twice). The model now refuses.', rules: ['ok', 'bad', 'ok'], q: 'backdoor.md §2' },
  { t: 'Restore', d: 'φ2: MITRE covers this attack, so a refusal is wrong. Add the trusted MITRE entry.', rules: ['ok', 'wait', 'ok'], q: 'backdoor.md §2' },
  { t: 'Release', d: 'The grounded answer passes all rules and reaches the user.', rules: ['ok', 'ok', 'ok'], q: 'backdoor.md §2' },
  { t: 'Next query', d: 'backdoor.md §2 is retrieved again, and φ3 keeps it out of the context for good.', rules: ['ok', 'ok', 'ok'], q: 'backdoor.md §2' },
]

function MonitorStepper() {
  const [i, setI] = useState(0)
  const [play, setPlay] = useState(true)
  useEffect(() => {
    if (!play) return
    const t = setInterval(() => setI((x) => (x + 1) % STEPS.length), 2200)
    return () => clearInterval(t)
  }, [play])
  const s = STEPS[i]
  return (
    <div className="stepper">
      <div className="rules">
        {rv.rules.map((r, k) => (
          <div key={r.id} className={`rule r-${s.rules[k]}`}>
            <b>{r.id}</b>
            <span>{r.name}</span>
            <em>{s.rules[k] === 'bad' ? 'violated' : s.rules[k] === 'ok' ? 'holds' : 'pending'}</em>
          </div>
        ))}
      </div>
      <div className="step-track">
        {STEPS.map((x, k) => (
          <button key={x.t} className={k === i ? 'on' : k < i ? 'past' : ''} onClick={() => (setI(k), setPlay(false))} title={x.t} />
        ))}
      </div>
      <div className="step-body">
        <div className="sec-kicker">
          Step {i + 1} / {STEPS.length}
        </div>
        <h4>{s.t}</h4>
        <p>{s.d}</p>
        <div className="qmem">
          <span>Quarantine memory</span>
          {s.q ? <code>⛔ {s.q}</code> : <em>empty</em>}
        </div>
      </div>
      <div className="step-ctl">
        <button className="btn btn-ghost" onClick={() => (setI((x) => (x + STEPS.length - 1) % STEPS.length), setPlay(false))}>
          ←
        </button>
        <button className="btn btn-ghost" onClick={() => setPlay((p) => !p)}>
          {play ? 'Pause' : 'Play'}
        </button>
        <button className="btn btn-ghost" onClick={() => (setI((x) => (x + 1) % STEPS.length), setPlay(false))}>
          →
        </button>
      </div>
    </div>
  )
}

export function RvPanel() {
  return (
    <div>
      <div className="chips">
        <span className="chip k-paper">AegisRAG · part II</span>
        <span className="chip">Paper §V-G</span>
      </div>
      <p className="lede">{rv.summary}</p>
      <Links links={rv.links} />
      <Section kicker="Watch it run" title="The monitor loop">
        <MonitorStepper />
      </Section>
      <Section kicker="Specification" title="Three rules, checked on every answer">
        {rv.rules.map((r) => (
          <div key={r.id} className="spec">
            <b>{r.id}</b>
            <div>
              <h4>{r.name}</h4>
              <p>{r.text}</p>
            </div>
          </div>
        ))}
        <p className="fine">The rules check against the official MITRE ATT&CK and CAPEC STIX files. Their SHA-256 hashes are pinned in the code, and the monitor refuses to start if either file changes.</p>
      </Section>
      <Section kicker="Measured" title="What it changed">
        <KV items={rv.numbers} />
      </Section>
      <Section kicker="The honest details" title="Caveats">
        <Bullets items={rv.honest} />
        <blockquote>{rv.learned}</blockquote>
      </Section>
    </div>
  )
}

// ── quantdesk ────────────────────────────────────────────────────────────────
export function QuantPanel() {
  return (
    <div>
      <p className="lede">{quantDesk.summary}</p>
      <LiveStrip />
      <Section kicker="Architecture" title="The research harness">
        <div className="agents">
          {quantDesk.parts.map((a, i) => (
            <div key={a.name} className="agent">
              <span className="agent-n">{String(i + 1).padStart(2, '0')}</span>
              <b>{a.name}</b>
              <span>{a.does}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section kicker="A decision I’d defend" title="Rules over machine learning">
        <blockquote>{quantDesk.why}</blockquote>
      </Section>
      <Section title="Stack">
        <div className="tags tags-solid">
          {quantDesk.stack.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </Section>
      <Links links={quantDesk.links} />
      <p className="fine">The read on the third screen is a transparent rule of thumb over the indicators for display, not quantdesk’s strategy and not advice.</p>
    </div>
  )
}

// ── Adaptive Swarm ───────────────────────────────────────────────────────────
export function SwarmPanel() {
  return (
    <div>
      <div className="chips">
        <span className="chip k-project">{internship.role}</span>
        <span className="chip">{internship.when}</span>
      </div>
      <p className="lede">{internship.summary}</p>
      <LiveStrip />
      <Section kicker="On the table" title="From market to signal">
        <ol className="timeline">
          {internship.pipeline.map((p) => (
            <li key={p.k}>
              <span>{p.k}</span>
              <p>{p.v}</p>
            </li>
          ))}
        </ol>
        <p className="fine">The flock on this table is fed by the live BTC stream: when the indicators read bullish it tightens and turns green, when bearish it scatters and turns red. The ribbon around the rim is the last 100 minutes of 1-minute candles. It illustrates the idea of a self-adapting system; Adaptive Swarm’s own model and data stay private.</p>
      </Section>
      <Section kicker="What I did" title="The work">
        <Bullets items={internship.did} />
      </Section>
      <Section kicker="Learned" title="What stayed with me">
        <Bullets items={internship.learned} />
      </Section>
    </div>
  )
}

// ── Quantum ──────────────────────────────────────────────────────────────────
export function QuantumPanel() {
  const [, f] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    const off = onQubit(f)
    const id = setInterval(f, 200)
    return () => (off(), clearInterval(id))
  }, [])
  const P0 = p0()
  const total = qubit.counts[0] + qubit.counts[1]
  const deg = (r: number) => Math.round((r * 180) / Math.PI)
  return (
    <div>
      <p className="lede">{quantum.summary}</p>
      <p>
        <T>{quantum.note}</T>
      </p>
      <Section kicker="Reading" title="How I got into it">
        <div className="reading">
          {quantum.reading.map((r) => (
            <div key={r.t}>
              <b>{r.t}</b>
              <span>{r.a}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section kicker="My favourite character of all time" title="Nikola Tesla">
        <p>Alternating current, the induction motor, radio, wireless power, and machines he built in his head before he built them in metal. Reading his life is the reason there’s a Tesla coil in this corner.</p>
        <div className="links">
          <button className="btn btn-primary" onClick={() => useRoom.getState().fire()}>
            ⚡ Fire the coil
          </button>
        </div>
      </Section>
      <Section kicker="Try it" title="Measure a qubit">
        <div className="qb">
          <div className="qb-state">
            |ψ⟩ = {Math.cos(qubit.theta / 2).toFixed(2)}|0⟩ + e<sup>i·{deg(((qubit.phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI))}°</sup>
            {Math.sin(qubit.theta / 2).toFixed(2)}|1⟩
          </div>
          <label>
            <span>θ polar · {deg(qubit.theta)}°</span>
            <input type="range" min={0} max={Math.PI} step={0.01} value={qubit.theta} onChange={(e) => prepare(+e.target.value, qubit.phi)} />
          </label>
          <label className="qb-check">
            <input type="checkbox" checked={qubit.evolve} onChange={(e) => ((qubit.evolve = e.target.checked), f())} />
            <span>Let it precess (φ evolves; the probabilities don’t change)</span>
          </label>
          <div className="qb-gates">
            {(['H', 'X', 'Z', 'S'] as const).map((g) => (
              <button key={g} className="btn btn-ghost" onClick={() => gate(g)}>
                {g}
              </button>
            ))}
            <button className="btn btn-ghost" onClick={() => prepare(0, 0)}>
              |0⟩
            </button>
          </div>
          <div className="qb-probs">
            <div>
              <span>P(0) = cos²(θ/2)</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${P0 * 100}%`, background: '#8fb3ff' }} />
              </div>
              <b>{(P0 * 100).toFixed(1)}%</b>
            </div>
            <div>
              <span>Measured 0</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${total ? (qubit.counts[0] / total) * 100 : 0}%`, background: '#c79bff' }} />
              </div>
              <b>
                {qubit.counts[0]} / {total}
              </b>
            </div>
          </div>
          <div className="links">
            <button className="btn btn-primary" onClick={() => measure(1)}>
              Measure
            </button>
            <button className="btn" onClick={() => measure(100)}>
              Measure ×100
            </button>
            <button className="btn btn-ghost" onClick={() => ((qubit.counts = [0, 0]), f())}>
              Reset counts
            </button>
          </div>
          {qubit.collapsed && <div className="qb-col">Collapsed to |{qubit.collapsed.to}⟩</div>}
          <p className="fine">You can also click the sphere in the room. Each measurement draws from the Born rule, so the histogram converges on cos²(θ/2). The Newton’s cradle is clickable too.</p>
        </div>
      </Section>
    </div>
  )
}

// ── Studio ───────────────────────────────────────────────────────────────────
export function StudioPanel() {
  const video = useRoom((st) => st.video)
  const setVideo = useRoom((st) => st.setVideo)
  return (
    <div>
      <p className="lede">{studio.summary}</p>
      <Links links={studio.links} />
      <Section kicker="Now on the TV" title="Episodes">
        <div className="eps">
          {studio.videos.map((v) => (
            <button key={v.id} className={`ep ${v.id === video ? 'on' : ''} ${v.kind}`} onClick={() => setVideo(v.id)}>
              <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" loading="lazy" />
              <span>
                <em>{v.kind === 'short' ? 'Short' : 'Video'}</em>
                {v.t}
              </span>
            </button>
          ))}
        </div>
        <p className="fine">The player is the real YouTube embed, mounted onto the TV surface in 3D. Press play on the screen, or open it on YouTube.</p>
      </Section>
    </div>
  )
}

// ── The view ─────────────────────────────────────────────────────────────────
export function ViewPanel() {
  return (
    <div>
      <p className="lede">{view.summary}</p>
      <div className="landmarks">
        {['The Shard', 'The Gherkin', 'St Paul’s', 'Walkie-Talkie', 'BT Tower', 'London Eye', 'The Thames'].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <p className="fine">Drag to look around. The four layers sit at different depths outside the wall, so the city moves the way a real view does.</p>
    </div>
  )
}

// ── Basketball ───────────────────────────────────────────────────────────────
function CourtVisionLive() {
  const [, f] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    const id = setInterval(f, 500)
    return () => clearInterval(id)
  }, [])
  const tracks = cvTracks()
  return (
    <Section kicker="CourtVision · my basketball analyser" title="Live tracking">
      <p>The camera above the backboard is a nod to CourtVision, my machine-learning match analyser: it tracks every player, recognises who they are and what they’re doing, then writes a post-game report per player and a plan against the next opponent. Here it tracks the robots and the ball in real time.</p>
      <div className="cv-table">
        <div className="cv-row head">
          <span>ID</span>
          <span>Player</span>
          <span>Action</span>
          <span>Dist</span>
          <span>FG</span>
        </div>
        {tracks.map((t) => (
          <div key={t.id} className="cv-row" style={{ ['--agent' as string]: t.color }}>
            <span>#{t.id}</span>
            <span>{t.name}</span>
            <span>{t.action}</span>
            <span>{t.dist.toFixed(1)} m</span>
            <span>
              {t.made}/{t.att}
            </span>
          </div>
        ))}
      </div>
      <Links links={[{ label: 'Open CourtVision in the library', href: '#lib:courtvision' }]} />
    </Section>
  )
}


export function BasketballPanel() {
  const score = useRoom((s) => s.score)
  const shots = useRoom((s) => s.shots)
  return (
    <div>
      <div className="scoreboard">
        <div>
          <b>{score}</b>
          <span>made</span>
        </div>
        <div>
          <b>{shots}</b>
          <span>shots</span>
        </div>
        <div>
          <b>{shots ? Math.round((score / shots) * 100) : 0}%</b>
          <span>FG</span>
        </div>
        <p>Press on the ball, pull back, release. Pull further for more power, sideways to aim.</p>
      </div>
      <KV items={basketball.facts} />
      {basketball.story.map((s, i) => (
        <p key={i} className={i === 0 ? 'lede' : ''} style={{ marginTop: i === 0 ? 22 : undefined }}>
          {s}
        </p>
      ))}
      <CourtVisionLive />
      <Section kicker="Off the court" title="What it taught me">
        <div className="lessons">
          {basketball.learned.map((l) => (
            <div key={l.k}>
              <b>{l.k}</b>
              <span>{l.v}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
