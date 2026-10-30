// packs/public/comment-shapes/index.mjs - S7: public exports are documented.
//
// Presence only - tone and wording are poststruct's leg (govstruct never
// judges a sentence). A public export with no leading comment is the row.
const EXPORT_RE = /^export\s+(async\s+)?(function|class)\s+([A-Za-z_$][\w$]*)/gm

export default {
  checks: [
    {
      id: 'export-documented',
      description: 'a public src/ export carries a leading comment',
      run: (ctx) => {
        const findings = []
        for (const f of ctx.list('src', { ext: '.mjs' })) {
          const lines = ctx.readFile(f).split('\n')
          lines.forEach((line, i) => {
            const m = EXPORT_RE.exec(line)
            EXPORT_RE.lastIndex = 0
            if (!m) return
            // Walk back over blank lines; a comment above the export is a doc.
            let j = i - 1
            while (j >= 0 && lines[j].trim() === '') j--
            const above = j >= 0 ? lines[j].trim() : ''
            if (!above.startsWith('//') && !above.endsWith('*/')) {
              findings.push({ code: 'E_SUITE_DRIFT', path: f, message: `export "${m[3]}" has no leading comment` })
            }
          })
        }
        return findings
      },
    },
  ],
}
