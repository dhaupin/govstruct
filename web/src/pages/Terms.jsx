/**
 * pages/Terms.jsx - govstruct's terms. Short by design: the MIT license in the
 * repo carries the real legal weight; this page states the surface facts in
 * plain language.
 */
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'
import { routeMeta } from '../site.js'

export default function Terms() {
  const meta = routeMeta('/terms')
  usePageMeta({
    path: '/terms',
    title: meta.title,
    description: meta.description,
  })
  return (
    <section className="section" style={{ paddingTop: 56 }}>
      <div className="wrap legal">
        <p className="eyebrow">Plain language, no theater</p>
        <h1>Terms</h1>
        <p>
          govstruct is MIT-licensed software; the license in the repository
          governs use of the tool. This site is documentation: it is provided
          as-is, without warranty of any kind, and nothing here is an offer, a
          contract, or support.
        </p>
        <h3>What the tool does</h3>
        <p>
          govstruct reads a manifest of members and emits the governed surfaces
          from it - the apps menu, the README tables, the status registry, the
          render surfaces. It writes only into the directories you point it at,
          and its <code>doctor</code> verb reads the surfaces you already
          serve; it sends nothing anywhere on its own.
        </p>
        <h3>What you own</h3>
        <p>
          Every manifest, rendered surface, and verdict record produced by your
          own runs belongs to <strong>you</strong>. We see nothing, hold
          nothing, and collect nothing (see <a href="/privacy">privacy</a>).
        </p>
        <h3>Fair use of the site</h3>
        <p>
          This site is documentation. Do not attack it or drown it, and do not
          represent yourself as{' '}
          <a href="https://creadev.org" target="_blank" rel="noopener">Creadev</a>{' '}
          unless you are. Site code is MIT like the package.
        </p>
        <h3>Changes</h3>
        <p>
          These terms may be adjusted as the project grows - material changes
          land with a date bump, and the repo history keeps every prior version.
        </p>
        <p style={{ marginTop: 26 }}>
          <Link to="/" className="btn btn-ghost">Back home</Link>
        </p>
      </div>
    </section>
  )
}
