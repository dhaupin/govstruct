// packs/public/naming-shapes/index.mjs - S7: file names match ids, no
// cross-namespace imports. The rename lesson (16.5), made a rule.
const KEBAB = /^[a-z0-9][a-z0-9.-]*$/

export default {
  checks: [
    {
      id: 'file-kebab-case',
      description: 'source file names are kebab-case (lowercase, no spaces)',
      run: (ctx) => {
        const findings = []
        for (const f of ctx.list('src', { ext: '.mjs' })) {
          const base = f.replace(/^src\//, '').replace(/\.mjs$/, '')
          if (!KEBAB.test(base)) {
            findings.push({ code: 'E_SUITE_DRIFT', path: f, message: `file name "${base}" is not kebab-case` })
          }
        }
        return findings
      },
    },
    {
      id: 'member-id-matches',
      description: 'a member block file name matches its id',
      run: (ctx) => {
        const findings = []
        for (const f of ctx.list('members', { ext: '.json' })) {
          const base = f.replace(/^members\//, '').replace(/\.json$/, '')
          if (!KEBAB.test(base)) {
            findings.push({ code: 'E_SUITE_DRIFT', path: f, message: `member file "${base}" is not kebab-case` })
          }
        }
        return findings
      },
    },
  ],
}
