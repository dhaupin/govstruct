// src/adopters.mjs - the adopter gate (PRD M2.5, the compliance.yml leg).
//
// The suite roll-up is only real when the members that CONSUME it actually
// adopt it, at the version the suite serves, pinned exactly (the house rule
// "pins, never floats", PRD 16.x). This is the low end of the fleet meter
// (G13): the meter watches what a member SHIPS; this gate watches who
// CONSUMES govstruct, and how.
//
// Rule of three (PRD M2.5): the gate cannot CLAIM "suite" until >=2 members
// adopt. A single adopter is a pilot - the gate says so, by name, rather than
// passing silently over an empty set. Drift refuses regardless of the count;
// only the *claim* waits. Offline by default: it reads a local checkout when
// it can find one and otherwise names the adopter as unchecked, never a
// silent pass.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig } from './config.mjs'
import { RefusalBag } from './refusals.mjs'

/** The rule of three: a suite claim needs at least two real adopters. */
export const SUITE_CLAIM_MIN = 2

/** The version the suite serves: the tool's own package.json version. */
export function readSuiteVersion(root) {
  const p = join(root, 'package.json')
  if (!existsSync(p)) return null
  try {
    const pkg = JSON.parse(readFileSync(p, 'utf8'))
    return typeof pkg.version === 'string' ? pkg.version : null
  } catch {
    return null
  }
}

/**
 * Read how a checkout pins govstruct, best-effort. Returns
 * { present, hasPackageJson, spec, style, version }; absent facts are `null`,
 * never guessed. `style` is 'exact' | 'range' | 'other'.
 */
export function readAdopterPin(knownRoot) {
  const out = { present: false, hasPackageJson: false, spec: null, style: null, version: null }
  if (!knownRoot || !existsSync(knownRoot)) return out
  out.present = true
  const p = join(knownRoot, 'package.json')
  if (!existsSync(p)) return out
  out.hasPackageJson = true
  let pkg
  try {
    pkg = JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return out
  }
  const spec = pkg.devDependencies?.govstruct ?? pkg.dependencies?.govstruct ?? null
  if (typeof spec !== 'string') return out
  out.spec = spec
  out.style = classifyPin(spec)
  out.version = exactVersionOf(spec)
  return out
}

/** Classify a version spec: a bare version is exact; ^ ~ ranges are range. */
function classifyPin(spec) {
  if (/^\d+\.\d+\.\d+(?:[-+].+)?$/.test(spec)) return 'exact'
  if (/^[\^~]/.test(spec)) return 'range'
  return 'other'
}

/** The exact version a spec names, or null when it names a range. */
function exactVersionOf(spec) {
  const digits = spec.match(/^\d+\.\d+\.\d+(?:[-+].+)?$/)
  return digits ? digits[0] : null
}

/**
 * Normalize an adopter entry. A bare id string is a declaration with no known
 * checkout source; an object carries { id, repo?, rev? } where repo is the
 * owner/name to check out and rev is the pinned commit the suite verifies.
 */
export function normalizeAdopter(entry) {
  if (typeof entry === 'string') return { id: entry, repo: null, rev: null }
  if (entry && typeof entry === 'object' && typeof entry.id === 'string') {
    return { id: entry.id, repo: entry.repo ?? null, rev: entry.rev ?? null }
  }
  return null
}

/**
 * The adopter gate: every DECLARED adopter's pin vs the version the suite
 * serves. `roots` maps adopter id -> a known checkout path (optional).
 * Returns { ok, refusals, report, lines }.
 *
 * A declared adopter with no checkout is UNCHECKED - a named state, never a
 * silent pass. A checked-out adopter that does not pin govstruct, pins a
 * range, or pins the wrong version refuses by name. The suite CLAIM is earned
 * only at >= 2 VERIFIED adopters; below that the gate reports a pilot state
 * and does not claim suite - it never passes silently over an empty set.
 */
export function adopterGate(target = '.', { roots = {}, suiteVersion: servedOverride } = {}) {
  const { root, config } = loadConfig(target)
  const bag = new RefusalBag()
  const lines = []
  const declared = (config.adopters?.list ?? []).map(normalizeAdopter).filter(Boolean)
  const suiteVersion = servedOverride ?? readSuiteVersion(root)
  const rows = []
  const unchecked = []
  let verified = 0

  for (const entry of declared) {
    const id = entry.id
    const knownRoot = roots[id] ?? null
    const pin = readAdopterPin(knownRoot)
    rows.push({ id, repo: entry.repo, rev: entry.rev, read: pin.present, spec: pin.spec, style: pin.style, version: pin.version })

    if (!pin.present) {
      // No checkout: the gate cannot see the pin. Name it, never pass silently.
      unchecked.push(id)
      continue
    }
    if (!pin.hasPackageJson || pin.spec === null) {
      bag.add('E_ADOPTER_MISSING', `declared adopter "${id}" does not pin govstruct in its checkout`, { id })
      continue
    }
    verified += 1
    if (pin.style !== 'exact') {
      bag.add('E_ADOPTER_PIN_STYLE_DRIFT', `adopter "${id}" pins govstruct as "${pin.style}", not exact`, { id, style: pin.style })
    }
    if (suiteVersion && pin.version !== suiteVersion) {
      bag.add('E_ADOPTER_VERSION_DRIFT', `adopter "${id}" pins govstruct ${pin.version ?? pin.spec}, suite serves ${suiteVersion}`, {
        id, pinned: pin.version ?? pin.spec, served: suiteVersion,
      })
    }
  }

  const claim = verified >= SUITE_CLAIM_MIN
  const report = { declared: declared.length, verified, unchecked: unchecked.length, claim, suiteVersion, rows }

  lines.push(`govstruct doctor --adopters: ${declared.length} adopter(s) declared, ${verified} verified to pin govstruct@${suiteVersion ?? '?'}`)
  if (claim) {
    lines.push(`  claim  suite (>= ${SUITE_CLAIM_MIN} adopters)`)
  } else {
    lines.push(`  note   pilot: the suite claim waits for >= ${SUITE_CLAIM_MIN} adopters (have ${verified}); refusing drift regardless`)
  }
  if (unchecked.length) lines.push(`  note   ${unchecked.length} declared adopter(s) had no local checkout to verify: ${unchecked.join(', ')}`)
  for (const r of bag.sorted()) lines.push(`  REFUSED [${r.code}]: ${r.message}`)

  return { ok: bag.ok, refusals: bag.sorted(), report, lines }
}
