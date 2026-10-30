// packs/public/surface-shapes/index.mjs - S-SURFACE: the promise stays true.
//
// The surface contract (spec/surface-contract.json) promises a consumer which
// fields of each emitted surface are stable, and at what type. That promise is
// the difference between an integrator who can pin a schemaVersion and upgrade
// consciously, and one who guesses and breaks generically. These checks keep
// the promise true: a promised field that is absent, or carries the wrong
// type, refuses by name (E_SURFACE_FIELD_MISSING / E_SURFACE_TYPE_DRIFT).
//
// Pure readers over one JSON file and the emitted surfaces. Zero network,
// zero execution.
export default {
  checks: [
    {
      id: 'contract-well-formed',
      description: 'every surface in the contract names a schemaVersion and a field map with a type',
      run: (ctx) => {
        const findings = []
        const contract = ctx.loadSurfaceContract()
        for (const [name, spec] of Object.entries(contract.surfaces)) {
          if (typeof spec.schemaVersion !== 'number') {
            findings.push({ code: 'E_SURFACE_CONTRACT_INVALID', message: `surface "${name}" names no numeric schemaVersion` })
          }
          if (!spec.fields || typeof spec.fields !== 'object' || Array.isArray(spec.fields)) {
            findings.push({ code: 'E_SURFACE_CONTRACT_INVALID', message: `surface "${name}" names no field map` })
            continue
          }
          for (const [field, rule] of Object.entries(spec.fields)) {
            if (!rule || (typeof rule.type !== 'string' && !Array.isArray(rule.type))) {
              findings.push({ code: 'E_SURFACE_CONTRACT_INVALID', message: `surface "${name}": field "${field}" names no type` })
            }
          }
        }
        return findings
      },
    },
    {
      id: 'emitted-surfaces-honored',
      description: 'every emitted surface honors the promised fields and types',
      run: (ctx) => {
        const r = ctx.verifySurfaces()
        return r.findings
      },
    },
  ],
}
