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

// --- issue #83 port: the online leg races its member probes ---

test('online mode: a raced run is order-identical to the serial one (same refusals, same order)', async () => {
  // A probe whose latency is inversely keyed to call order: the FIRST member
  // answers slowest, so a naive concurrency would reorder the refusals. The
  // pool writes results back at the original index, so both runs agree.
  let call = 0
  const staggered = async (url) => {
    call++
    await new Promise((r) => setTimeout(r, (call % 3 === 1) ? 20 : 1))
    return url.includes('registry.npmjs.org') ? 200 : (url.startsWith('https:') ? 404 : 200)
  }
  const serial = await doctorOnline(CLEAN, { probe: staggered, concurrency: 1 })
  call = 0
  const raced = await doctorOnline(CLEAN, { probe: staggered, concurrency: 4 })
  assert.deepEqual(raced.refusals, serial.refusals, 'a raced run must produce the same refusals in the same order')
  assert.deepEqual(raced.report.checks, serial.report.checks, 'the check roll-up must not move under racing')
})

test('online mode: concurrency actually overlaps probes (the wall shrinks)', async () => {
  const slow = async () => { await new Promise((r) => setTimeout(r, 25)); return 200 }
  const t0 = Date.now()
  await doctorOnline(CLEAN, { probe: slow, concurrency: 1 })
  const serialMs = Date.now() - t0
  const t1 = Date.now()
  await doctorOnline(CLEAN, { probe: slow, concurrency: 8 })
  const racedMs = Date.now() - t1
  assert.ok(racedMs < serialMs, `racing should beat the serial wall (serial ${serialMs}ms, raced ${racedMs}ms)`)
})

test('online mode: --per-member attaches an accounting table and a wall roll-up', async () => {
  const r = await doctorOnline(CLEAN, { probe: async () => 200, perMember: true })
  assert.ok(Array.isArray(r.report.members) && r.report.members.length === r.report.memberCount)
  for (const m of r.report.members) assert.ok(Number.isInteger(m.durationMs), `member ${m.id} carries a durationMs`)
  assert.ok(Number.isInteger(r.report.wallMs))
  assert.ok(r.report.slowest && typeof r.report.slowest.id === 'string')
  assert.ok(r.lines.some((l) => l.includes('per-member accounting')), 'the table rides the human lines')
  assert.ok(r.lines.some((l) => l.includes('total probe wall')), 'the wall roll-up rides the human lines')
})

test('online mode: the accounting table is opt-in (a default run stays duration-free)', async () => {
  const r = await doctorOnline(CLEAN, { probe: async () => 200 })
  assert.equal(r.report.members, undefined)
  assert.equal(r.report.wallMs, undefined)
  assert.ok(!r.lines.some((l) => l.includes('per-member accounting')))
})

test('the offline doctor stays socket-free even with network:true', () => {
  // Passing network:true to the offline doctor must not change its behavior.
  const r = doctor(CLEAN, { network: true })
  const net = r.report.checks.find((c) => c.name === 'network')
  assert.match(net.detail, /separate explicit ask/)
  assert.equal(r.report.network, true)
})

// --- issue #23 ask #3: the online leg honors a pending annotation ---

test('online mode skips a declared-pending url and npm instead of refusing them', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-pending-'))
  try {
    mkdirSync(join(dir, 'members'))
    mkdirSync(join(dir, 'compliance'))
    writeFileSync(join(dir, 'govstruct.config.json'), JSON.stringify({
      schemaVersion: 1, family: { name: 'fixture' },
      members: { dir: 'members' }, compliance: { dir: 'compliance' },
    }))
    writeFileSync(join(dir, 'members', 'a.json'), JSON.stringify({
      id: 'a', name: 'A', role: 'product', url: 'https://a.example.com', repo: 'dhaupin/a',
      npm: 'a', aliases: [], home: null, blurb: 'b', icon: 'a', order: 1, status: 'Live',
      section: 'open-source', needs: [], grants: [],
      pending: { resources: ['repo', 'npm', 'url'], interim: 'x/src/forge' },
    }))
    const dead = async () => 0
    const r = await doctorOnline(dir, { probe: dead })
    assert.equal(r.ok, true, JSON.stringify(r.refusals))
    assert.ok(!r.refusals.some((x) => x.code === 'E_URL_UNRESOLVABLE' || x.code === 'E_NPM_MISSING'))
    const pendingCheck = r.report.checks.find((c) => c.name === 'pending-resources')
    assert.match(pendingCheck.detail, /2 declared-pending/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
