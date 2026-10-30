// packs/public/pin-shapes/index.mjs - S3: the pin ledger.
//
// The suite's pin discipline is real and scattered. This pack indexes the
// pin classes a repo carries (action pins in workflows, the spec
// `implements` row) and refuses an unrecorded pin. It does NOT replace the
// per-repo surfaces - it indexes them.
const ACTION_PIN_RE = /uses:\s*([^\s#]+)@([^\s#]+)/g

export default {
  checks: [
    {
      id: 'action-pins',
      description: 'no GitHub Action use floats on a moving branch (@main/@master/@HEAD)',
      run: (ctx) => {
        // The family norm is a tag pin (@v4) or a full commit SHA; both are
        // immutable enough. The real hazard is a floating branch, so that is
        // the only shape this refuses - a check the SPEC promises.
        const findings = []
        const wfDir = '.github/workflows'
        if (!ctx.exists(wfDir)) return findings
        for (const f of ctx.list(wfDir, { ext: '.yml' })) {
          const src = ctx.readFile(f)
          for (const match of src.matchAll(ACTION_PIN_RE)) {
            const [, action, ref] = match
            if (action.startsWith('./')) continue
            if (/^(main|master|HEAD)$/i.test(ref)) {
              findings.push({ code: 'E_SUITE_DRIFT', path: f, message: `action ${action} floats on "${ref}" (pin a tag or a commit SHA)` })
            }
          }
        }
        return findings
      },
    },
    {
      id: 'spec-pin',
      description: 'a repo that ships packs/ records its packstruct pin',
      run: (ctx) => {
        const findings = []
        if (!ctx.exists('packs')) return findings
        let pkg
        try {
          pkg = JSON.parse(ctx.readFile('package.json'))
        } catch {
          return findings
        }
        const dev = pkg.devDependencies ?? {}
        const dep = pkg.dependencies ?? {}
        if (!dev.packstruct && !dep.packstruct) {
          findings.push({ code: 'E_SUITE_DRIFT', message: 'packs/ present but no packstruct pin in package.json' })
        }
        return findings
      },
    },
  ],
}
