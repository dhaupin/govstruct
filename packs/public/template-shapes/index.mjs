// packs/public/template-shapes/index.mjs - S3: starter pin floors vs the pins.
//
// A starter template ships dependency pins (react, vite, react-router), and an
// integrator that cuts a repo from it must know the floors it may rely on
// (issue #23, ask #2). The compliance block carries the floors as data
// (`templates: { file, floors: [{ name, floor }] }`); this check refuses a
// template pin that has drifted below its declared floor, by name.
//
// Pure readers over the compliance blocks and one package.json per member.
// Zero network, zero execution.
export default {
  checks: [
    {
      id: 'template-floor-honored',
      description: 'every starter template pin honors the floor its compliance block declares',
      run: (ctx) => {
        const findings = []
        const manifest = ctx.loadManifest()
        for (const m of manifest.members) {
          const comp = ctx.loadCompliance(m.id)
          if (!comp?.templates?.floors?.length) continue
          const file = comp.templates.file ?? 'web/package.json'
          if (!ctx.exists(file)) {
            findings.push({ code: 'E_TEMPLATE_FLOOR_DRIFT', path: file, message: `${m.id}: declares template floors but ships no ${file}` })
            continue
          }
          let pkg
          try {
            pkg = JSON.parse(ctx.readFile(file))
          } catch {
            findings.push({ code: 'E_TEMPLATE_FLOOR_DRIFT', path: file, message: `${m.id}: ${file} is not valid JSON` })
            continue
          }
          const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }
          for (const row of comp.templates.floors) {
            if (!row || typeof row.name !== 'string' || !row.name) continue
            const spec = deps[row.name]
            if (typeof spec !== 'string') {
              findings.push({ code: 'E_TEMPLATE_FLOOR_DRIFT', path: file, message: `${m.id}: template floor "${row.name}" ${row.floor} names a dependency the template does not pin` })
              continue
            }
            if (!ctx.honorsFloor(spec, row.floor)) {
              findings.push({ code: 'E_TEMPLATE_FLOOR_DRIFT', path: file, message: `${m.id}: template pin "${row.name}" "${spec}" is below the declared floor "${row.floor}"` })
            }
          }
        }
        return findings
      },
    },
  ],
}
