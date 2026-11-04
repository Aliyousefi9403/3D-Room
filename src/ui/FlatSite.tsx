import { useState } from 'react'
import { profile, items, shelves, ShelfId, KIND_LABEL, ragLab, rv, studio, basketball, quantum } from '../content'
import { useRoom } from '../store'
import { SpotThePoison } from './panels/SpotThePoison'

/** The whole portfolio without WebGL: same content, plain HTML. */
export function FlatSite({ reason }: { reason: 'no-webgl' | 'chosen' | 'crashed' }) {
  const setReader = useRoom((s) => s.setReader)
  const [open, setOpen] = useState<string | null>(null)
  const paper = items.find((i) => i.id === 'aegisrag')!
  return (
    <div className="flat">
      <header className="flat-top">
        <b>{profile.name}</b>
        <nav>
          <a href="#research">Research</a>
          <a href="#projects">Projects</a>
          <a href="#about">About</a>
          <a className="btn btn-primary" href={profile.cvUrl} download>
            CV ↓
          </a>
        </nav>
      </header>

      {reason !== 'chosen' && (
        <div className="flat-note">
          {reason === 'no-webgl' ? 'Your browser has 3D graphics turned off, so you’re seeing the fast version of my portfolio.' : 'The 3D room couldn’t start on this device, so you’re seeing the fast version.'}{' '}
          Everything important is here.
        </div>
      )}

      <section className="flat-hero">
        <div className="hero-kicker">London · AI security research</div>
        <h1>Hi, I’m Ali.</h1>
        <p>{profile.bio[0]}</p>
        <p>{profile.bio[1]}</p>
        <div className="links">
          <a className="btn btn-primary btn-lg" href={profile.cvUrl} download>
            Download my CV
          </a>
          <button className="btn btn-lg" onClick={() => setReader('aegisrag')}>
            Read the paper
          </button>
          {reason === 'chosen' && (
            <a className="btn btn-lg btn-ghost" href={location.pathname}>
              Enter the 3D room
            </a>
          )}
        </div>
        <div className="flat-contact">
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
          {profile.links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer">
              {l.label} ↗
            </a>
          ))}
        </div>
      </section>

      <section id="research" className="flat-sec">
        <div className="sec-kicker">Research · AegisRAG</div>
        <h2>{paper.title}</h2>
        <p className="flat-sub">{paper.subtitle}</p>
        <p className="muted">{paper.authors} · {paper.venue}</p>
        <p>{paper.body}</p>
        <div className="flat-stats">
          <div>
            <b>0.714 → 0.555</b>
            <span>answer correctness after poisoning</span>
          </div>
          <div>
            <b>0.95</b>
            <span>AUROC, synonym-gap detector</span>
          </div>
          <div>
            <b>0 / 57</b>
            <span>sections a likelihood-constrained attacker beat</span>
          </div>
          <div>
            <b>41% → 26%</b>
            <span>edited text reaching the model, with the runtime monitor</span>
          </div>
        </div>
        <div className="links">
          <button className="btn btn-primary" onClick={() => setReader('aegisrag')}>
            Read the paper
          </button>
          <a className="btn" href={paper.pdf} download>
            PDF ↓
          </a>
        </div>
        <h3>Can you spot the poisoned answer?</h3>
        <SpotThePoison />
        <h3>What I found</h3>
        <ul className="bullets">
          {ragLab.findings.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <h3>{rv.title}</h3>
        <p>{rv.summary}</p>
      </section>

      <section id="projects" className="flat-sec">
        <div className="sec-kicker">Everything on the shelves</div>
        <h2>Projects, red team &amp; experience</h2>
        {(Object.keys(shelves) as ShelfId[]).map((sid) => (
          <div key={sid} className="flat-shelf">
            <h3>{shelves[sid].label}</h3>
            <div className="flat-grid">
              {items
                .filter((i) => i.shelf === sid && i.id !== 'aegisrag')
                .map((i) => (
                  <article key={i.id} className={`flat-card ${open === i.id ? 'open' : ''}`} style={{ ['--c' as string]: i.color }} onClick={() => setOpen(open === i.id ? null : i.id)}>
                    <span className="flat-kind">{KIND_LABEL[i.kind]}</span>
                    <h4>{i.title}</h4>
                    {i.subtitle && <p className="flat-sub">{i.subtitle}</p>}
                    <p>{i.body}</p>
                    {open === i.id && i.points && (
                      <ul className="bullets">
                        {i.points.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    )}
                    {i.links && (
                      <div className="links" onClick={(e) => e.stopPropagation()}>
                        {i.links
                          .filter((l) => !l.href.startsWith('#'))
                          .map((l) => (
                            <a key={l.label} className="btn btn-ghost" href={l.href} target={l.href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer">
                              {l.label}
                            </a>
                          ))}
                      </div>
                    )}
                  </article>
                ))}
            </div>
          </div>
        ))}
      </section>

      <section className="flat-sec">
        <div className="sec-kicker">BreachLab on YouTube</div>
        <h2>Security, animated</h2>
        <p>{studio.summary.replace(' The TV plays the real videos. Pick one below.', '')}</p>
        <div className="eps">
          {studio.videos.map((v) => (
            <a key={v.id} className="ep" href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer">
              <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" loading="lazy" />
              <span>
                <em>{v.kind === 'short' ? 'Short' : 'Video'}</em>
                {v.t}
              </span>
            </a>
          ))}
        </div>
      </section>

      <section id="about" className="flat-sec flat-two">
        <div>
          <div className="sec-kicker">Basketball</div>
          <h2>#13, Iran U18</h2>
          {basketball.story.map((s) => (
            <p key={s}>{s}</p>
          ))}
        </div>
        <div>
          <div className="sec-kicker">Off hours</div>
          <h2>Quantum &amp; Tesla</h2>
          <p>{quantum.summary}</p>
          <p>{quantum.note}</p>
        </div>
      </section>

      <footer className="flat-foot">
        <a className="btn btn-primary btn-lg" href={profile.cvUrl} download>
          Download my CV
        </a>
        <span>
          {profile.name} · {profile.location} · <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </span>
      </footer>
    </div>
  )
}
