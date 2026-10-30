// packs/public/hygiene-shapes/index.mjs - S7: no debugger, no stray log, no
// committed secret. Structural hygiene, one rule each.
const SKIP = /(^|\/)(node_modules|dist|_site|horcrux|\.git|test|tests|packs)\//
const SECRET = /(BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36})/

export default {
  checks: [
    {
      id: 'no-debugger',
      description: 'no committed debugger statement',
      run: (ctx) => {
        const findings = []
        for (const f of ctx.list('.', { ext: '.mjs' })) {
          if (SKIP.test(f)) continue
          if (/\bdebugger\b/.test(ctx.readFile(f))) {
            findings.push({ code: 'E_SUITE_DRIFT', path: f, message: 'committed debugger statement' })
          }
        }
        return findings
      },
    },
    {
      id: 'no-secret',
      description: 'no committed secret material',
      run: (ctx) => {
        const findings = []
        for (const f of ctx.list('.')) {
          if (SKIP.test(f) || f.endsWith('.png') || f.endsWith('.jpg')) continue
          let src
          try {
            src = ctx.readFile(f)
          } catch {
            continue
          }
          if (SECRET.test(src)) {
            findings.push({ code: 'E_SUITE_DRIFT', path: f, message: 'possible committed secret material' })
          }
        }
        return findings
      },
    },
  ],
}
