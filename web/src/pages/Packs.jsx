/**
 * pages/Packs.jsx - the extension surface, promoted from the landing. The
 * human-readable face of packs/public/ + labs/crashledger.json; the manifest
 * grammar itself lives in the family SPEC (dhaupin/packstruct) and the docs
 * packs page.
 */
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'
import site, { routeMeta } from '../site.js'

const DOCS = 'https://docs.creadev.org/govstruct'
const RAW = 'https://github.com/dhaupin/govstruct/blob/main'

export default function Packs() {
  const meta = routeMeta('/packs')
  usePageMeta({
    siteUrl: site.url,
    path: '/packs',
    title: meta.title,
    description: meta.description,
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">packs</p>
          <h1>
            The suite polices itself, <span className="accent">on every push.</span>
          </h1>
          <p className="lede">
            A pack is a self-contained bundle that loads into a host's runner,
            uses the host's real surface as its vocabulary, and proves the
            contract it claims to enforce. Nothing inside a pack imports the
            target. govstruct ships ten check-profile packs and one crashtest
            lane - the same SPEC v1 grammar the whole family loads.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href={`${DOCS}/packs/`}>Full pack grammar</a>
            <a className="btn btn-ghost" href="#shipped">What ships today</a>
            <a className="btn btn-ghost" href={`${RAW}/packs/public`}>packs/public/</a>
          </div>
        </div>
      </section>

      <section className="section" id="shipped">
        <div className="wrap">
          <h2>The packs, live</h2>
          <p className="sub">
            Ten SPEC v1 check-profile packs under <code>packs/public/</code>,
            each a pure-reading verifier over files on disk, plus the crashtest
            dogfood lane that attacks <code>govstruct lint</code> with a hostile
            member-block corpus. A NEW exploited case or any verdict regression
            fails CI.
          </p>
          <div className="table-wrap">
            <table className="attacks">
              <thead>
                <tr><th>pack</th><th>what it verifies</th><th>verdict</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mod">comment-shapes</td>
                  <td><span className="what">comment hygiene across the tree</span>
                  <div className="why">pure-reading checks; a violation is named
                  at file:line</div></td>
                  <td><span className="v-ok">PASS</span></td>
                </tr>
                <tr>
                  <td className="mod">env-shapes</td>
                  <td><span className="what">environment-key declarations</span>
                  <div className="why">every env key a member claims is declared
                  once, in the shared block</div></td>
                  <td><span className="v-ok">PASS</span></td>
                </tr>
                <tr>
                  <td className="mod">floor-shapes</td>
                  <td><span className="what">engine floors</span>
                  <div className="why">a floor bump propagates through the
                  dependency graph, never drifts silently</div></td>
                  <td><span className="v-ok">PASS</span></td>
                </tr>
                <tr>
                  <td className="mod">hygiene-shapes</td>
                  <td><span className="what">tree hygiene</span>
                  <div className="why">no stray build product, lockfile, or
                  repo-bound internal in a shipped surface</div></td>
                  <td><span className="v-ok">PASS</span></td>
                </tr>
                <tr>
                  <td className="mod">naming-shapes</td>
                  <td><span className="what">the naming contract</span>
                  <div className="why">ids, aliases, and file names agree with
                  the roster grammar</div></td>
                  <td><span className="v-ok">PASS</span></td>
                </tr>
                <tr>
                  <td className="mod">pin-shapes</td>
                  <td><span className="what">pin style</span>
                  <div className="why">pins, never floats: every dependency and
                  workflow <code>uses:</code> carries an exact rev</div></td>
                  <td><span className="v-ok">PASS</span></td>
                </tr>
                <tr>
                  <td className="mod">style-shapes</td>
                  <td><span className="what">source style</span>
                  <div className="why">the shared source-consistency rules,
                  enforced as a pack, not a fifth app</div></td>
                  <td><span className="v-ok">PASS</span></td>
                </tr>
                <tr>
                  <td className="mod">test-shapes</td>
                  <td><span className="what">the test floor</span>
                  <div className="why">every member carries a real test suite,
                  not a green stub</div></td>
                  <td><span className="v-ok">PASS</span></td>
                </tr>
                <tr>
                  <td className="mod">version-shapes</td>
                  <td><span className="what">version truth</span>
                  <div className="why">package.json is the single version
                  source; a living surface cannot hand-copy it</div></td>
                  <td><span className="v-ok">PASS</span></td>
                </tr>
                <tr>
                  <td className="mod">a11y-shapes</td>
                  <td><span className="what">the emitted pane's floor</span>
                  <div className="why">a named landmark, a real anchor per row,
                  a visible focus ring, keyed strings + a locale fallback</div></td>
                  <td><span className="v-ok">PASS</span></td>
                </tr>
                <tr>
                  <td className="mod">govstruct-manifest-shapes</td>
                  <td><span className="what">hostile member blocks</span>
                  <div className="why">nine attacks over <code>govstruct
                  lint</code>: malformed blocks refuse (never crash), every
                  refusal carries a registered code, spec-allowed shapes are
                  never over-strictly flagged</div></td>
                  <td><span className="v-ok">REFUSED</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="field-report">
            The counts above are current-tree receipts, not marketing: the
            committed crashtest ledger sits at <code>labs/crashledger.json</code>
            (63 REFUSED verdicts), the packs live under <code>packs/public/</code>,
            and the full grammar is at <a href={`${DOCS}/packs/`}>the docs packs
            page</a>.
          </p>
        </div>
      </section>

      <section className="section" id="taxonomy">
        <div className="wrap">
          <h2>The verdict taxonomy</h2>
          <p className="sub">
            Every scenario lands in exactly one of four buckets. Adoption is
            explicit - a new verdict only enters the ledger through a reviewed
            commit, never a silent rebuild.
          </p>
          <div className="grid">
            <div className="card">
              <h3><span className="v-ok">REFUSED</span></h3>
              <p>The surface said no, cleanly, with its named code. A
              regression here is loud, not quiet.</p>
            </div>
            <div className="card">
              <h3><span className="v-bounded">BOUNDED</span></h3>
              <p>The damage was contained to a documented limit - a byte cap,
              a fixture lifespan. Bounds live in the ledger, not in prose.</p>
            </div>
            <div className="card">
              <h3><span className="v-ok">PASSED</span></h3>
              <p>The safe path works end to end: checks, gates, roundtrips.</p>
            </div>
            <div className="card">
              <h3><span className="v-bad">EXPLOITED</span></h3>
              <p>The attack landed. A new EXPLOITED or the regression of any
              previously recorded row fails CI.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="running">
        <div className="wrap">
          <h2>Running the lane</h2>
          <p className="sub">
            The check host reads each pack's declared checks over the tree; the
            crashtest lane drives <code>govstruct lint</code> in-process over a
            hostile corpus. Exit 0 on green, 1 on findings.
          </p>
          <pre className="code"><span className="cm"># run every check pack</span>{'\n'}<span className="k">npm</span> run check{'\n\n'}<span className="cm"># manifest + entry grammar (packstruct)</span>{'\n'}<span className="k">npm</span> run lint:packs{'\n\n'}<span className="cm"># the dogfood: hostile member blocks over the CLI</span>{'\n'}<span className="k">npx</span> crashtest run</pre>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/status">See the live verdicts</Link>
            <a className="btn btn-ghost" href={`${DOCS}/packs/`}>Write a pack</a>
            <a className="btn btn-ghost" href="https://github.com/dhaupin/packstruct">packstruct</a>
          </div>
        </div>
      </section>
    </>
  )
}
