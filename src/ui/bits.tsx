import { ReactNode } from 'react'
import type { Link } from '../content'
import { useRoom } from '../store'

export const isTodo = (s?: string) => !!s && s.trim().startsWith('✎')
const strip = (s: string) => s.replace(/^\s*✎\s*/, '')

/** Renders text; placeholders (starting with ✎) get a dashed "fill me" style. */
export function T({ children }: { children: string }) {
  if (isTodo(children)) return <span className="todo" title="Placeholder: edit src/content.ts">{strip(children) || 'to fill in'}</span>
  return <>{children}</>
}

export function Links({ links }: { links: Link[] }) {
  if (!links.length) return null
  return (
    <div className="links">
      {links.map((l) =>
        l.href.startsWith('#read:') ? (
          <button key={l.label} className="btn btn-primary" onClick={() => useRoom.getState().setReader(l.href.slice(6))}>
            {l.label}
          </button>
        ) : isTodo(l.href) ? (
          <span key={l.label} className="btn btn-ghost is-disabled" title="Add the link in src/content.ts">
            {l.label} <em>soon</em>
          </span>
        ) : (
          <a key={l.label} className="btn" href={l.href} target={l.href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer" download={l.href.endsWith('.pdf') ? '' : undefined}>
            {l.label} <span aria-hidden>↗</span>
          </a>
        ),
      )}
    </div>
  )
}

export function Section({ title, children, kicker }: { title: string; kicker?: string; children: ReactNode }) {
  return (
    <section className="sec">
      {kicker && <div className="sec-kicker">{kicker}</div>}
      <h3>{title}</h3>
      {children}
    </section>
  )
}

export function KV({ items }: { items: { k: string; v: string }[] }) {
  return (
    <dl className="kv">
      {items.map((i) => (
        <div key={i.k}>
          <dt>{i.k}</dt>
          <dd>
            <T>{i.v}</T>
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="bullets">
      {items.map((s, i) => (
        <li key={i}>
          <T>{s}</T>
        </li>
      ))}
    </ul>
  )
}

/** Horizontal bar chart, values 0..max. */
export function Bars({ rows, max = 1, fmt = (v: number) => v.toFixed(3), accent }: { rows: { label: string; value: number; tone?: 'good' | 'bad' | 'warn' | 'base' }[]; max?: number; fmt?: (v: number) => string; accent?: string }) {
  return (
    <div className="bars">
      {rows.map((r) => (
        <div key={r.label} className={`bar tone-${r.tone ?? 'base'}`}>
          <div className="bar-label">{r.label}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(r.value / max) * 100}%`, background: accent }} />
          </div>
          <div className="bar-val">{fmt(r.value)}</div>
        </div>
      ))}
    </div>
  )
}
