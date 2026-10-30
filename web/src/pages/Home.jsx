/**
 * pages/Home.jsx - govstruct's landing. The product is its own first adopter:
 * the apps menu below is the pane govstruct emits from its own manifest
 * (`govstruct render react --write` -> web/src/components/AppsMenu.jsx), so the
 * page that describes the controller layer is built by it.
 *
 * Keep the structure: usePageMeta lives in the component BODY (calling it
 * inside another effect was an invalid hook call - React #321 tore the tree
 * down on the live crashtest site; transcribed fix), the .code pre carries the
 * token classes the docs Rouge output shares (.k/.cm), and CTAs compose .btn +
 * a color modifier (the base class carries geometry).
 */
import usePageMeta from '../hooks/usePageMeta.js'
import site, { routeMeta } from '../site.js'
import AppsMenu from '../components/AppsMenu.jsx'

export default function Home() {
  const meta = routeMeta('/')
  usePageMeta({ siteUrl: site.url, path: '/', title: meta.title, description: meta.description })
  return (
    <section className="hero">
      <div className="wrap">
        <p className="eyebrow">{site.name}</p>
        <h1>
          One manifest of members, <span className="accent">one doctor that refuses.</span>
        </h1>
        <p className="lede">
          The controller layer for a family of repos. The crosslink mesh - the apps
          menu, the README tables, the status registry - stops being hand-typed N
          times and becomes governed data with teeth. Every surface is emitted from
          one manifest; every adopter is proven against the same truth.
        </p>
        <div className="cta-row">
          <a className="btn btn-primary" href={site.repo}>See the repo</a>
          <a className="btn btn-ghost" href={`${site.docs.url}/`}>Read the docs</a>
        </div>
        <pre className="code"><span className="cm"># the doctor is offline by default; refusal is instant and nameable</span>{'\n'}npx <span className="k">govstruct</span> <span className="k">doctor</span>{'\n'}<span className="cm"># {'>'} exit 0 honored, 1 any refusal, 2 usage - never a warning into green</span></pre>
      </div>

      {/* The product's own payload: the apps menu, emitted from the manifest
          (`govstruct render react --write`). Server-rendered, NOT an island:
          the doctrine (PRD 5) is that the pane exists in the SERVED HTML as
          a plain anchor - no hydrate-only menu, no runtime fetch. */}
      <div className="wrap" style={{ marginTop: 56 }}>
        <h2 className="section-title">The suite, rendered from the manifest</h2>
        <p className="lede" style={{ marginTop: 8 }}>
          This pane is not hand-typed: it is govstruct&apos;s own
          <code> render react</code> surface over its own member roster, served
          on the page that documents it. The product is its first adopter.
        </p>
        <AppsMenu />
      </div>
    </section>
  )
}
