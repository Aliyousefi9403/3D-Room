import { profile } from '../../content'
import { T, Links, Section, isTodo } from '../bits'

export function AboutPanel() {
  const cvReady = !isTodo(profile.cvUrl)
  return (
    <div>
      <div className="about-head">
        <img src={profile.photo} alt={profile.name} />
        <div>
          <div className="sec-kicker">{profile.location}</div>
          <h2 className="display">{profile.name}</h2>
          <div className="muted">
            <T>{profile.role}</T>
          </div>
        </div>
      </div>
      {profile.bio.map((b, i) => (
        <p key={i} className={i === 0 ? 'lede' : ''}>
          <T>{b}</T>
        </p>
      ))}
      <div className="cv-card">
        <div>
          <div className="sec-kicker">The paper on the desk</div>
          <h4>Curriculum Vitae</h4>
          <span className="muted">PDF · always the latest version</span>
        </div>
        {cvReady ? (
          <a className="btn btn-primary" href={profile.cvUrl} download>
            Download CV ↓
          </a>
        ) : null}
      </div>
      <Section title="Education">
        {profile.education.map((e) => (
          <div key={e.what} className="edu">
            <b>
              <T>{e.what}</T>
            </b>
            <span>
              <T>{e.where}</T>
            </span>
            <em>
              <T>{e.when}</T>
            </em>
          </div>
        ))}
      </Section>
      <Section title="Toolbox">
        <div className="tags tags-solid">
          {profile.skills.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </Section>
      <Section title="Get in touch">
        <div className="links">
          <a className="btn btn-primary" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
        </div>
        <Links links={profile.links} />
      </Section>
    </div>
  )
}
