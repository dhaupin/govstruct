// test/registry-contract.test.mjs - the surface stability contract (issue #23).
//
// docs/registry.md is the integrator's pin: it names which fields of the
// roll-up are frozen contract. This guards the doc from drifting from the
// emitted shape - every top-level and member key the roll-up carries must be
// named in the contract page, so an outside consumer reading only the page
// never meets a field the page forgot.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')

function doc() {
  return readFileSync(join(ROOT, 'docs', 'registry.md'), 'utf8')
}

test('the contract page names every top-level roll-up field', () => {
  const rollup = JSON.parse(readFileSync(join(ROOT, 'registry.v1.json'), 'utf8'))
  const page = doc()
  for (const key of Object.keys(rollup)) {
    assert.ok(page.includes(`\`${key}\``), `docs/registry.md names the frozen field \`${key}\``)
  }
})

test('the contract page names every member projection field', () => {
  const rollup = JSON.parse(readFileSync(join(ROOT, 'registry.v1.json'), 'utf8'))
  const page = doc()
  const memberKeys = new Set()
  for (const m of rollup.members) for (const k of Object.keys(m)) memberKeys.add(k)
  for (const key of memberKeys) {
    assert.ok(page.includes(`\`${key}\``), `docs/registry.md names the member field \`${key}\``)
  }
})

test('the contract page states the versioned address and its proof', () => {
  const page = doc()
  assert.ok(page.includes('registry.v<schemaVersion>.json'), 'names the versioned path')
  assert.ok(page.includes('E_ADDRESS_VERSION_UNKNOWN'), 'names the version refusal')
  assert.ok(page.includes('checksum'), 'names the checksum proof')
})
