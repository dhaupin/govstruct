/**
 * pages/Privacy.jsx - govstruct's privacy page. The tool is offline by
 * default; this page states that in plain language.
 */
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'
import { routeMeta } from '../site.js'

export default function Privacy() {
  const meta = routeMeta('/privacy')
  usePageMeta({
    path: '/privacy',
    title: meta.title,
    description: meta.description,
  })
  return (
    <section className="section" style={{ paddingTop: 56 }}>
      <div className="wrap legal">
        <p className="eyebrow">The short version first</p>
        <h1>Privacy</h1>
        <p>
          The CLI collects <strong>nothing</strong>. It reads the manifests and
          surfaces you point it at, and its <code>doctor</code> verb runs
          offline by default - your source and verdicts never leave your
          machine. This site keeps its own honesty standard: no hidden state and
          no silent tracking - just docs.
        </p>
        <h3>The govstruct tool</h3>
        <ul>
          <li><strong>No telemetry</strong> - the CLI collects zero data, makes no network calls, phones no home</li>
          <li><strong>Your surfaces stay yours</strong> - manifests, rendered output, and verdict records are files in your repo, under your control</li>
          <li><strong>npm install traffic</strong> - npm's own registry logging applies, as with any package; we see none of it</li>
        </ul>
        <h3>This website</h3>
        <ul>
          <li><strong>No accounts, no forms, no in-browser state</strong> - information is not collected about you</li>
          <li><strong>Standard hosting logs</strong> - Cloudflare Pages may keep request logs (IP, timestamp); we neither buy, query, nor sell them</li>
          <li><strong>Analytics</strong> - none configured; if a hosting-added beacon is ever enabled by zone policy, it will be listed here rather than hiding</li>
          <li><strong>Cookies</strong> - none set by us; the site dwells in cookie-free simplicity</li>
        </ul>
        <h3>Third parties, named</h3>
        <p>
          This site runs on <a href="https://pages.cloudflare.com" target="_blank" rel="noopener">Cloudflare Pages</a>; the
          npm package lives on <a href="https://www.npmjs.com" target="_blank" rel="noopener">npmjs.com</a>. Their own
          policies govern their own logging. No other third parties are involved.
        </p>
        <h3>Questions</h3>
        <p>
          Open an issue on the <a href="https://github.com/dhaupin/govstruct" target="_blank" rel="noopener">repository</a> -
          it is checked. The CLI and the site are both open source, so treat this
          page as a summary of code you can go read.
        </p>
        <p style={{ marginTop: 26 }}>
          <Link to="/" className="btn btn-ghost">Back home</Link>
        </p>
      </div>
    </section>
  )
}
