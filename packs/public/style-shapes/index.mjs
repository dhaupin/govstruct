// packs/public/style-shapes/index.mjs - S7: the family's style, as data.
//
// Mechanical style only (trailing whitespace, tabs, en/em dashes). Voice
// and wording are poststruct's leg - govstruct never judges a sentence.
const DASH = /[\u2013\u2014]/

export default {
  checks: [
    {
      id: 'no-trailing-whitespace',
      description: 'no trailing whitespace in source',
      run: (ctx) => {
        const findings = []
        for (const f of ctx.list('.', { ext: '.mjs' })) {
          const lines = ctx.readFile(f).split('\n')
          lines.forEach((line, i) => {
            if (/[ \t]+$/.test(line)) {
              findings.push({ code: 'E_SUITE_DRIFT', path: f, message: `trailing whitespace on line ${i + 1}` })
            }
          })
        }
        return findings
      },
    },
    {
      id: 'no-en-em-dash',
      description: 'no en or em dashes in prose files (family prose law)',
      run: (ctx) => {
        const findings = []
        for (const f of ctx.list('.', { ext: '.md' })) {
          if (DASH.test(ctx.readFile(f))) {
            findings.push({ code: 'E_SUITE_DRIFT', path: f, message: 'en or em dash present (family prose law)' })
          }
        }
        return findings
      },
    },
  ],
}
