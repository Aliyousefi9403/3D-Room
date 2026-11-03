import { useEffect, useState } from 'react'
import { CREW, ACTS, LOOP, crewTime } from '../../crew'
import { Section } from '../bits'

export function CrewPanel() {
  const [t, setT] = useState(crewTime())
  useEffect(() => {
    const id = setInterval(() => setT(crewTime()), 250)
    return () => clearInterval(id)
  }, [])
  const act = [...ACTS].reverse().find((a) => t >= a.t) ?? ACTS[0]
  return (
    <div>
      <p className="lede">
        Three small agents act out my dissertation in real time, on loop: an attacker poisons the knowledge base, a retriever walks
        into the trap, and a runtime monitor catches it.
      </p>
      <div className="act">
        <div className="act-track">
          {ACTS.map((a, i) => (
            <i key={a.t} className={a === act ? 'on' : t > a.t ? 'past' : ''} style={{ left: `${(a.t / LOOP) * 100}%`, width: `${(((ACTS[i + 1]?.t ?? LOOP) - a.t) / LOOP) * 100}%` }} />
          ))}
          <b style={{ left: `${(t / LOOP) * 100}%` }} />
        </div>
        <div className="sec-kicker">Now playing · Act {ACTS.indexOf(act) + 1} of {ACTS.length}</div>
        <h4>{act.title}</h4>
        <p>{act.text}</p>
      </div>
      <Section kicker="The cast" title="Who maps to what">
        {CREW.map((a) => (
          <div key={a.id} className="cast" style={{ ['--agent' as string]: a.color }}>
            <span className="cast-dot" />
            <div>
              <h4>
                {a.name} <em>{a.role}</em>
              </h4>
              <p>{a.maps}</p>
            </div>
          </div>
        ))}
      </Section>
      <p className="fine">A scripted dramatisation of one real failure from the study: the poisoned “Engraft Malicious Package” passage. In the real run, the monitor quarantined it and the memory kept it out the next two times.</p>
    </div>
  )
}
