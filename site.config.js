/**
 * site.config.js - THE site identity, authored once, read everywhere.
 *
 * This is the one file an adopter edits for identity. Everything else derives
 * from it: the JS surfaces import it directly (no generation, no drift), and
 * `npm run sync` fans the non-JS surfaces out of it (web/ssr.config.js,
 * docs/freestruct.config.yml, docs/_config.yml, web/public/robots.txt,
 * web/public/site.webmanifest). The brand census gate refuses an identity
 * literal that lives anywhere else, so "replace every YOUR... value" is
 * mechanical, not a manual hunt across three languages.
 *
 * Named site.config.js, not govstruct.config.js, on purpose: the config is
 * named for the CONCERN (the site), never the tool, and govstruct.config.json
 * is already the TOOL's own config (member dir, gates, adopters). prestruct
 * reads web/ssr.config.js and freestruct discovers docs/freestruct.config.yml -
 * both engine-owned, both DERIVED here.
 */
export default {
  // --- identity -----------------------------------------------------------
  name: 'govstruct',
  wordmark: { accent: 'gov', rest: 'struct' },
  badge: 'beta',
  tagline: 'One manifest, one doctor, every member proven.',
  description:
    'The controller layer for a family of repos: one manifest of members, one render surface per deployment shape, one doctor verb that verifies every adopter serves the same truth.',
  url: 'https://govstruct.creadev.org',
  repo: 'https://github.com/dhaupin/govstruct',
  author: 'dhaupin',
  license: 'MIT',
  keywords:
    'govstruct, governance, manifest, suite, monorepo, conformance, doctor, ci, render-surface, zero-dependencies',

  // The maker line + org (footer + the docs layout's provenance row).
  maker: { label: 'Rook @ Creadev.org', url: 'https://creadev.org' },
  org: { name: 'Creadev.org', url: 'https://creadev.org' },

  // --- docs ---------------------------------------------------------------
  // docsUrl is the full public docs URL; docsHost is the Jekyll `url` (the
  // freestruct layer reads host + path separately).
  docs: {
    title: 'govstruct docs',
    url: 'https://docs.creadev.org/govstruct',
    host: 'https://docs.creadev.org',
    baseurl: '/govstruct',
  },

  // --- theme --------------------------------------------------------------
  // The two axes as data. themeKey/schemeKey are protocol constants shared by
  // the pre-paint bootstrap, both switches, and the docs layout - they are NOT
  // brand, so they stay stable across rebrands.
  theme: {
    themeKey: 'site-theme',
    schemeKey: 'site-paint-scheme',
    defaultMode: 'dark',
    defaultScheme: 'iris',
  },

  // --- nav vocabulary -----------------------------------------------------
  // ONE list the header, the burger sidebar, and the footer all render from.
  // 'site' = internal route (NavLink-active); 'out' = external surface (the
  // header GitHub icon replaces this entry's label there; the footer still
  // renders the text link).
  nav: [
    { label: 'Home', to: '/', end: true, group: 'site' },
    { label: 'Status', to: '/status', group: 'site' },
    { label: 'GitHub', href: 'https://github.com/dhaupin/govstruct', group: 'out' },
  ],
  // Footer-only extras (legal + provenance). Keep legal labels smaller than
  // the nav; provenance links belong in the footer, not the header.
  footerExtras: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
  ],

  // --- routes -------------------------------------------------------------
  // One entry per Route in web/src/AppLayout.jsx; drives the sitemap, the
  // prerender list, and the per-page meta. `title`/`description` are the
  // canonical per-route meta; the page component may override via usePageMeta.
  routes: [
    {
      path: '/',
      priority: '1.0',
      changefreq: 'monthly',
      meta: {
        title: 'govstruct - the controller layer for a family of repos',
        description:
          'One manifest of members, one render surface per deployment shape, one doctor verb that verifies every adopter serves the same truth. Manifest frozen, refusal instant and nameable.',
      },
    },
    {
      path: '/status',
      priority: '0.7',
      changefreq: 'weekly',
      meta: {
        title: 'Family status | govstruct',
        description:
          'The family-status@1 dialect: every struct-family member serves its committed-ledger verdicts at /status.json, generated on every web build, and reads the others with the same schema.',
      },
    },
    {
      path: '/terms',
      priority: '0.3',
      changefreq: 'yearly',
      meta: {
        title: 'Terms | govstruct',
        description: 'Terms of use for the govstruct tool and this site.',
      },
    },
    {
      path: '/privacy',
      priority: '0.3',
      changefreq: 'yearly',
      meta: {
        title: 'Privacy | govstruct',
        description: 'What this site collects: nothing hidden, no tracking states to find.',
      },
    },
  ],

  // The static 404 the host serves every miss; the shape + copy match
  // pages/NotFound.jsx so the host-not-found and the hydrate-not-found read
  // as one page, not two.
  notFound: {
    heading: '404',
    body: 'No member at this address.',
    primaryCta: { label: 'Back to the manifest', href: '/' },
  },
}
