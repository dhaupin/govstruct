/**
 * pages/Why.jsx - why govstruct exists: the crosslink-mesh problem and the
 * governance thesis. The deep grammar lives in the docs; this is the
 * human-readable face.
 */
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'
import site, { routeMeta } from '../site.js'

export default function Why() {
  const meta = routeMeta('/why')
  usePageMeta({ path: '/why', title: meta.title, description: meta.description })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">why</p>
          <h1>
            The mesh was hand-typed. <span className="accent">Now it is governed.</span>
          </h1>
          <p className="lede">
            A family of repos links to itself everywhere - apps menus, README
            tables, status registries - and every one of those links is a
            hand-typed copy that drifts. govstruct makes the mesh governed data
            with teeth.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/what">What govstruct is</Link>
            <a className="btn btn-ghost" href={`${site.docs.url}/`}>Read the docs</a>
            <a className="btn btn-ghost" href={site.repo}>See the repo</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="section-title">The problem: N copies of one fact</h2>
          <p className="lede" style={{ marginTop: 8 }}>
            A suite of N repos that links to itself carries the same fact - who
            is a member, where it lives, what it pins - in N places at once. The
            apps menu says one thing, the README table another, the status
            registry a third. Nothing is wrong until one copy is edited and the
            others are not, and then the mesh lies in the one place nobody
            re-reads.
          </p>
          <p className="lede" style={{ marginTop: 8 }}>
            The fix is not discipline. Discipline is the thing that already
            failed. The fix is to make the mesh a single authored source that
            every surface is emitted from, and to make a disagreement a
            refusal rather than a drift nobody notices for a quarter.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="section-title">The thesis: refusal, not warning</h2>
          <p className="lede" style={{ marginTop: 8 }}>
            A doctor that warns into green is politeness theater. govstruct
            refuses nameably at author time: a manifest that breaks the grammar
            is a setup error with an exit code, not a log line to scroll past. A
            member that cannot be proven against the same truth is refused by
            name, and the name is registered in the refusal vocabulary.
          </p>
          <p className="lede" style={{ marginTop: 8 }}>
            Manifest frozen, refusal instant and nameable. The apps menu is
            payload #1, not the product - governance over how members link,
            state, and pin themselves is the product.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="section-title">Who it is for</h2>
          <p className="lede" style={{ marginTop: 8 }}>
            Anyone maintaining a suite of repos that must agree about
            themselves: the maintainer who owns the crosslink mesh, the CI that
            has to prove every member serves the same truth, and the agent that
            has to edit identity in one file instead of hunting literals across
            three languages.
          </p>
          <p style={{ marginTop: 22 }}>
            <Link to="/what" className="btn btn-ghost">Next: what govstruct is</Link>
          </p>
        </div>
      </section>
    </>
  )
}
