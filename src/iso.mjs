// src/iso.mjs - the ISO orientation + resolution engine (PRD section 10, G15).
//
// The family's compliance contract (PRD section 10) says a check can NAME its
// clause. This module is the reader for spec/iso-profile.json: a clause
// catalog (ISO 9001:2015 + ISO/IEC 27001:2022) plus a refusal-code ->
// { clause, action } resolutions map. It turns govstruct's own drift output
// into an ISO-shaped statement, so a company (or a savvy hobbyist) gets an
// orientation and a fix without reading the standard.
//
// The law is the same as everywhere in govstruct: this is an EVIDENCE MAP,
// not a certificate. govstruct certifies nothing. Every clause names the
// surface that can evidence it and the gate that proves it; a clause with no
// surface is named OUT OF SCOPE, never faked.
//
// Zero dependencies, pure readers - the same posture as the doctor.
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Refusal } from './refusals.mjs'
import { loadConfig } from './config.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const PROFILE_PATH = join(HERE, '..', 'spec', 'iso-profile.json')

let _profile = null

/**
 * Load and memoize the ISO profile. `target` is an optional project root or
 * explicit profile path: a host may point `iso.profile` at its own file. With
 * no target, the tool's own shipped profile is read. A missing/broken profile
 * is a refusal.
 */
export function loadIsoProfile(target) {
  if (target === undefined && _profile) return _profile
  const path = resolveProfilePath(target)
  if (!existsSync(path)) {
    throw new Refusal('E_ISO_PROFILE_MISSING', `the ISO profile is absent at ${path}`)
  }
  let raw
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    throw new Refusal('E_ISO_PROFILE_MISSING', `the ISO profile is not valid JSON: ${e.message}`)
  }
  if (raw.schemaVersion !== 1) {
    throw new Refusal('E_ISO_PROFILE_MISSING', `the ISO profile schemaVersion must be 1 (got ${JSON.stringify(raw.schemaVersion)})`)
  }
  if (target === undefined) _profile = raw
  return raw
}

/**
 * Resolve the profile path: an explicit .json path wins; a directory reads
 * `iso.profile` from its config, falling back to the tool's own shipped
 * profile when unset (the drop-in default). `iso.enabled: false` is a refusal.
 */
function resolveProfilePath(target) {
  if (!target) return PROFILE_PATH
  const abs = resolve(target)
  if (abs.endsWith('.json')) return abs
  let config
  try {
    ;({ config } = loadConfig(abs))
  } catch {
    // No config at the host root: fall back to the shipped profile.
    return PROFILE_PATH
  }
  if (config.iso && config.iso.enabled === false) {
    throw new Refusal('E_ISO_PROFILE_MISSING', 'the ISO profile is disabled in the config (iso.enabled: false)')
  }
  if (!config.iso?.profile) return PROFILE_PATH
  return resolve(abs, config.iso.profile)
}

/** Every clause in the catalog, in file order. */
export function clauses(profile = loadIsoProfile()) {
  return profile.clauses
}

/** The clause with id `id`, or null. */
export function clauseById(id, profile = loadIsoProfile()) {
  return clauses(profile).find((c) => c.id === id) ?? null
}

/**
 * The resolution for a refusal code: { clause, action }. Accepts a bare
 * govstruct code (E_...) or a namespaced code (tool/E_...). Returns null when
 * the code is not mapped - which the coverage check treats as a gap.
 */
export function resolveCode(code, profile = loadIsoProfile()) {
  if (typeof code !== 'string' || !code) return null
  return profile.resolutions[code] ?? null
}

/**
 * The orientation: clauses grouped by standard, then theme, with the surface
 * and gate each names. This is the "what would an auditor ask for" reading.
 * A clause whose surface is null is out of scope and is listed as such.
 */
export function isoOrientation(profile = loadIsoProfile()) {
  const p = profile
  const byStandard = new Map(p.standards.map((s) => [s.id, { id: s.id, title: s.title, url: s.url, themes: [] }]))
  const themeIndex = new Map()
  for (const c of p.clauses) {
    const std = byStandard.get(c.standard)
    if (!std) continue
    const key = `${c.standard}\u0000${c.theme}`
    let theme = themeIndex.get(key)
    if (!theme) {
      theme = { theme: c.theme, title: p.themes[c.theme] ?? c.theme, clauses: [] }
      themeIndex.set(key, theme)
      std.themes.push(theme)
    }
    theme.clauses.push({
      id: c.id,
      title: c.title,
      requires: c.requires,
      surface: c.surface,
      gate: c.gate,
      resolution: c.resolution,
      inScope: c.surface != null && c.gate != null,
    })
  }
  return {
    law: p.law,
    title: p.title,
    standards: [...byStandard.values()],
  }
}

/**
 * The coverage statement: for every registered refusal code, is there a
 * clause + action? Returns { total, covered, gaps: [{ code, reason }] }.
 * A gap is E_ISO_RESOLUTION_MISSING when the check runs - the profile cannot
 * claim an orientation it does not hold.
 */
export function isoCoverage(registry, { profile = loadIsoProfile() } = {}) {
  const p = profile
  const codes = []
  for (const [ns, map] of Object.entries(registry.namespaces)) {
    for (const code of Object.keys(map)) codes.push(ns === 'govstruct' ? code : `${ns}/${code}`)
  }
  const gaps = []
  let covered = 0
  for (const code of codes.sort()) {
    const r = p.resolutions[code]
    if (!r) {
      gaps.push({ code, reason: 'no clause/action resolution in the ISO profile' })
      continue
    }
    if (!clauseById(r.clause, p)) {
      gaps.push({ code, reason: `resolution names clause "${r.clause}", which is not in the catalog` })
      continue
    }
    if (!r.action || !String(r.action).trim()) {
      gaps.push({ code, reason: 'resolution carries no action' })
      continue
    }
    covered += 1
  }
  return { total: codes.length, covered, gaps, law: p.law }
}

/**
 * Turn a set of refusal codes (a doctor/check run's output) into an ISO
 * statement: which clauses were touched, what each requires, and the action
 * for each code. This is the drop-in answer to "the suite refused - now what,
 * in ISO terms?"
 */
export function isoStatement(codes, profile = loadIsoProfile()) {
  const p = profile
  const seen = new Map()
  const unmapped = []
  for (const code of codes) {
    const r = resolveCode(code, p)
    if (!r) {
      unmapped.push(code)
      continue
    }
    const clause = clauseById(r.clause, p)
    if (!clause) {
      unmapped.push(code)
      continue
    }
    if (!seen.has(r.clause)) seen.set(r.clause, { clause, codes: [] })
    seen.get(r.clause).codes.push({ code, action: r.action })
  }
  const touched = [...seen.values()].sort((a, b) => a.clause.id.localeCompare(b.clause.id))
  return { touched, unmapped, law: p.law, standards: p.standards }
}
