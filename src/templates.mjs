// src/templates.mjs - the starter pin floors (PRD section 10 S3, issue #23).
//
// A starter template ships dependency pins (react, vite, react-router), and an
// integrator that cuts a repo from it must know the floors it may rely on.
// Without declared truth the integrator guesses, and a floor that silently
// drifts breaks every cut repo. So the compliance block carries the floors as
// data (`templates: { file, floors: [{ name, floor }] }`), and a check verifies
// the pinned spec honors each floor.
//
// The comparison is deliberately small and honest: a floor names a minimum
// (">=18"), a pin names a range ("^18.3.1"); the pin's lowest reachable
// version must be at or above the floor. A pin below the floor refuses by name
// (E_TEMPLATE_FLOOR_DRIFT) - never a silent pass.
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/** The default template package.json, relative to the member root. */
export const DEFAULT_TEMPLATE_FILE = 'web/package.json'

/**
 * Parse a version-ish string into ordered numeric parts. A leading range
 * operator (^ ~ >= > <= < =) and a leading "v" are stripped; a trailing
 * pre-release/build suffix is dropped. Returns [] when no digits are present.
 */
export function versionParts(s) {
  if (typeof s !== 'string') return []
  const m = s.match(/\d+(?:\.\d+)*/)
  if (!m) return []
  return m[0].split('.').map((n) => Number.parseInt(n, 10))
}

/** Compare two version-part arrays: -1, 0, or 1 (missing parts read as 0). */
export function compareParts(a, b) {
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i += 1) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x < y) return -1
    if (x > y) return 1
  }
  return 0
}

/**
 * Does `spec` honor `floor`? Both are version-ish strings; the spec's lowest
 * reachable version must be at or above the floor's minimum. A spec or floor
 * with no digits cannot be compared and reads as honored (a state, not a
 * refusal) - the check only refuses a pin it can prove is below the floor.
 */
export function honorsFloor(spec, floor) {
  const s = versionParts(spec)
  const f = versionParts(floor)
  if (!s.length || !f.length) return true
  return compareParts(s, f) >= 0
}

/**
 * Check one compliance block's template floors against the pinned specs in
 * `pkg` (a parsed package.json). Returns an array of findings
 * ({ code, message, path }), empty when every pin honors its floor.
 */
export function checkTemplateFloors(block, pkg, { file = DEFAULT_TEMPLATE_FILE } = {}) {
  const findings = []
  const floors = block?.templates?.floors
  if (!Array.isArray(floors) || floors.length === 0) return findings
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) }
  for (const row of floors) {
    if (!row || typeof row.name !== 'string' || !row.name) continue
    const spec = deps[row.name]
    if (typeof spec !== 'string') {
      findings.push({ code: 'E_TEMPLATE_FLOOR_DRIFT', path: file, message: `template floor "${row.name}" ${row.floor} names a dependency the template does not pin` })
      continue
    }
    if (!honorsFloor(spec, row.floor)) {
      findings.push({ code: 'E_TEMPLATE_FLOOR_DRIFT', path: file, message: `template pin "${row.name}" "${spec}" is below the declared floor "${row.floor}"` })
    }
  }
  return findings
}

/** Read a member's template floors against its template package.json on disk. */
export function templateFloorsFor(root, block) {
  const file = block?.templates?.file ?? DEFAULT_TEMPLATE_FILE
  const p = join(root, file)
  if (!existsSync(p)) return []
  let pkg
  try {
    pkg = JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return [{ code: 'E_TEMPLATE_FLOOR_DRIFT', path: file, message: `template file "${file}" is not valid JSON` }]
  }
  return checkTemplateFloors(block, pkg, { file })
}
