// packs/public/iso-shapes/index.mjs - S-ISO: the evidence map stays honest.
//
// The ISO profile (spec/iso-profile.json) claims an orientation: every clause
// names the surface that can evidence it and the gate that proves it; every
// registered refusal code names the clause it bears on and the action that
// clears it. These checks keep that claim true. They are the reason the frame
// is an evidence map and not a brochure: a clause with no surface refuses
// (E_ISO_SURFACE_MISSING), a refusal with no resolution refuses
// (E_ISO_RESOLUTION_MISSING), and a resolution that points at a clause not in
// the catalog refuses (E_ISO_CLAUSE_UNKNOWN).
//
// Pure readers over one JSON file. Zero network, zero execution.
export default {
  checks: [
    {
      id: 'clause-catalogued',
      description: 'every ISO profile clause is well-formed and (in scope) names a surface and a gate',
      run: (ctx) => {
        const findings = []
        const profile = ctx.loadIsoProfile()
        const standards = new Set(profile.standards.map((s) => s.id))
        const seen = new Set()
        for (const c of profile.clauses) {
          if (!c.id || typeof c.id !== 'string') {
            findings.push({ code: 'E_ISO_SURFACE_MISSING', message: 'a clause has no id' })
            continue
          }
          if (seen.has(c.id)) {
            findings.push({ code: 'E_ISO_CLAUSE_UNKNOWN', message: `clause "${c.id}" is declared twice` })
          }
          seen.add(c.id)
          if (!standards.has(c.standard)) {
            findings.push({ code: 'E_ISO_CLAUSE_UNKNOWN', message: `clause "${c.id}" names an unknown standard "${c.standard}"` })
          }
          if (!c.title || !c.requires) {
            findings.push({ code: 'E_ISO_SURFACE_MISSING', message: `clause "${c.id}" must carry a title and a "requires"` })
          }
          // In scope = has a surface AND a gate. Out of scope (both null) is
          // allowed and named; a half-claim (one without the other) is a lie.
          const hasSurface = c.surface != null && String(c.surface).trim() !== ''
          const hasGate = c.gate != null && String(c.gate).trim() !== ''
          if (hasSurface !== hasGate) {
            findings.push({
              code: 'E_ISO_SURFACE_MISSING',
              message: `clause "${c.id}" names ${hasSurface ? 'a surface but no gate' : 'a gate but no surface'} - a clause is in scope only when both are named, or out of scope with neither`,
            })
          }
        }
        return findings
      },
    },
    {
      id: 'resolution-complete',
      description: 'every registered refusal code maps to a clause and an action in the ISO profile',
      run: (ctx) => {
        const coverage = ctx.isoCoverage()
        return coverage.gaps.map((g) => ({
          code: 'E_ISO_RESOLUTION_MISSING',
          message: `${g.code}: ${g.reason}`,
        }))
      },
    },
    {
      id: 'resolution-clause-known',
      description: 'every resolution points at a clause that is in the catalog',
      run: (ctx) => {
        const findings = []
        const profile = ctx.loadIsoProfile()
        const known = new Set(profile.clauses.map((c) => c.id))
        for (const [code, r] of Object.entries(profile.resolutions)) {
          if (!r || !r.clause) {
            findings.push({ code: 'E_ISO_RESOLUTION_MISSING', message: `${code}: resolution carries no clause` })
            continue
          }
          if (!known.has(r.clause)) {
            findings.push({ code: 'E_ISO_CLAUSE_UNKNOWN', message: `${code}: resolution names clause "${r.clause}", which is not in the catalog` })
          }
          if (!r.action || !String(r.action).trim()) {
            findings.push({ code: 'E_ISO_RESOLUTION_MISSING', message: `${code}: resolution carries no action` })
          }
        }
        return findings
      },
    },
    {
      id: 'member-clause-known',
      description: 'every member clause annotation (PRD section 4) names a catalogued clause',
      run: (ctx) => {
        const findings = []
        const profile = ctx.loadIsoProfile()
        const known = new Set(profile.clauses.map((c) => c.id))
        const manifest = ctx.loadManifest()
        for (const m of manifest.members ?? []) {
          if (m.clause === undefined) continue
          if (!m.clause || typeof m.clause !== 'object' || Array.isArray(m.clause)) {
            findings.push({ code: 'E_ISO_CLAUSE_UNKNOWN', message: `member "${m.id}": clause must be an object map of clause id to evidence` })
            continue
          }
          for (const [clauseId, evidence] of Object.entries(m.clause)) {
            if (!known.has(clauseId)) {
              findings.push({ code: 'E_ISO_CLAUSE_UNKNOWN', message: `member "${m.id}": clause "${clauseId}" is not in the ISO catalog` })
            }
            if (!evidence || !String(evidence).trim()) {
              findings.push({ code: 'E_ISO_SURFACE_MISSING', message: `member "${m.id}": clause "${clauseId}" names no evidence` })
            }
          }
        }
        return findings
      },
    },
  ],
}
