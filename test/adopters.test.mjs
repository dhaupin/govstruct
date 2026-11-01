// test/adopters.test.mjs - the adopter gate (PRD M2.5, the compliance.yml leg).
//
// The gate watches who CONSUMES govstruct and how: a declared adopter must
// have a checkout, must pin govstruct, and must pin the exact version the
// suite serves. The suite CLAIM is earned at >= 2 verified adopters; below
// that the gate reports a pilot state and never passes silently.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { adopterGate, readAdopterPin, readCommitPin, SUITE_CLAIM_MIN } from '../src/adopters.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const FIX = join(HERE, 'fixtures', 'adopters')
const CLEAN = join(HERE, 'fixtures', 'adopters-clean')
const REPOS = join(FIX, 'repos')
const CLEAN_REPOS = join(CLEAN, 'repos')
const COMMIT = join(HERE, 'fixtures', 'adopters-commit')
const COMMIT_REPOS = join(COMMIT, 'repos')
const codes = (r) => r.refusals.map((x) => x.code)

test('the gate is deterministic and offline', () => {
  const a = adopterGate(FIX)
  const b = adopterGate(FIX)
  assert.deepEqual(a.lines, b.lines)
})

test('a declared adopter with no checkout is unchecked, never a silent pass', () => {
  const r = adopterGate(FIX)
  assert.equal(r.report.unchecked, 5)
  assert.match(r.lines.join('\n'), /no local checkout to verify/)
  assert.ok(codes(r).includes('E_ADOPTER_MISSING') === false, 'no checkout is a state, not a refusal')
})

test('an adopter that does not pin govstruct refuses by name', () => {
  const r = adopterGate(FIX, { roots: { epsilon: join(REPOS, 'epsilon') } })
  assert.ok(codes(r).includes('E_ADOPTER_MISSING'), JSON.stringify(r.refusals))
})

test('a range pin refuses with the pin-style code', () => {
  const r = adopterGate(FIX, { roots: { gamma: join(REPOS, 'gamma') } })
  assert.ok(codes(r).includes('E_ADOPTER_PIN_STYLE_DRIFT'), JSON.stringify(r.refusals))
})

test('a clean family passes and counts both adopters as verified', () => {
  const r = adopterGate(CLEAN, { roots: { alpha: join(CLEAN_REPOS, 'alpha'), beta: join(CLEAN_REPOS, 'beta') } })
  assert.equal(r.report.verified, 2)
  assert.equal(r.ok, true, JSON.stringify(r.refusals))
  assert.equal(r.report.claim, true)
})

test('the suite claim is earned at >= 2 verified adopters', () => {
  assert.equal(SUITE_CLAIM_MIN, 2)
  const one = adopterGate(CLEAN, { roots: { alpha: join(CLEAN_REPOS, 'alpha') } })
  assert.equal(one.report.verified, 1)
  assert.equal(one.report.claim, false)
  assert.match(one.lines.join('\n'), /pilot/)
  const two = adopterGate(CLEAN, { roots: { alpha: join(CLEAN_REPOS, 'alpha'), beta: join(CLEAN_REPOS, 'beta') } })
  assert.equal(two.report.claim, true)
  assert.match(two.lines.join('\n'), /claim/)
})

test('a roster with no verified adopters is a pilot, never a silent pass', () => {
  const r = adopterGate(FIX)
  assert.equal(r.report.verified, 0)
  assert.equal(r.report.claim, false)
  assert.match(r.lines.join('\n'), /pilot/)
})

test('a wrong exact version refuses with the version-drift code', () => {
  // alpha pins 0.9.0; serve 1.0.0 and the pin is stale.
  const r = adopterGate(FIX, { roots: { alpha: join(REPOS, 'alpha') }, suiteVersion: '1.0.0' })
  assert.ok(codes(r).includes('E_ADOPTER_VERSION_DRIFT'))
})

test('readAdopterPin classifies exact, range, and missing pins', () => {
  assert.equal(readAdopterPin(join(REPOS, 'alpha')).style, 'exact')
  assert.equal(readAdopterPin(join(REPOS, 'gamma')).style, 'range')
  assert.equal(readAdopterPin(join(REPOS, 'epsilon')).spec, null)
  assert.equal(readAdopterPin(null).present, false)
})

test('a commit-mode adopter pins a full sha and is verified (ask #5)', () => {
  const r = adopterGate(COMMIT, { roots: { zeta: join(COMMIT_REPOS, 'zeta') } })
  assert.equal(r.report.verified, 1)
  assert.equal(r.report.commitVerified, 1)
  assert.deepEqual(codes(r), ['E_ADOPTER_MODE_UNKNOWN'], JSON.stringify(r.refusals))
  const row = r.report.rows.find((x) => x.id === 'zeta')
  assert.equal(row.mode, 'commit')
  assert.equal(row.sha, 'a9b0e717f3fcd1e4ce1053d65777775cac88b987')
  assert.match(r.lines.join('\n'), /commit 1 pin a full git sha/)
})

test('a commit-mode adopter reads a custom pin file', () => {
  const r = adopterGate(COMMIT, { roots: { eta: join(COMMIT_REPOS, 'eta') } })
  const row = r.report.rows.find((x) => x.id === 'eta')
  assert.equal(row.spec, 'custom.lock')
  assert.equal(row.sha, '0123456789abcdef0123456789abcdef01234567')
})

test('a commit-mode adopter with no full sha refuses E_ADOPTER_SHA_INVALID', () => {
  const r = adopterGate(COMMIT, { roots: { kappa: join(COMMIT_REPOS, 'kappa') } })
  assert.ok(codes(r).includes('E_ADOPTER_SHA_INVALID'), JSON.stringify(r.refusals))
  assert.equal(r.report.rows.find((x) => x.id === 'kappa').sha, null)
})

test('an adopter with an unknown mode refuses E_ADOPTER_MODE_UNKNOWN', () => {
  const r = adopterGate(COMMIT, { roots: { lambda: join(COMMIT_REPOS, 'lambda') } })
  assert.ok(codes(r).includes('E_ADOPTER_MODE_UNKNOWN'), JSON.stringify(r.refusals))
})

test('readCommitPin reads a sha best-effort, never guessing', () => {
  assert.equal(readCommitPin(join(COMMIT_REPOS, 'zeta'), 'govstruct.lock').sha, 'a9b0e717f3fcd1e4ce1053d65777775cac88b987')
  assert.equal(readCommitPin(join(COMMIT_REPOS, 'kappa'), 'govstruct.lock').sha, null)
  assert.equal(readCommitPin(join(COMMIT_REPOS, 'zeta'), 'absent.lock').present, false)
  assert.equal(readCommitPin(null, 'govstruct.lock').present, false)
})
