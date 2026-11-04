import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useRoom, stations } from '../store'
import { profile } from '../content'
import { LibraryPanel } from './panels/LibraryPanel'
import { AboutPanel } from './panels/AboutPanel'
import { RagPanel } from './panels/RagPanel'
import { RvPanel, QuantPanel, SwarmPanel, BasketballPanel, QuantumPanel, StudioPanel, ViewPanel } from './panels/Panels'
import { Reader } from './Reader'
import { HighlightsTour } from './Tour'
import { music } from '../audio/ambient'
import { CrewPanel } from './panels/CrewPanel'
import { ragLab, rv, quantDesk, internship, basketball, quantum, studio, view } from '../content'
import { T } from './bits'

const PANELS = {
  library: { title: 'The Library', C: LibraryPanel },
  quant: { title: quantDesk.title, C: QuantPanel },
  rag: { title: ragLab.title, C: RagPanel },
  rv: { title: rv.title, C: RvPanel },
  swarm: { title: internship.company, C: SwarmPanel },
  basketball: { title: basketball.headline, C: BasketballPanel },
  crew: { title: 'Night Watch', C: CrewPanel },
  window: { title: view.title, C: ViewPanel },
  quantum: { title: quantum.title, C: QuantumPanel },
  studio: { title: studio.title, C: StudioPanel },
  about: { title: 'About me', C: AboutPanel },
} as const



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
          <button className="btn btn-primary btn-lg" onClick={() => setTour(true)}>
            ▶ 45-second highlights
          </button>
          <button className="btn btn-lg" onClick={() => setList(true)}>
            List view
          </button>
          <a className="btn btn-lg btn-ghost" href={profile.cvUrl} download>
            CV ↓
          </a>
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

function MusicToggle() {
  const on = useRoom((s) => s.music)
  const setMusic = useRoom((s) => s.setMusic)
  const surge = useRoom((s) => s.surge)
  useEffect(() => {
    if (surge > 0) music.surge()
  }, [surge])
  return (
    <button
      className={`music ${on ? 'on' : ''}`}
      onClick={() => {
        setMusic(!on)
        if (on) music.stop()
        else music.start()
      }}
      title={on ? 'Mute the music' : 'Play the music'}
      aria-label={on ? 'Mute the music' : 'Play the music'}
    >
      <span className="eq" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      {on ? 'Music' : 'Muted'}
    </button>
  )
}

function QualityToggle() {
  const lite = useRoom((s) => s.lite)
  const setLite = useRoom((s) => s.setLite)
  return (
    <button className="quality" onClick={() => setLite(!lite)} title="Switch rendering quality">
      <i className={lite ? '' : 'on'} />
      {lite ? 'Low' : 'High'}
    </button>
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
        <button
          className="btn btn-primary btn-lg"
          disabled={!canEnter}
          onClick={() => {
            setEntered(true)
            // browsers only allow sound after a click, so the music starts here
            if (useRoom.getState().music && !location.search.includes('video')) music.start()
          }}
        >
          {canEnter ? 'Enter the room' : 'Setting the lights…'}
        </button>
        <div className="loader-hint">Drag to look around · click anything that glows · Esc to step back</div>
        <a className="loader-flat" href="?2d">
          View without 3D →
        </a>
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
        if (st.reader) return
        if (st.list) st.setList(false)
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
        <MusicToggle />
        <QualityToggle />
        <button onClick={() => useRoom.getState().setList(true)}>List view</button>
        <a href={`mailto:${profile.email}`}>Contact</a>
        <button onClick={() => go('about')}>CV</button>
      </div>
      <Hero />
      <Panel />
      <HighlightsTour />
      <Dock />
      <ListView />
      <Reader />
      <Loader />
    </>
  )
}
