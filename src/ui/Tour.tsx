import { useEffect, useRef, useState } from 'react'
import { useRoom, StationId } from '../store'
import { launch, net } from '../sim/network'

export const HIGHLIGHTS: { id: StationId; title: string; text: string; onEnter?: () => void }[] = [
  {
    id: 'rag',
    title: 'Can you spot the poisoned answer?',
    text: 'My dissertation, AegisRAG: someone edits a security knowledge base by swapping a few words. Play the round on the right.',
  },
  {
    id: 'crew',
    title: 'An attack just started',
    text: 'Night Watch: three agents defend this room’s network. Watch them detect it, triage it against MITRE ATT&CK and contain it.',
    onEnter: () => {
      if (!net.running.some((r) => r.id === 'brute')) launch('brute')
    },
  },
  {
    id: 'basketball',
    title: 'Take a shot',
    text: 'I wore #13 for Iran’s U18 national team. Press on the ball, pull back, release.',
  },
  {
    id: 'about',
    title: 'That’s the tour',
    text: 'Everything else is one click away in the dock. My CV is on the desk.',
  },
]
const STEP_MS = 11500

export function HighlightsTour() {
  const tour = useRoom((s) => s.tour)
  const station = useRoom((s) => s.station)
  const go = useRoom((s) => s.go)
  const setTour = useRoom((s) => s.setTour)
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const started = useRef(0)

  // enter a step
  useEffect(() => {
    if (!tour) return
    const step = HIGHLIGHTS[i]
    go(step.id)
    step.onEnter?.()
    started.current = performance.now()
  }, [tour, i, go])

  // auto-advance unless the visitor is busy
  useEffect(() => {
    if (!tour || paused || i >= HIGHLIGHTS.length - 1) return
    const t = setTimeout(() => setI((x) => x + 1), STEP_MS)
    return () => clearTimeout(t)
  }, [tour, i, paused])

  // any interaction pauses the auto-advance; Next resumes it
  useEffect(() => {
    if (!tour) return
    const pause = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.('.tourcard')) return
      setPaused(true)
    }
    window.addEventListener('pointerdown', pause)
    window.addEventListener('wheel', pause)
    return () => {
      window.removeEventListener('pointerdown', pause)
      window.removeEventListener('wheel', pause)
    }
  }, [tour])

  // going back to the overview by hand (Esc, ⌂) ends the tour, once it has started
  const arrived = useRef(false)
  useEffect(() => {
    if (!tour) {
      arrived.current = false
      return
    }
    if (station !== 'overview') arrived.current = true
    else if (arrived.current) setTour(false)
  }, [tour, station, setTour])

  useEffect(() => {
    if (!tour) {
      setI(0)
      setPaused(false)
    }
  }, [tour])

  if (!tour) return null
  const step = HIGHLIGHTS[i]
  const last = i === HIGHLIGHTS.length - 1
  return (
    <div className="tourcard" role="dialog" aria-label="Highlights tour">
      <div className="tourcard-top">
        <span>
          Highlights · {i + 1} / {HIGHLIGHTS.length}
        </span>
        <div className="tourcard-steps">
          {HIGHLIGHTS.map((h, k) => (
            <i key={h.id} className={k < i ? 'done' : k === i ? 'on' : ''}>
              {k === i && !paused && !last && <b key={i} style={{ animationDuration: `${STEP_MS}ms` }} />}
              {k === i && (paused || last) && <b className="full" />}
            </i>
          ))}
        </div>
      </div>
      <h3>{step.title}</h3>
      <p>{step.text}</p>
      <div className="tourcard-ctl">
        <button className="btn btn-ghost" disabled={i === 0} onClick={() => (setI((x) => x - 1), setPaused(false))}>
          ← Back
        </button>
        {last ? (
          <button className="btn btn-primary" onClick={() => setTour(false)}>
            Explore freely
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => (setI((x) => x + 1), setPaused(false))}>
            Next →
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => setTour(false)}>
          Exit
        </button>
      </div>
    </div>
  )
}
