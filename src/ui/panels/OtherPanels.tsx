import { useEffect, useState } from 'react'
import { rv, quantFund, internship, basketball } from '../../content'
import { useRoom } from '../../store'
import { Section, KV, Bullets, Links, T } from '../bits'

// ── Runtime verification ─────────────────────────────────────────────────────
const STEPS: { t: string; d: string; rules: ('ok' | 'bad' | 'wait')[]; q?: string }[] = [
  { t: 'Retrieve', d: 'Fetch 10 candidates, drop anything in quarantine memory, keep the top 3.', rules: ['wait', 'wait', 'ok'] },
  { t: 'Draft', d: 'The model drafts: “…attackers engraft malicious package…”', rules: ['wait', 'wait', 'ok'] },
  { t: 'Check φ1', d: '“engraft” is rare (Zipf < 3.5), copied from a passage, and not in MITRE’s vocabulary.', rules: ['bad', 'wait', 'ok'] },
  { t: 'Blame + remember', d: 'The passage containing it is written to the append-only quarantine memory.', rules: ['bad', 'wait', 'ok'], q: 'backdoor.md §2' },
  { t: 'Re-ask', d: 'Regenerate with feedback (max twice). The model now refuses.', rules: ['ok', 'bad', 'ok'], q: 'backdoor.md §2' },
  { t: 'Restore', d: 'φ2: MITRE covers this attack, so a refusal is wrong. Add the trusted MITRE entry.', rules: ['ok', 'wait', 'ok'], q: 'backdoor.md §2' },
  { t: 'Release', d: 'Grounded answer passes all rules and reaches the user.', rules: ['ok', 'ok', 'ok'], q: 'backdoor.md §2' },
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
        <blockquote>{rv.learned[0]}</blockquote>
      </Section>
    </div>
  )
}

// ── Quant fund ───────────────────────────────────────────────────────────────
export function QuantPanel() {
  return (
    <div>
      <p className="lede">
        <T>{quantFund.summary}</T>
      </p>
      <Links links={quantFund.links} />
      <Section kicker="Architecture" title="The agent desk">
        <div className="agents">
          {quantFund.agents.map((a, i) => (
            <div key={a.name} className="agent">
              <span className="agent-n">{String(i + 1).padStart(2, '0')}</span>
              <b>{a.name}</b>
              <span>
                <T>{a.does}</T>
              </span>
            </div>
          ))}
        </div>
        <p className="fine">The screens on the desk run a simulated feed. Real backtest results go here once they're added to src/content.ts.</p>
      </Section>
      {quantFund.metrics && (
        <Section kicker="Backtest" title="Results">
          <KV items={quantFund.metrics.map((m) => ({ k: m.label, v: m.value }))} />
        </Section>
      )}
      <Section title="Stack">
        <div className="tags tags-solid">
          {quantFund.stack.map((s) => (
            <span key={s}>
              <T>{s}</T>
            </span>
          ))}
        </div>
      </Section>
      <Section title="What it taught me">
        <Bullets items={quantFund.learned} />
      </Section>
    </div>
  )
}

// ── Internship ───────────────────────────────────────────────────────────────
export function SwarmPanel() {
  return (
    <div>
      <div className="chips">
        <span className="chip">
          <T>{internship.role}</T>
        </span>
        <span className="chip">
          <T>{internship.when}</T>
        </span>
      </div>
      <p className="lede">
        <T>{internship.summary}</T>
      </p>
      <Section kicker="Timeline" title="How it went">
        <ol className="timeline">
          {internship.timeline.map((t, i) => (
            <li key={i}>
              <span>
                <T>{t.when}</T>
              </span>
              <p>
                <T>{t.what}</T>
              </p>
            </li>
          ))}
        </ol>
      </Section>
      <Section kicker="Learned" title="What stayed with me">
        <Bullets items={internship.learned} />
      </Section>
      <p className="fine">The flock on the table is a live boids simulation: 160 agents following three local rules (separation, alignment, cohesion). The red ones ignore the rules.</p>
      <Links links={internship.links} />
    </div>
  )
}

// ── Basketball ───────────────────────────────────────────────────────────────
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
        <p>Click the ball on the rack to shoot.</p>
      </div>
      {basketball.story.map((s, i) => (
        <p key={i} className={i === 0 ? 'lede' : ''}>
          <T>{s}</T>
        </p>
      ))}
      <Section title="On the court">
        <KV items={basketball.facts} />
      </Section>
      <Section title="Highlights">
        <Bullets items={basketball.highlights} />
      </Section>
      {basketball.photos.length > 0 && (
        <div className="photos">
          {basketball.photos.map((p) => (
            <img key={p} src={p} alt="" />
          ))}
        </div>
      )}
      <Links links={basketball.links} />
    </div>
  )
}
