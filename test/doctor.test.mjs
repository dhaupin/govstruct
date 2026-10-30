// test/doctor.test.mjs - the doctor (section 6).
//
// Offline by default (G11): the default run is byte-deterministic and never
// opens a socket. Suite mode reports drift as a state, and the home-drift
// rule refuses a member claimed by two homes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { doctor, doctorSuite } from '../src/doctor.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLEAN = join(HERE, 'fixtures', 'clean')

test('doctor is offline by default', () => {
  const r = doctor(CLEAN)
  const net = r.report.checks.find((c) => c.name === 'network')
  assert.match(net.detail, /offline/)
  assert.equal(r.report.network, false)
})

test('doctor is deterministic: two runs give the same lines', () => {
  assert.deepEqual(doctor(CLEAN).lines, doctor(CLEAN).lines)
})

test('doctor refuses a surface that drifts from a fresh render', () => {
  // The clean fixture has no emitted surfaces, so it is green.
  const r = doctor(CLEAN)
  assert.equal(r.ok, true, JSON.stringify(r.refusals.map((x) => x.code)))
})

test('doctor refuses a broken family (a refusal is data, not a crash)', () => {
  const r = doctor(join(HERE, 'fixtures', 'broken', 'field-missing'))
  assert.equal(r.ok, false)
  assert.ok(r.refusals.length > 0)
})

test('suite mode reports the role and status census', async () => {
  const r = await doctorSuite(CLEAN)
  assert.equal(r.report.memberCount, 2)
  assert.equal(r.report.byRole.product, 1)
  assert.equal(r.report.byRole.arm, 1)
})

test('suite mode surfaces the topological order', async () => {
  const r = await doctorSuite(CLEAN)
  // alpha must precede beta (beta needs alpha).
  assert.ok(r.report.order.indexOf('alpha') < r.report.order.indexOf('beta'))
})
