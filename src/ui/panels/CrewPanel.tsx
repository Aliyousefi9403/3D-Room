import { useEffect, useReducer } from 'react'
import { net, onNet, launch, ATTACKS, RULES, devices } from '../../sim/network'
import { bots } from '../../sim/crew'
import { Section } from '../bits'

const useTick = (ms: number) => {
  const [, f] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    const id = setInterval(f, ms)
    const off = onNet(() => f())
    return () => (clearInterval(id), void off())
  }, [ms])
}

export function CrewPanel() {
  useTick(700)
  const running = new Set(net.running.map((r) => r.id))
  const open = net.incidents.filter((i) => i.status !== 'contained').length
  return (
    <div>
      <p className="lede">
        A small project that lives in this room. Its five devices make a little network, and three agents defend it in real time: <b style={{ color: '#8fb3ff' }}>Sentry</b> detects, <b style={{ color: '#f5c26b' }}>Analyst</b> correlates and triages, <b style={{ color: '#3ddc97' }}>Medic</b> contains. The glowing table is its live network map: red packets are attack traffic coming in from the internet. When it’s quiet, two of the agents play 1v1 on the court.
      </p>
      <div className="stats">
        <div>
          <b>{net.counts.events}</b>
          <span>events</span>
        </div>
        <div>
          <b>{net.counts.alerts}</b>
          <span>alerts</span>
        </div>
        <div>
          <b>{net.counts.contained}</b>
          <span>contained</span>
        </div>
      </div>

      <Section kicker="Red team" title="Launch an attack">
        <div className="attacks">
          {ATTACKS.map((a) => (
            <button key={a.id} className={`attack ${running.has(a.id) ? 'is-on' : ''}`} onClick={() => launch(a.id)} disabled={running.has(a.id)}>
              <span>{a.label}</span>
              <em>{running.has(a.id) ? 'running…' : devices[a.device].ip}</em>
            </button>
          ))}
        </div>
        <p className="fine">Each attack generates real events. The detection rules below run over sliding windows, and the agents respond to whatever fires. Watch the room.</p>
      </Section>

      <Section kicker="Live" title="Event log">
        <div className="console">
          {net.log
            .slice(-12)
            .reverse()
            .map((l, i) => (
              <div key={l.t + l.text} className={`ln t-${l.tone ?? 'x'}`} style={{ opacity: 1 - i * 0.06 }}>
                <span>{new Date(l.t).toTimeString().slice(0, 8)}</span>
                {l.text}
              </div>
            ))}
        </div>
      </Section>

      <Section kicker={`${open} open`} title="Incidents">
        {net.incidents.length === 0 && <p className="fine">Nothing yet. Launch something above, or wait for the red team to get bored.</p>}
        {net.incidents
          .slice(-5)
          .reverse()
          .map((inc) => (
            <div key={inc.id} className={`inc s-${inc.status} sev-${inc.severity}`}>
              <div className="inc-head">
                <b>#{inc.id}</b>
                <span>{inc.title}</span>
                <em>{inc.status}</em>
              </div>
              <div className="inc-meta">
                {devices[inc.device].name} · src {inc.src} · {[...new Set(inc.alerts.map((a) => a.rule.technique))].join(', ')}
              </div>
              {inc.action && <div className="inc-act">✓ {inc.action}</div>}
            </div>
          ))}
      </Section>

      <Section kicker="Detection engineering" title="The rules">
        {RULES.map((r) => (
          <div key={r.id} className="spec">
            <b>{r.id}</b>
            <div>
              <h4>
                {r.name} <span className={`sev sev-${r.severity}`}>{r.severity}</span>
              </h4>
              <p>
                {r.desc}. MITRE ATT&CK <code>{r.technique}</code> · {r.tactic}.
              </p>
            </div>
          </div>
        ))}
      </Section>

      <Section kicker="The crew" title="Who does what">
        {bots.map((b) => (
          <div key={b.id} className="cast" style={{ ['--agent' as string]: b.color }}>
            <span className="cast-dot" />
            <div>
              <h4>
                {b.name} <em>{b.role}</em>
              </h4>
              <p>{b.blurb}</p>
            </div>
          </div>
        ))}
      </Section>
    </div>
  )
}
