/**
 * pages/What.jsx - the concrete surface: the verbs, what govstruct owns
 * versus defers, and where it sits in the family. Deep reference lives in
 * the docs and the CLI reference in the README.
 */
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'
import site, { routeMeta } from '../site.js'

export default function What() {
  const meta = routeMeta('/what')
  usePageMeta({ path: '/what', title: meta.title, description: meta.description })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">what</p>
          <h1>
            One manifest, <span className="accent">one doctor.</span>
          </h1>
          <p className="lede">
            govstruct is a zero-dependency CLI. It reads a manifest of members
            and emits every governed surface from it, then verifies each adopter
            serves the same truth. Node ESM, exit codes 0/1/2.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/packs">The pack surface</Link>
            <a className="btn btn-ghost" href={`${site.docs.url}/`}>Read the docs</a>
            <a className="btn btn-ghost" href={site.repo}>See the repo</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="section-title">The verbs</h2>
          <p className="lede" style={{ marginTop: 8 }}>
            The manifest is data; the doctor is the teeth.
          </p>
          <pre className="code"><span className="cm"># the manifest grammar</span>{'\n'}govstruct <span className="k">lint</span>{'\n'}{'\n'}<span className="cm"># emit every governed surface from the roster</span>{'\n'}govstruct <span className="k">render</span> apps | react | partial | readme | registry{'\n'}{'\n'}<span className="cm"># prove each adopter against the same truth</span>{'\n'}govstruct <span className="k">doctor</span> [--suite] [--fleet] [--network]{'\n'}{'\n'}<span className="cm"># the suite roll-up: env / pins / floors / versions</span>{'\n'}govstruct <span className="k">registry</span>{'\n'}</pre>
          <p className="lede" style={{ marginTop: 8 }}>
            Plus the lifecycle verbs: <code>lock</code> (archive + sha256
            receipt), <code>names</code> (check a candidate id), <code>migrate</code>{' '}
            (spec or field migration), <code>init</code> (scaffold a
            one-member family), <code>stamp</code>, <code>retire</code>, and{' '}
            <code>impact</code> (the propagation path).
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="section-title">What it owns, what it defers</h2>
          <p className="lede" style={{ marginTop: 8 }}>
            govstruct governs identity and conformance: who a member is, how it
            links and states itself, and whether it serves the same truth as its
            siblings. It composes the family's other arms rather than
            re-implementing them - the spec is{' '}
            <a href="https://github.com/dhaupin/packstruct">packstruct</a>'s{' '}
            <code>/packs</code>, the loader is attacked by{' '}
            <a href="https://github.com/dhaupin/crashtest">crashtest</a>, the
            rendered pane is watched by{' '}
            <a href="https://github.com/dhaupin/eyestruct">eyestruct</a>, and
            what shipped is audited by{' '}
            <a href="https://github.com/dhaupin/poststruct">poststruct</a>.
          </p>
          <p className="lede" style={{ marginTop: 8 }}>
            Transport and dispatch are not govstruct's concern: a composer like{' '}
            <a href="https://github.com/dhaupin/railyard">railyard</a> governs
            where a member's bytes come from. They meet at <code>repo</code> +{' '}
            <code>role</code>.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="section-title">Where it sits</h2>
          <p className="lede" style={{ marginTop: 8 }}>
            Surfaces are build-time artifacts, never runtime fetches - a bot
            reads a plain anchor in the served HTML. The landing you are reading
            is govstruct's own first adopter: the apps menu is rendered from the
            manifest by <code>govstruct render react</code>.
          </p>
          <p style={{ marginTop: 22 }}>
            <Link to="/about" className="btn btn-ghost">Next: about the project</Link>
          </p>
        </div>
      </section>
    </>
  )
}
