import { useState } from 'react'
import { papers, shelves, ShelfId, Paper } from '../../content'
import { useRoom } from '../../store'
import { T, Links, isTodo } from '../bits'

const STATUS: Record<Paper['status'], string> = {
  published: 'Published',
  preprint: 'Preprint',
  'in-progress': 'In preparation',
  notes: 'Lab notes',
  read: 'Built on',
  planned: 'Idea',
}

function PaperView({ p }: { p: Paper }) {
  const setPaper = useRoom((s) => s.setPaper)
  const [reading, setReading] = useState(false)
  const hasPdf = !!p.pdf && !isTodo(p.pdf)
  return (
    <div className="paper">
      <button className="back" onClick={() => setPaper(null)}>
        ← All shelves
      </button>
      <div className="chips">
        <span className={`chip st-${p.status}`}>{STATUS[p.status]}</span>
        <span className="chip">{shelves[p.shelf].label}</span>
        {p.year && (
          <span className="chip">
            <T>{p.year}</T>
          </span>
        )}
      </div>
      <h2 className="paper-title">
        <T>{p.title}</T>
      </h2>
      {p.authors && (
        <div className="paper-meta">
          <T>{p.authors}</T>
          {p.venue && (
            <>
              {' · '}
              <em>{p.venue}</em>
            </>
          )}
        </div>
      )}
      <div className="abstract">
        <div className="sec-kicker">{p.status === 'planned' ? 'The idea' : 'Abstract'}</div>
        <p>
          <T>{p.abstract}</T>
        </p>
      </div>
      <div className="tags">
        {p.tags.map((t) => (
          <span key={t}>#{t}</span>
        ))}
      </div>
      <div className="links">
        {hasPdf ? (
          <>
            <button className="btn btn-primary" onClick={() => setReading(true)}>
              Read the paper
            </button>
            <a className="btn" href={p.pdf} download>
              Download PDF
            </a>
          </>
        ) : p.pdf ? (
          <span className="btn btn-ghost is-disabled">
            PDF <em>soon</em>
          </span>
        ) : null}
      </div>
      {p.links && <Links links={p.links} />}
      {reading && hasPdf && (
        <div className="reader" onClick={() => setReading(false)}>
          <div className="reader-inner" onClick={(e) => e.stopPropagation()}>
            <div className="reader-bar">
              <span>
                <T>{p.title}</T>
              </span>
              <button onClick={() => setReading(false)}>Close ✕</button>
            </div>
            <iframe title={p.title} src={p.pdf} />
          </div>
        </div>
      )}
    </div>
  )
}

export function LibraryPanel() {
  const paperId = useRoom((s) => s.paperId)
  const setPaper = useRoom((s) => s.setPaper)
  const p = papers.find((x) => x.id === paperId)
  if (p) return <PaperView p={p} />
  const real = papers.filter((x) => x.status !== 'planned').length
  return (
    <div>
      <p className="lede">
        Every book on these shelves is something I wrote, something I built on, or something I'm going to write. Pull one out to read it.
      </p>
      <div className="stats">
        <div>
          <b>{real}</b>
          <span>volumes</span>
        </div>
        <div>
          <b>{papers.length - real}</b>
          <span>in the works</span>
        </div>
        <div>
          <b>{Object.keys(shelves).length}</b>
          <span>shelves</span>
        </div>
      </div>
      {(Object.keys(shelves) as ShelfId[]).map((id) => (
        <div key={id} className="shelf">
          <div className="shelf-head">
            <h4>{shelves[id].label}</h4>
            <span>{shelves[id].blurb}</span>
          </div>
          <ul>
            {papers
              .filter((x) => x.shelf === id)
              .map((x) => (
                <li key={x.id}>
                  <button className={`shelf-item st-${x.status}`} onClick={() => setPaper(x.id)}>
                    <i style={{ background: x.color }} />
                    <span className="shelf-title">
                      <T>{x.title}</T>
                    </span>
                    <span className="shelf-status">{STATUS[x.status]}</span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
