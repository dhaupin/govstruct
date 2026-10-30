// test/surface.test.mjs - the surface stability contract (PRD section 5.1).
//
// The contract is a promise to a consumer: which fields are stable, and at
// what type. These tests hold the promise honest both ways: the shipped
// surfaces honor every promised field, and a hostile payload refuses by name
// (a promised field absent, a promised field retyped, an unknown surface).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadSurfaceContract, surfaces, surfaceByName, checkSurface, verifySurfaces } from '../src/surface.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')

// --- the shipped contract is complete (the clean side) ---

test('the shipped surface contract loads and names every surface', () => {
  const c = loadSurfaceContract()
  assert.equal(c.schemaVersion, 1)
  const names = surfaces(c).map((s) => s.name)
  for (const want of ['registry', 'registry-member', 'member', 'apps']) {
    assert.ok(names.includes(want), `contract names the "${want}" surface`)
  }
})

test('every surface names a schemaVersion and a field map', () => {
  for (const s of surfaces()) {
    assert.equal(typeof s.schemaVersion, 'number', `${s.name} has a schemaVersion`)
    assert.ok(s.fields && typeof s.fields === 'object', `${s.name} has a field map`)
    for (const [field, rule] of Object.entries(s.fields)) {
      assert.ok(rule.type, `${s.name}.${field} names a type`)
    }
  }
})

test('the shipped emitted surfaces honor the contract', () => {
  const r = verifySurfaces(ROOT)
  assert.equal(r.findings.length, 0, JSON.stringify(r.findings))
  assert.equal(r.ok, true)
})

// --- a hostile payload refuses by name (the broken side) ---

test('a promised field absent refuses E_SURFACE_FIELD_MISSING', () => {
  const findings = checkSurface('member', { id: 'x', name: 'X' })
  assert.ok(findings.some((f) => f.code === 'E_SURFACE_FIELD_MISSING' && /"role"/.test(f.message)), JSON.stringify(findings))
})

test('a promised field retyped refuses E_SURFACE_TYPE_DRIFT', () => {
  const good = { id: 'x', name: 'X', role: 'arm', status: 'Live', section: 'open-source', order: 1, blurb: 'b', icon: 'i', url: 'https://x.org', repo: 'a/b', npm: 'x', aliases: [], home: null, needs: [], grants: [], clause: {} }
  const findings = checkSurface('member', { ...good, order: 'first' })
  assert.ok(findings.some((f) => f.code === 'E_SURFACE_TYPE_DRIFT' && /"order"/.test(f.message)), JSON.stringify(findings))
})

test('an optional promised field may be absent without a finding', () => {
  const noOptional = { id: 'x', name: 'X', role: 'arm', status: 'Live', section: 'open-source', order: 1, blurb: 'b', icon: 'i', url: null, repo: null, npm: null, aliases: [], home: null, needs: [], grants: [] }
  const findings = checkSurface('member', noOptional)
  assert.equal(findings.length, 0, JSON.stringify(findings))
})

test('a free-form field may carry anything', () => {
  const base = { schemaVersion: 1, generated: {}, address: {}, family: {}, memberCount: 1, order: [], members: [] }
  const findings = checkSurface('apps', { ...base, compliance: 'not-an-object-at-all' })
  assert.equal(findings.length, 0, JSON.stringify(findings))
})

test('an unknown surface refuses E_SURFACE_UNKNOWN', () => {
  const findings = checkSurface('nope', {})
  assert.equal(findings[0].code, 'E_SURFACE_UNKNOWN')
})

test('a null optional field with the wrong type still refuses', () => {
  const findings = checkSurface('registry-member', { id: 'x', name: 'X', role: 'arm', status: 'Live', url: 5, blurb: 'b' })
  assert.ok(findings.some((f) => f.code === 'E_SURFACE_TYPE_DRIFT' && /"url"/.test(f.message)), JSON.stringify(findings))
})

// --- verifySurfaces over a hostile tree ---

test('verifySurfaces refuses a drifted emitted surface', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-surface-'))
  try {
    // a registry-member row missing the promised "role" field
    writeFileSync(join(dir, 'registry.v1.json'), JSON.stringify({
      schemaVersion: 1, generated: {}, address: {}, family: {}, memberCount: 1, order: [], graph: [],
      members: [{ id: 'x', name: 'X', status: 'Live', url: null, blurb: 'b' }],
      byRole: {}, byStatus: {},
    }))
    const r = verifySurfaces(dir)
    assert.equal(r.ok, false)
    assert.ok(r.findings.some((f) => f.code === 'E_SURFACE_FIELD_MISSING' && /"role"/.test(f.message)), JSON.stringify(r.findings))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('verifySurfaces treats an unemitted surface as a state, not a finding', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-surface-'))
  try {
    mkdirSync(join(dir, 'members'), { recursive: true })
    const r = verifySurfaces(dir)
    assert.equal(r.ok, true)
    assert.equal(r.findings.length, 0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
