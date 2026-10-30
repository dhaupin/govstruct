// test/names.test.mjs - the naming authority (section 6.2, G2).
//
// Offline checks are pure: kebab-case, the roster, and the reserved block.
// Network probes run only on request, so the default is CI-safe.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { names } from '../src/names.mjs'
const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
test('a free candidate passes offline', async () => {
  const r = await names(ROOT, 'coolforge')
  assert.equal(r.ok, true)
})
test('a live member id is taken', async () => {
  const r = await names(ROOT, 'vant')
  assert.equal(r.ok, false)
})
test('a reserved name is taken', async () => {
  const r = await names(ROOT, 'navstruct')
  assert.equal(r.ok, false)
})
test('a non-kebab id fails the format check', async () => {
  const r = await names(ROOT, 'Cool_Forge')
  assert.equal(r.ok, false)
})
test('network probes are skipped by default', async () => {
  const r = await names(ROOT, 'coolforge')
  const net = r.checks.find((c) => c.name === 'network')
  assert.match(net.detail, /offline/)
})
