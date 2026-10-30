// test/check.test.mjs - the check-profile host (section 11).
//
// The compliance rules are packstruct check-profile packs. loadCheckPacks
// reads them, and a malformed pack refuses E_PACK_INVALID.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadCheckPacks } from '../src/check.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')

test('the repo ships eleven check packs, all loadable', async () => {
  const { packs, bag } = await loadCheckPacks(ROOT)
  assert.equal(bag.ok, true, JSON.stringify(bag.items.map((x) => x.message)))
  assert.equal(packs.length, 11)
})

test('every check pack carries a non-empty checks array', async () => {
  const { packs } = await loadCheckPacks(ROOT)
  for (const p of packs) assert.ok(p.checks.length > 0, `${p.name} has checks`)
})
