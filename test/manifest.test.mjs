// test/manifest.test.mjs - the manifest grammar, two ways.
//
// The clean fixture passes; each broken fixture refuses with its ONE
// expected code. This is the two-way pattern packstruct uses: a rule that
// never fails proves nothing.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { lint } from '../src/lint.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLEAN = join(HERE, 'fixtures', 'clean')
const BROKEN = join(HERE, 'fixtures', 'broken')

test('the clean fixture family lints green', () => {
  const r = lint(CLEAN)
  assert.equal(r.ok, true, JSON.stringify(r.refusals.map((x) => [x.code, x.message])))
  assert.equal(r.memberCount, 2)
})

// Each broken fixture must refuse with the named code.
const CASES = [
  ['id-mismatch', 'E_ID_MISMATCH'],
  ['id-duplicate', 'E_ID_DUPLICATE'],
  ['url-not-https', 'E_URL_FORMAT'],
  ['url-duplicate', 'E_URL_DUPLICATE'],
  ['order-collision', 'E_ORDER_COLLISION'],
  ['role-unknown', 'E_ROLE_UNKNOWN'],
  ['status-unknown', 'E_STATUS_UNKNOWN'],
  ['section-unknown', 'E_SECTION_UNKNOWN'],
  ['needs-cycle', 'E_NEEDS_CYCLE'],
  ['needs-self', 'E_NEEDS_SELF'],
  ['needs-unknown', 'E_NEEDS_UNKNOWN'],
  ['home-unknown', 'E_HOME_UNKNOWN'],
  ['tombstone-empty', 'E_TOMBSTONE_EMPTY'],
  ['field-missing', 'E_FIELD_MISSING'],
  ['id-format', 'E_ID_FORMAT'],
  ['invalid-json', 'E_MEMBER_INVALID_JSON'],
  ['alias-duplicate', 'E_ALIAS_DUPLICATE'],
  ['alias-self', 'E_ALIAS_SELF'],
]

for (const [fixture, code] of CASES) {
  test(`fixture ${fixture} refuses with ${code}`, () => {
    const r = lint(join(BROKEN, fixture))
    assert.equal(r.ok, false, `${fixture} should not be green`)
    const codes = r.refusals.map((x) => x.code)
    assert.ok(codes.includes(code), `${fixture} expected ${code}, got ${codes.join(', ')}`)
  })
}

test('a missing config refuses E_CONFIG_MISSING', () => {
  const r = lint(join(BROKEN, 'does-not-exist'))
  assert.equal(r.ok, false)
  assert.equal(r.refusals[0].code, 'E_CONFIG_MISSING')
})
