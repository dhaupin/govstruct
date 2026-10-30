// test/lint.test.mjs - the lint verb's report shape.
//
// lint is the entry point; formatRefusals renders its refusals one line per
// code, the shape the CLI prints.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { lint, formatRefusals } from '../src/lint.mjs'
const HERE = dirname(fileURLToPath(import.meta.url))
test('formatRefusals renders one REFUSED line per code', () => {
  const r = lint(join(HERE, 'fixtures', 'broken', 'url-not-https'))
  const text = formatRefusals(r.refusals)
  assert.match(text, /REFUSED \[E_URL_FORMAT\]/)
})
test('lint reports ok and a count on a clean family', () => {
  const r = lint(join(HERE, 'fixtures', 'clean'))
  assert.equal(r.ok, true)
  assert.equal(r.memberCount, 2)
})
