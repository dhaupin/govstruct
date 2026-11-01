/**
 * pages/Status.jsx - the family status page. Same honest-data rule as the
 * family dialect: the island fetches the siblings' served /status.json at
 * load, no server, no guessed numbers. govstruct's own row is served from its
 * own generated /status.json, which this page also links. Refresh to re-read.
 */
import usePageMeta from '../hooks/usePageMeta.js'
import site, { routeMeta } from '../site.js'

const RAW = 'https://github.com/dhaupin/govstruct/blob/main'

export default function Status() {
  const meta = routeMeta('/status')
  usePageMeta({
    siteUrl: site.url,
    path: '/status',
    title: meta.title,
    description: meta.description,
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">one dialect, every member</p>
          <h1>
            The family, <span className="accent">one status.</span>
          </h1>
          <p className="lede">
            govstruct serves its own verdicts at <code>/status.json</code>,
            generated from the committed ledger on every web build. This page
            reads its own file and the family's the way a fresh agent session
            would - no server, no numbers fresher than the commits. Refresh to
            re-read.
          </p>
          <div className="cta-row">
            <a className="btn btn-ghost" href="/status.json">/status.json</a>
            <a className="btn btn-ghost" href={`${RAW}/labs/crashledger.json`}>labs/crashledger.json</a>
            <a className="btn btn-ghost" href={site.repo}>See the repo</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>The family, one dialect</h2>
          <p className="sub">
            Every member serves the same status contract: one schema, one fixed
            path, ledger-derived numbers only.
          </p>
          <pre-island data-pre-island="family-status" data-pre-load="idle">
            <span className="island-loading">Reading the family's served status files...</span>
          </pre-island>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>What you are looking at</h2>
          <p className="sub">
            Each number is a receipt from a CI leg, not a marketing claim.
          </p>
          <div className="grid">
            <div className="card">
              <h3><span className="glyph">◉</span> the doctor's ledger</h3>
              <p>The committed verdict ledger (<code>labs/crashledger.json</code>):
              the crashtest dogfood run over govstruct lint's own refusal
              contract. Refusal stays instant and nameable; a new EXPLOITED
              fails CI.</p>
            </div>
            <div className="card">
              <h3><span className="glyph">⇄</span> packs shipped</h3>
              <p>The packstruct@1 packs this repo exports, each with its declared
              member count read from the pack bank itself. A pack the campaign
              never fires is refused, never served as zero.</p>
            </div>
            <div className="card">
              <h3><span className="glyph">✗</span> one bad sibling</h3>
              <p>A member not serving the dialect yet renders its own honest
              "not serving" row - never a guessed number, never a default PASS.
              One bad sibling degrades only its own row.</p>
            </div>
            <div className="card">
              <h3><span className="glyph">✓</span> exploited, ever</h3>
              <p>The only number that should always read 0. If it does not, the
              next CI run is red and the fix comes before any release post cites
              these ledgers again.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
