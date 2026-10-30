// packs/public/a11y-shapes/index.mjs - S5 (G8): accessibility and i18n.
//
// The menu and registry render on EVERY member site, so govstruct's own
// surfaces need a stated floor: "a mesh that is present but unusable is not
// governed." This pack checks the rendered pane (the partial surface, which
// is the one a stranger drops into a Jekyll include):
//
//   a11y: a named landmark, a real anchor (never a click-handler div), a
//         visible focus ring, and no inline onclick.
//   i18n: chrome strings are keyed (data-i18n), the locale is honest
//         (data-i18n-default), and a missing locale falls back explicitly.
//
// The interop law governs the crossing: the deeper a11y leg (contrast, real
// DOM) belongs to poststruct, which govstruct invokes by CLI. This pack
// checks the structural floor that travels with the emitted bytes.
const PANE = 'web/public/apps-menu.html'

export default {
  checks: [
    {
      id: 'pane-landmark',
      description: 'the rendered pane carries a named landmark',
      run: (ctx) => {
        const findings = []
        if (!ctx.exists(PANE)) return findings
        const html = ctx.readFile(PANE)
        if (!/<nav\b/i.test(html)) {
          findings.push({ code: 'E_A11Y_NO_LANDMARK', path: PANE, message: 'pane has no <nav> landmark' })
        }
        if (!/<nav\b[^>]*aria-label="[^"]+"/i.test(html)) {
          findings.push({ code: 'E_A11Y_NO_LANDMARK', path: PANE, message: 'landmark <nav> has no aria-label' })
        }
        return findings
      },
    },
    {
      id: 'pane-real-anchors',
      description: 'every menu row is a real anchor, never a click-handler div',
      run: (ctx) => {
        const findings = []
        if (!ctx.exists(PANE)) return findings
        const html = ctx.readFile(PANE)
        const rows = html.match(/<li class="apps-menu__item">/g) || []
        const links = html.match(/<a class="apps-menu__link" href="/g) || []
        if (rows.length !== links.length) {
          findings.push({
            code: 'E_A11Y_FAKE_ANCHOR', path: PANE,
            message: `${rows.length} row(s) but ${links.length} real anchor(s): a row is not a link`,
          })
        }
        if (/\bonclick=/i.test(html)) {
          findings.push({ code: 'E_A11Y_FAKE_ANCHOR', path: PANE, message: 'inline onclick handler on the pane' })
        }
        return findings
      },
    },
    {
      id: 'pane-focus-ring',
      description: 'the pane declares a visible focus ring',
      run: (ctx) => {
        const findings = []
        if (!ctx.exists(PANE)) return findings
        const html = ctx.readFile(PANE)
        if (!/:focus-visible\b/.test(html)) {
          findings.push({ code: 'E_A11Y_NO_FOCUS', path: PANE, message: 'no :focus-visible rule on the pane' })
        }
        return findings
      },
    },
    {
      id: 'pane-i18n-keyed',
      description: 'chrome strings are keyed and the locale falls back explicitly',
      run: (ctx) => {
        const findings = []
        if (!ctx.exists(PANE)) return findings
        const html = ctx.readFile(PANE)
        const landmark = html.match(/<nav\b[^>]*>/i)
        if (landmark) {
          if (!/data-i18n="[^"]+"/.test(landmark[0])) {
            findings.push({ code: 'E_I18N_UNKEYED', path: PANE, message: 'landmark string is not keyed (data-i18n)' })
          }
          if (!/data-i18n-default="[a-z]{2}/.test(landmark[0])) {
            findings.push({ code: 'E_I18N_NO_FALLBACK', path: PANE, message: 'keyed landmark declares no explicit locale fallback' })
          }
        }
        return findings
      },
    },
  ],
}
