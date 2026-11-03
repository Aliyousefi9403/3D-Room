import { shelves, ShelfId, KIND_LABEL } from '../../content'
import { ORDER } from '../../scene/stations/Library'
import { useRoom } from '../../store'
import { T, Links, Bullets, isTodo } from '../bits'

export function LibraryPanel() {
  const i = useRoom((s) => s.libIndex)
  const set = useRoom((s) => s.setLibIndex)
  const setReader = useRoom((s) => s.setReader)
  const it = ORDER[i]
  const go = (d: number) => set((i + d + ORDER.length) % ORDER.length)
  const hasPdf = !!it.pdf && !isTodo(it.pdf)
  return (
    <div className="lib">
      <div className="lib-nav">
        <button className="btn btn-ghost" onClick={() => go(-1)} aria-label="Previous">
          ↑
        </button>
        <div className="lib-count">
          <b>{String(i + 1).padStart(2, '0')}</b>
          <span>/ {ORDER.length}</span>
        </div>
        <button className="btn btn-ghost" onClick={() => go(1)} aria-label="Next">
          ↓
        </button>
        <span className="lib-hint">Scroll over the shelf to pull out the next one</span>
      </div>

      <article className="lib-item" key={it.id}>
        <div className="chips">
          <span className={`chip k-${it.kind}`}>{KIND_LABEL[it.kind]}</span>
          <span className="chip">{shelves[it.shelf].label}</span>
          {it.year && (
            <span className="chip">
              <T>{it.year}</T>
            </span>
          )}
        </div>
        <h2 className="paper-title">
          <T>{it.title}</T>
        </h2>
        {it.subtitle && (
          <div className="lib-sub">
            <T>{it.subtitle}</T>
          </div>
        )}
        {it.authors && (
          <div className="paper-meta">
            {it.authors}
            {it.venue && (
              <>
                <br />
                <em>{it.venue}</em>
              </>
            )}
          </div>
        )}
        <div className="abstract">
          <div className="sec-kicker">{it.kind === 'paper' ? 'Abstract' : it.kind === 'idea' ? 'The idea' : 'The story'}</div>
          <p>
            <T>{it.body}</T>
          </p>
        </div>
        {it.points && (
          <div style={{ marginTop: 18 }}>
            <Bullets items={it.points} />
          </div>
        )}
        <div className="tags">
          {it.tags.map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
        <div className="links">
          {it.pages && (
            <button className="btn btn-primary" onClick={() => setReader(it.id)}>
              Read the paper
            </button>
          )}
          {hasPdf && (
            <a className="btn" href={it.pdf} download>
              Download PDF ↓
            </a>
          )}
        </div>
        {it.links && <Links links={it.links} />}
      </article>

      <div className="lib-index">
        {(Object.keys(shelves) as ShelfId[]).map((sid) => (
          <div key={sid} className="lib-row">
            <h4>{shelves[sid].label}</h4>
            <div>
              {ORDER.map((x, k) =>
                x.shelf === sid ? (
                  <button key={x.id} className={`lib-dot ${k === i ? 'on' : ''} ${x.kind === 'idea' ? 'idea' : ''}`} style={{ ['--c' as string]: x.color }} onClick={() => set(k)} title={x.title.replace(/^✎\s*/, '')} />
                ) : null,
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
