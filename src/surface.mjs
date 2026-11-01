// src/surface.mjs - the surface stability contract (PRD 5.1, issue #23).
//
// A consumer (creadev.org's forge lane, vant's connector, railyard) reads
// registry.v1.json and binds to its fields. Without a stated contract, an
// integrator guesses which fields are safe and a schema change breaks them
// generically. This module is the reader for spec/surface-contract.json: it
// says which fields of each emitted surface a consumer may rely on, and it
// verifies a rendered surface against that promise.
//
// The law, same as the ISO profile: the contract is DATA, and it must stay
// true. A promised field that is absent, or carries the wrong type, is a
// refusal with a name (E_SURFACE_FIELD_MISSING / E_SURFACE_TYPE_DRIFT), not a
// silent drift. Pure readers over one JSON file and the rendered surfaces.
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Refusal } from './refusals.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CONTRACT_PATH = join(HERE, '..', 'spec', 'surface-contract.json')

let _contract = null

/** Load and memoize the surface contract. */
export function loadSurfaceContract() {
  if (_contract) return _contract
  const raw = JSON.parse(readFileSync(CONTRACT_PATH, 'utf8'))
  if (raw.schemaVersion !== 1) {
    throw new Refusal('E_SURFACE_CONTRACT_INVALID', `surface-contract.json: schemaVersion must be 1 (got ${JSON.stringify(raw.schemaVersion)})`)
  }
  _contract = raw
  return _contract
}

/** Every named surface in the contract, as { name, ...spec } rows. */
export function surfaces(contract = loadSurfaceContract()) {
  return Object.entries(contract.surfaces).map(([name, spec]) => ({ name, ...spec }))
}

/** The contract for one surface (e.g. "registry", "member"), or null. */
export function surfaceByName(name, contract = loadSurfaceContract()) {
  const spec = contract.surfaces[name]
  return spec ? { name, ...spec } : null
}

/**
 * Check one parsed surface payload against its contract. Returns an array of
 * findings ({ code, message }), empty when the payload honors every promise.
 * Only contract:true fields are enforced; a free-form field may be anything.
 */
export function checkSurface(name, payload, contract = loadSurfaceContract()) {
  const spec = surfaceByName(name, contract)
  if (!spec) {
    return [{ code: 'E_SURFACE_UNKNOWN', message: `surface "${name}" is not in the contract` }]
  }
  const findings = []
  const rows = name === 'registry' || name === 'apps' ? [payload] : (Array.isArray(payload) ? payload : [payload])
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      findings.push({ code: 'E_SURFACE_CONTRACT_INVALID', message: `surface "${name}" is not an object` })
      continue
    }
    for (const [field, rule] of Object.entries(spec.fields)) {
      if (!rule.contract) continue
      if (!(field in row)) {
        if (rule.optional) continue
        findings.push({ code: 'E_SURFACE_FIELD_MISSING', message: `surface "${name}": promised field "${field}" is absent` })
        continue
      }
      const want = Array.isArray(rule.type) ? rule.type : [rule.type]
      const got = row[field] === null ? 'null' : Array.isArray(row[field]) ? 'array' : typeof row[field]
      if (!want.includes(got)) {
        findings.push({ code: 'E_SURFACE_TYPE_DRIFT', message: `surface "${name}": field "${field}" is ${got}, contract says ${want.join(' | ')}` })
      }
    }
  }
  return findings
}

/**
 * Verify the emitted surfaces on disk against the contract. Returns
 * { ok, findings: [{ code, message }] }. Reads registry.v1.json, registry.json,
 * and apps.json when present; a surface not yet emitted is a state, not a
 * finding (a stranger who has not rendered yet is not in breach).
 */
export function verifySurfaces(root = '.', contract = loadSurfaceContract()) {
  const findings = []
  const read = (rel) => {
    const p = join(root, rel)
    if (!existsSync(p)) return null
    try { return JSON.parse(readFileSync(p, 'utf8')) } catch (e) {
      return { __parseError: e.message }
    }
  }
  const reg = read('registry.v1.json')
  if (reg) {
    if (reg.__parseError) findings.push({ code: 'E_SURFACE_CONTRACT_INVALID', message: `registry.v1.json is not valid JSON: ${reg.__parseError}` })
    else {
      findings.push(...checkSurface('registry', reg, contract))
      if (Array.isArray(reg.members)) findings.push(...checkSurface('registry-member', reg.members, contract))
    }
  }
  const apps = read('apps.json')
  if (apps && !apps.__parseError) {
    findings.push(...checkSurface('apps', apps, contract))
    if (Array.isArray(apps.members)) findings.push(...checkSurface('member', apps.members, contract))
  }
  return { ok: findings.length === 0, findings }
}
