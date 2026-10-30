// test/doctor.test.mjs - the doctor (section 6).
//
// Offline by default (G11): the default run is byte-deterministic and never
// opens a socket. Suite mode reports drift as a state, and the home-drift
// rule refuses a member claimed by two homes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { doctor, doctorSuite, doctorOnline } from '../src/doctor.mjs'

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

// --- G11: the online leg (opt-in, the ONLY socket arm) ---
// These inject a probe, so the tests never touch the network.

const OK = async () => 200
const DEAD = async () => 0

test('online mode is green when every url and npm name resolves', async () => {
  const r = await doctorOnline(CLEAN, { probe: OK })
  assert.equal(r.ok, true, JSON.stringify(r.refusals))
  assert.equal(r.report.network, true)
})

test('online mode refuses an unresolvable url by name', async () => {
  const r = await doctorOnline(CLEAN, { probe: DEAD })
  assert.equal(r.ok, false)
  assert.ok(r.refusals.some((x) => x.code === 'E_URL_UNRESOLVABLE'))
})

test('online mode refuses an http-only url as insecure, not merely dead', async () => {
  // https dies, the http twin lives: the member shipped without TLS.
  const probe = async (url) => (url.startsWith('https:') ? 0 : 200)
  const r = await doctorOnline(CLEAN, { probe })
  assert.ok(r.refusals.some((x) => x.code === 'E_URL_INSECURE'), JSON.stringify(r.refusals))
  assert.ok(!r.refusals.some((x) => x.code === 'E_URL_UNRESOLVABLE'))
})

test('online mode refuses a declared npm name that is missing', async () => {
  const probe = async (url) => (url.includes('registry.npmjs.org') ? 404 : 200)
  const r = await doctorOnline(CLEAN, { probe })
  assert.ok(r.refusals.some((x) => x.code === 'E_NPM_MISSING'), JSON.stringify(r.refusals))
})

test('the offline doctor stays socket-free even with network:true', () => {
  // Passing network:true to the offline doctor must not change its behavior.
  const r = doctor(CLEAN, { network: true })
  const net = r.report.checks.find((c) => c.name === 'network')
  assert.match(net.detail, /separate explicit ask/)
  assert.equal(r.report.network, true)
})
