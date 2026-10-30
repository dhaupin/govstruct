// packs/public/env-shapes/index.mjs - S2: declared env keys vs source.
//
// eyestruct already proved the shape: a battery leg derives the live
// inventory from the source so a key cannot appear in code unannounced.
// This lifts it to the suite: every member declares its env keys, and a
// `*STRUCT_*` name absent from the registry is dead code by definition.
const ENV_RE = /\bprocess\.env\.([A-Z][A-Z0-9_]*)\b/g

export default {
  checks: [
    {
      id: 'env-registry',
      description: 'every process.env key in source is declared in the member compliance block',
      run: (ctx) => {
        const findings = []
        const manifest = ctx.loadManifest()
        const declared = new Set()
        for (const m of manifest.members) {
          const comp = ctx.loadCompliance(m.id)
          if (Array.isArray(comp?.env)) for (const e of comp.env) declared.add(e.key)
        }
        for (const f of ctx.list('.', { ext: '.mjs' })) {
          if (f.startsWith('test/') || f.startsWith('packs/')) continue
          const src = ctx.readFile(f)
          for (const match of src.matchAll(ENV_RE)) {
            const key = match[1]
            if (!key.endsWith('_STRUCT') && !key.startsWith('GOVSTRUCT_') && !declared.has(key)) {
              findings.push({ code: 'E_SUITE_DRIFT', path: f, message: `env key ${key} is not in the registry` })
            }
          }
        }
        return findings
      },
    },
  ],
}
