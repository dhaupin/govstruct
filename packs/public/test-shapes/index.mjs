// packs/public/test-shapes/index.mjs - S7: a test exists for every living
// module. Structure only: presence, never coverage quality.
const SKIP = /(^|\/)(test|tests|node_modules|dist|_site|horcrux|\.git|packs)\//

export default {
  checks: [
    {
      id: 'module-has-test',
      description: 'every src/ module has a matching test file',
      run: (ctx) => {
        const findings = []
        const modules = ctx.list('src', { ext: '.mjs' })
        if (modules.length === 0) return findings
        const tests = ctx.list('test').join('\n')
        for (const m of modules) {
          const base = m.replace(/^src\//, '').replace(/\.mjs$/, '')
          if (base === 'index') continue
          if (!tests.includes(base)) {
            findings.push({ code: 'E_SUITE_DRIFT', path: m, message: `no test references module "${base}"` })
          }
        }
        return findings
      },
    },
  ],
}
