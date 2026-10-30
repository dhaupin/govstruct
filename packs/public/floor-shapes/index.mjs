// packs/public/floor-shapes/index.mjs - S1: engines vs the manifest row.
//
// The suite's node floors have drifted, with no registry holding them. This
// pack holds the floor table as data (the compliance block) and refuses a
// member whose shipped engines.node disagrees with its row.
export default {
  checks: [
    {
      id: 'engines-floor',
      description: 'the shipped engines.node matches the compliance floor row',
      run: (ctx) => {
        const findings = []
        const manifest = ctx.loadManifest()
        for (const m of manifest.members) {
          const comp = ctx.loadCompliance(m.id)
          if (!comp?.floors) continue
          const pkgPath = m.id === 'govstruct' ? 'package.json' : `${m.id}/package.json`
          if (!ctx.exists(pkgPath)) continue
          let engines
          try {
            engines = JSON.parse(ctx.readFile(pkgPath)).engines
          } catch {
            continue
          }
          if (!engines?.node) continue
          const want = comp.floors.consumer
          if (want && engines.node !== want) {
            findings.push({ code: 'E_SUITE_DRIFT', path: pkgPath, message: `${m.id}: engines.node "${engines.node}" != floor "${want}"` })
          }
        }
        return findings
      },
    },
  ],
}
