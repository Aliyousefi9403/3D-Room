import { useEffect, useState } from 'react'
import { items } from '../content'
import { useRoom } from '../store'

/** Page-flip reader for papers whose pages are pre-rendered to images. */
export function Reader() {
  const id = useRoom((s) => s.reader)
  const setReader = useRoom((s) => s.setReader)
  const it = items.find((x) => x.id === id)
  const [p, setP] = useState(0)
  const [dir, setDir] = useState(1)
  const [zoom, setZoom] = useState(false)
  const narrow = typeof window !== 'undefined' && window.innerWidth < 900
  const per = narrow ? 1 : 2
  const n = it?.pages ?? 0
  const base = it?.pdf?.replace(/\.pdf$/, '') ?? ''
  useEffect(() => {
    setP(0)
    setZoom(false)
  }, [id])
  useEffect(() => {
    if (!it) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') turn(1)
      if (e.key === 'ArrowLeft') turn(-1)
      if (e.key === 'Escape') setReader(null)
      e.stopPropagation()
    }
    window.addEventListener('keydown', k, true)
    return () => window.removeEventListener('keydown', k, true)
  })
  if (!it || !n) return null
  const turn = (d: number) => {
    const np = Math.max(0, Math.min(n - 1, p + d * per))
    if (np === p) return
    setDir(d)
    setP(np - (np % per))
  }
  const pages = Array.from({ length: per }, (_, k) => p + k).filter((x) => x < n)
  return (
    <div className="rd" role="dialog" aria-label={`Reading ${it.title}`} onClick={() => setReader(null)}>
      <div className="rd-top" onClick={(e) => e.stopPropagation()}>
        <div>
          <div className="sec-kicker">{it.venue ?? 'Paper'}</div>
          <h3>{it.title}</h3>
        </div>
        <div className="rd-actions">
          <a className="btn" href={it.pdf} download>
            PDF ↓
          </a>
          <a className="btn btn-ghost" href={it.pdf} target="_blank" rel="noreferrer">
            Open ↗
          </a>
          <button className="close" onClick={() => setReader(null)} aria-label="Close">
            ✕
          </button>
        </div>
      </div>
      <div className={`rd-stage ${zoom ? 'is-zoom' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="rd-arrow" onClick={() => turn(-1)} disabled={p === 0} aria-label="Previous page">
          ‹
        </button>
        <div className={`rd-spread per-${per}`} key={p} style={{ ['--dir' as string]: dir }}>
          {pages.map((k) => (
            <img key={k} src={`${base}-p-${k + 1}.jpg`} alt={`Page ${k + 1}`} onClick={() => setZoom((z) => !z)} />
          ))}
        </div>
        <button className="rd-arrow" onClick={() => turn(1)} disabled={p + per >= n} aria-label="Next page">
          ›
        </button>
      </div>
      <div className="rd-foot" onClick={(e) => e.stopPropagation()}>
        {Array.from({ length: n }, (_, k) => (
          <button key={k} className={pages.includes(k) ? 'on' : ''} onClick={() => (setDir(k > p ? 1 : -1), setP(k - (k % per)))}>
            {k + 1}
          </button>
        ))}
        <span>Click a page to zoom · ← → to turn</span>
      </div>
    </div>
  )
}
