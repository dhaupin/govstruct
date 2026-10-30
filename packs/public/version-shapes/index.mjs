// packs/public/version-shapes/index.mjs - S4: version truth.
//
// coreforge's census leg already encodes the law: package.json is THE
// single version source, and every living surface that names the current
// version must match or the release commit fails. This generalizes it.
const SKIP = /(^|\/)(labs|docs|node_modules|dist|_site|horcrux|\.git)\//
const RANGE = /^[\^~]/

export default {
  checks: [
    {
      id: 'version-truth',
      description: 'no living surface names a version other than the root package.json',
      run: (ctx) => {
        const findings = []
        let root
        try {
          root = JSON.parse(ctx.readFile('package.json'))
        } catch {
          return findings
        }
        if (!root.version) return findings
        // A workspace package.json must match the root version.
        for (const f of ctx.list('.', { ext: '.json' })) {
          if (SKIP.test(f)) continue
          if (f === 'package.json') continue
          if (!/(^|\/)package\.json$/.test(f)) continue
          try {
            const pkg = JSON.parse(ctx.readFile(f))
            if (pkg.version && pkg.version !== root.version && !RANGE.test(pkg.version)) {
              findings.push({ code: 'E_SUITE_DRIFT', path: f, message: `version ${pkg.version} != root ${root.version}` })
            }
          } catch {
            // not our file to judge
          }
        }
        return findings
      },
    },
  ],
}
