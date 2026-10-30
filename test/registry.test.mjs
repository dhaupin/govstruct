// test/registry.test.mjs - the suite roll-up (sections 5.1, 10).
//
// The roll-up is a rendering of the manifest plus the compliance blocks:
// floors, env, pins, and versions in one address.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { suiteRegistry } from '../src/registry.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')

test('the roll-up carries the member count and a manifest checksum', () => {
  const r = suiteRegistry(ROOT)
  assert.equal(r.memberCount, 23)
  assert.match(r.manifest, /^sha256:[0-9a-f]{64}$/)
})

test('the roll-up gathers floors from the compliance blocks', () => {
  const r = suiteRegistry(ROOT)
  const packstruct = r.floors.find((f) => f.id === 'packstruct')
  assert.ok(packstruct, 'packstruct floor row present')
  assert.equal(packstruct.consumer, '>=20')
})

test('the roll-up reports the role census', () => {
  const r = suiteRegistry(ROOT)
  assert.equal(r.byRole.arm, 5)
  assert.equal(r.byRole.forge, 2)
  assert.equal(r.byRole.composer, 1)
})
