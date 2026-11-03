import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useRoom, stations } from '../store'
import { profile } from '../content'
import { LibraryPanel } from './panels/LibraryPanel'
import { AboutPanel } from './panels/AboutPanel'
import { RagPanel } from './panels/RagPanel'
import { RvPanel, QuantPanel, SwarmPanel, BasketballPanel } from './panels/OtherPanels'
import { CrewPanel } from './panels/CrewPanel'
import { ragLab, rv, quantFund, internship, basketball } from '../content'
import { T } from './bits'

const PANELS = {
  library: { title: 'The Library', C: LibraryPanel },
  quant: { title: quantFund.title, C: QuantPanel },
  rag: { title: ragLab.title, C: RagPanel },
  rv: { title: rv.title, C: RvPanel },
  swarm: { title: internship.company, C: SwarmPanel },
  basketball: { title: basketball.headline, C: BasketballPanel },
  crew: { title: 'The Agent Crew', C: CrewPanel },
  about: { title: 'About me', C: AboutPanel },
} as const


const TOUR_MS = 11000

function Hero() {
  const station = useRoom((s) => s.station)
  const list = useRoom((s) => s.list)
  const setTour = useRoom((s) => s.setTour)
  const setList = useRoom((s) => s.setList)
  const go = useRoom((s) => s.go)
  const visited = useRoom((s) => s.visited)
  const show = station === 'overview' && !list
  return (
    <>
      <div className={`hero-scrim ${show ? '' : 'is-hidden'}`} />
      <section className={`hero ${show ? '' : 'is-hidden'}`}>
        <div className="hero-kicker">London · AI security research</div>
        <h1>
          Hi, I’m Ali.
          <span>I break AI systems, then build the monitors that catch it.</span>
        </h1>
        <div className="hero-cta">
          <button className="btn btn-primary btn-lg" onClick={() => (setTour(true), go(stations[0].id))}>
            Start the tour
          </button>
          <button className="btn btn-lg" onClick={() => setList(true)}>
            List view
          </button>
        </div>
        <p className="hero-hint">Drag to look around. Click anything with a light on it. ← → to move between stations.</p>
      </section>
      <div className={`visited ${station === 'overview' ? '' : 'is-dim'}`}>
        <div className="visited-dots">
          {stations.map((s) => (
            <i key={s.id} className={visited.includes(s.id) ? 'on' : ''} title={s.label} />
          ))}
        </div>
        <span>
          Explored {visited.length} of {stations.length}
        </span>
      </div>
    </>
  )
}

function Tour() {
  const tour = useRoom((s) => s.tour)
  const station = useRoom((s) => s.station)
  const panel = useRoom((s) => s.panel)
  const go = useRoom((s) => s.go)
  const setTour = useRoom((s) => s.setTour)
  useEffect(() => {
    if (!tour || !panel) return
    const ids = stations.map((s) => s.id)
    const i = ids.indexOf(station as (typeof ids)[number])
    const t = setTimeout(() => {
      if (i === ids.length - 1) {
        setTour(false)
        go('overview')
      } else go(ids[i + 1])
    }, TOUR_MS)
    return () => clearTimeout(t)
  }, [tour, station, panel, go, setTour])
  if (!tour || station === 'overview') return null
  const i = stations.findIndex((s) => s.id === station)
  return (
    <div className="tour">
      <span>
        Tour · {i + 1} / {stations.length}
      </span>
      <div className="tour-bar">{panel && <i key={station} style={{ animationDuration: `${TOUR_MS}ms` }} />}</div>
      <button onClick={() => setTour(false)}>Stop</button>
    </div>
  )
}

function ListView() {
  const list = useRoom((s) => s.list)
  const setList = useRoom((s) => s.setList)
  const go = useRoom((s) => s.go)
  if (!list) return null
  return (
    <div className="listview" role="dialog" aria-label="Everything in the room">
      <div className="listview-inner">
        <header>
          <div>
            <div className="sec-kicker">List view</div>
            <h2>Everything in the room</h2>
          </div>
          <button className="close" onClick={() => setList(false)} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="listview-grid">
          {stations.map((s, i) => (
            <button key={s.id} className="lv-card" onClick={() => (setList(false), go(s.id))}>
              <span className="lv-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="lv-kicker">{s.kicker}</span>
              <span className="lv-title">
                <T>{PANELS[s.id].title}</T>
              </span>
              <span className="lv-go">Visit in the room →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Loader() {
  const { progress, active } = useProgress()
  const [gone, setGone] = useState(false)
  const [entered, setEntered] = useState(false)
  const ready = !active && progress >= 100
  const [minTime, setMinTime] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMinTime(true), 1200)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (entered) {
      const t = setTimeout(() => setGone(true), 900)
      return () => clearTimeout(t)
    }
  }, [entered])
  if (gone) return null
  const canEnter = (ready || progress === 0) && minTime
  return (
    <div className={`loader ${entered ? 'is-out' : ''}`}>
      <div className="loader-inner">
        <div className="loader-kicker">An interactive room</div>
        <h1>{profile.name}</h1>
        <p>
          Research, systems and basketball. Walk around, open the books, poison a RAG system, shoot a few hoops.
        </p>
        <div className="loader-bar">
          <i style={{ width: `${canEnter ? 100 : Math.max(8, progress)}%` }} />
        </div>
        <button className="btn btn-primary btn-lg" disabled={!canEnter} onClick={() => setEntered(true)}>
          {canEnter ? 'Enter the room' : 'Setting the lights…'}
        </button>
        <div className="loader-hint">Drag to look around · click anything that glows · Esc to step back</div>
      </div>
    </div>
  )
}

function Panel() {
  const station = useRoom((s) => s.station)
  const panel = useRoom((s) => s.panel)
  const go = useRoom((s) => s.go)
  if (station === 'overview') return null
  const meta = stations.find((s) => s.id === station)!
  const { title, C } = PANELS[station]
  return (
    <aside className={`panel ${panel ? 'is-open' : ''}`} key={station}>
      <header className="panel-head">
        <div>
          <div className="panel-kicker">{meta.kicker}</div>
          <h2>
            <T>{title}</T>
          </h2>
        </div>
        <button className="close" aria-label="Back to the room" onClick={() => go('overview')}>
          ✕
        </button>
      </header>
      <div className="panel-body">
        <C />
      </div>
    </aside>
  )
}

function Dock() {
  const station = useRoom((s) => s.station)
  const hovered = useRoom((s) => s.hovered)
  const tour = useRoom((s) => s.tour)
  const setTour = useRoom((s) => s.setTour)
  const go0 = useRoom((s) => s.go)
  const go = (id: Parameters<typeof go0>[0]) => (setTour(false), go0(id))
  return (
    <nav className={`dock ${tour ? 'is-tour' : ''}`} aria-label="Stations">
      <button className={station === 'overview' ? 'on' : ''} onClick={() => go('overview')} title="Overview">
        <span className="dock-ico">⌂</span>
      </button>
      {stations.map((s) => (
        <button key={s.id} className={`${station === s.id ? 'on' : ''} ${hovered === s.id ? 'hint' : ''}`} onClick={() => go(s.id)}>
          {s.label}
        </button>
      ))}
    </nav>
  )
}

export function Interface() {
  const go = useRoom((s) => s.go)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useRoom.getState()
      if (e.key === 'Escape') {
        if (st.list) st.setList(false)
        else if (st.paperId) st.setPaper(null)
        else go('overview')
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return
        const ids = stations.map((s) => s.id)
        const i = st.station === 'overview' ? -1 : ids.indexOf(st.station)
        const n = e.key === 'ArrowRight' ? (i + 1) % ids.length : (i - 1 + ids.length) % ids.length
        go(ids[n])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  return (
    <>
      <header className="brand">
        <button onClick={() => go('overview')}>
          <b>{profile.name}</b>
          <span>
            <T>{profile.role}</T>
          </span>
        </button>
      </header>
      <div className="corner">
        <button onClick={() => useRoom.getState().setList(true)}>List view</button>
        <a href={`mailto:${profile.email}`}>Contact</a>
        <button onClick={() => go('about')}>CV</button>
      </div>
      <Hero />
      <Panel />
      <Tour />
      <Dock />
      <ListView />
      <Loader />
    </>
  )
}
