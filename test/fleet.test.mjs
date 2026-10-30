// test/fleet.test.mjs - the fleet drift meter (PRD section 16.10, G13).
//
// The golden case: an ongoing fleet job, not a one-time event. The meter
// reads each member's live surfaces (floor, lockfile, version, pin style)
// against the truth the manifest declares, and names every drift.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { fleetMeter, readRepoFacts } from '../src/fleet.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const FLEET = join(HERE, 'fixtures', 'fleet')
const REPOS = join(FLEET, 'repos')

const codes = (r) => r.refusals.map((x) => x.code)

test('the meter is deterministic and offline', () => {
  const a = fleetMeter(FLEET)
  const b = fleetMeter(FLEET)
  assert.deepEqual(a.lines, b.lines)
  assert.equal(a.report.unchecked, 2, 'no root provided -> both unchecked')
})

test('a member with no checkout is unchecked, never a silent pass', () => {
  const r = fleetMeter(FLEET)
  assert.equal(r.report.read, 0)
  assert.match(r.lines.join('\n'), /no local checkout to read/)
})

test('readRepoFacts reads floor, lockfile, version, and workflow count', () => {
  const facts = readRepoFacts(join(REPOS, 'alpha'))
  assert.equal(facts.present, true)
  assert.equal(facts.engines, '>=20')
  assert.equal(facts.hasLockfile, true)
  assert.equal(facts.version, '1.0.0')
  assert.equal(facts.workflows, 0)
})

test('a clean member passes; a drifted member names every drift', () => {
  const r = fleetMeter(FLEET, { roots: { alpha: join(REPOS, 'alpha'), beta: join(REPOS, 'beta') } })
  assert.equal(r.report.read, 2)
  assert.equal(r.ok, false)
  assert.deepEqual(codes(r).sort(), [
    'E_FLEET_FLOOR_DRIFT',
    'E_FLEET_LOCK_MISSING',
    'E_FLEET_PIN_STYLE_DRIFT',
    'E_FLEET_VERSION_DRIFT',
  ])
  // alpha contributed no drift.
  assert.ok(!r.report.drifts.some((d) => d.startsWith('alpha')))
})

test('floor comparison ignores trailing zero components (>=20 == >=20.0.0)', () => {
  const r = fleetMeter(FLEET, { roots: { alpha: join(REPOS, 'alpha') } })
  assert.ok(!codes(r).includes('E_FLEET_FLOOR_DRIFT'))
})

test('impact: readRepoFacts on a missing root is present:false', () => {
  assert.equal(readRepoFacts('/no/such/dir').present, false)
  assert.equal(readRepoFacts(null).present, false)
})
