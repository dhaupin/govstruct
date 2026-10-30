// test/iso.test.mjs - the ISO orientation + resolution engine (PRD section 10, G15).
//
// The profile is an evidence map, not a certificate. These tests hold the map
// honest both ways: the shipped profile is complete (every registered refusal
// code resolves to a catalogued clause with an action), and a hostile profile
// refuses by name (a clause with no surface, a refusal with no resolution, a
// resolution pointing at an unknown clause).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadIsoProfile, isoOrientation, isoCoverage, isoStatement, resolveCode, clauseById } from '../src/iso.mjs'
import { loadCheckPacks } from '../src/check.mjs'
import { loadRegistry } from '../src/refusals.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')

// --- the shipped profile is complete (the clean side) ---

test('the shipped ISO profile loads and covers both standards', () => {
  const p = loadIsoProfile()
  assert.equal(p.schemaVersion, 1)
  const ids = p.standards.map((s) => s.id)
  assert.ok(ids.includes('9001'), 'ISO 9001 in the profile')
  assert.ok(ids.includes('27001'), 'ISO 27001 in the profile')
  assert.ok(p.clauses.length >= 30, `a real catalog (got ${p.clauses.length} clauses)`)
})

test('every registered refusal code resolves to a catalogued clause with an action', () => {
  const coverage = isoCoverage(loadRegistry())
  assert.equal(coverage.gaps.length, 0, JSON.stringify(coverage.gaps))
  assert.equal(coverage.covered, coverage.total)
  assert.ok(coverage.total >= 86, `the registry is covered (got ${coverage.total})`)
})

test('every clause is well-formed and (in scope) names a surface and a gate', () => {
  const p = loadIsoProfile()
  for (const c of p.clauses) {
    assert.ok(c.id && c.title && c.requires, `clause ${c.id} is well-formed`)
    const hasSurface = c.surface != null
    const hasGate = c.gate != null
    assert.equal(hasSurface, hasGate, `clause ${c.id} is in scope with both or out of scope with neither`)
  }
})

test('the orientation groups clauses by standard and theme', () => {
  const o = isoOrientation()
  const s9001 = o.standards.find((s) => s.id === '9001')
  const s27001 = o.standards.find((s) => s.id === '27001')
  assert.ok(s9001.themes.length > 0, 'ISO 9001 has themes')
  assert.ok(s27001.themes.length > 0, 'ISO 27001 has themes')
  // The out-of-scope themes are named, not dropped.
  const all = o.standards.flatMap((s) => s.themes.flatMap((t) => t.clauses))
  assert.ok(all.some((c) => c.id === '27001-A.6' && c.inScope === false), 'people controls named out of scope')
  assert.ok(all.some((c) => c.id === '27001-A.7' && c.inScope === false), 'physical controls named out of scope')
})

test('resolveCode answers a bare govstruct code and a namespaced sibling code', () => {
  const a = resolveCode('E_SUITE_DRIFT')
  assert.ok(a && a.clause && a.action, 'bare code resolves')
  assert.ok(clauseById(a.clause), 'the resolved clause is in the catalog')
  const b = resolveCode('crashtest/EXPLOITED')
  assert.ok(b && b.clause === '27001-A.8.29', 'namespaced sibling code resolves to A.8.29')
  assert.equal(resolveCode('E_NOT_A_CODE'), null, 'an unknown code resolves to null')
})

test('isoStatement maps a run of refusal codes to clauses, and flags unmapped', () => {
  const r = isoStatement(['E_SUITE_DRIFT', 'E_CHECKSUM_DRIFT', 'E_NOT_A_CODE'])
  assert.ok(r.touched.some((t) => t.clause.id === '9001-8.5.6'), 'the change-control clause is touched')
  assert.ok(r.touched.some((t) => t.clause.id === '27001-A.8.24'), 'the crypto clause is touched')
  assert.deepEqual(r.unmapped, ['E_NOT_A_CODE'], 'the unknown code is reported, not silently dropped')
})

// --- a hostile profile refuses by name (the broken side) ---

// Build a temp tree with a hostile profile + a copy of the registry, then run
// the iso-shapes checks over it. The pack is a pure reader, so a temp root with
// only the two files it reads is enough.
async function runIsoPack(profile, registry) {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-iso-'))
  mkdirSync(join(dir, 'spec'), { recursive: true })
  writeFileSync(join(dir, 'spec', 'iso-profile.json'), JSON.stringify(profile))
  const { readFileSync, existsSync } = await import('node:fs')
  const ctx = {
    loadIsoProfile: () => profile,
    loadRegistry: () => registry,
    loadManifest: () => ({ members: [] }),
    isoCoverage: () => isoCoverage(registry, { profile }),
    exists: (p) => existsSync(join(dir, p)),
    readFile: (p) => readFileSync(join(dir, p), 'utf8'),
  }
  const { loadCheckPacks } = await import('../src/check.mjs')
  const { packs } = await loadCheckPacks(ROOT)
  const pack = packs.find((p) => p.name === 'iso-shapes')
  const findings = []
  for (const check of pack.checks) {
    for (const f of (await check.run(ctx)) ?? []) findings.push({ check: check.id, ...f })
  }
  rmSync(dir, { recursive: true, force: true })
  return findings
}

const REG = { namespaces: { govstruct: { E_ONE: 'one' }, packstruct: {}, crashtest: {} } }

test('a clause with a surface but no gate refuses E_ISO_SURFACE_MISSING', async () => {
  const findings = await runIsoPack({
    schemaVersion: 1,
    standards: [{ id: '9001', title: 'x' }],
    themes: {},
    clauses: [{ id: '9001-1.1', standard: '9001', title: 't', requires: 'r', surface: 'a surface', gate: null, resolution: 'x' }],
    resolutions: { E_ONE: { clause: '9001-1.1', action: 'do it' } },
  }, REG)
  assert.ok(findings.some((f) => f.code === 'E_ISO_SURFACE_MISSING'), JSON.stringify(findings))
})

test('a refusal code with no resolution refuses E_ISO_RESOLUTION_MISSING', async () => {
  const findings = await runIsoPack({
    schemaVersion: 1,
    standards: [{ id: '9001', title: 'x' }],
    themes: {},
    clauses: [{ id: '9001-1.1', standard: '9001', title: 't', requires: 'r', surface: 's', gate: 'g', resolution: 'x' }],
    resolutions: {},
  }, REG)
  assert.ok(findings.some((f) => f.code === 'E_ISO_RESOLUTION_MISSING' && /E_ONE/.test(f.message)), JSON.stringify(findings))
})

test('a resolution pointing at an unknown clause refuses E_ISO_CLAUSE_UNKNOWN', async () => {
  const findings = await runIsoPack({
    schemaVersion: 1,
    standards: [{ id: '9001', title: 'x' }],
    themes: {},
    clauses: [{ id: '9001-1.1', standard: '9001', title: 't', requires: 'r', surface: 's', gate: 'g', resolution: 'x' }],
    resolutions: { E_ONE: { clause: '9001-99.9', action: 'do it' } },
  }, REG)
  assert.ok(findings.some((f) => f.code === 'E_ISO_CLAUSE_UNKNOWN'), JSON.stringify(findings))
})

test('a member clause annotation naming an uncatalogued clause refuses E_ISO_CLAUSE_UNKNOWN', async () => {
  const profile = loadIsoProfile()
  const { packs } = await loadCheckPacks(ROOT)
  const check = packs.find((p) => p.name === 'iso-shapes').checks.find((c) => c.id === 'member-clause-known')
  const ctx = {
    loadIsoProfile: () => profile,
    loadManifest: () => ({ members: [{ id: 'x', clause: { '9001-8.5.2': 'traveler audit', '9001-99.9': 'bogus' } }] }),
  }
  const findings = (await check.run(ctx)) ?? []
  assert.ok(findings.some((f) => f.code === 'E_ISO_CLAUSE_UNKNOWN' && /9001-99.9/.test(f.message)), JSON.stringify(findings))
  assert.ok(!findings.some((f) => /9001-8.5.2/.test(f.message)), 'the catalogued clause is clean')
})
