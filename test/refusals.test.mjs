// test/refusals.test.mjs - the shared refusal vocabulary (G10).
//
// Two-way: every code the registry declares is recognized, and an
// unregistered code cannot be emitted (it becomes E_REFUSAL_UNREGISTERED).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadRegistry, isRegistered, meaningOf, Refusal, RefusalBag } from '../src/refusals.mjs'

test('registry declares schemaVersion 1 and namespaces', () => {
  const reg = loadRegistry()
  assert.equal(reg.schemaVersion, 1)
  assert.ok(reg.namespaces.govstruct)
  assert.ok(Object.keys(reg.namespaces.govstruct).length > 10)
})

test('every govstruct code is registered and has a meaning', () => {
  const reg = loadRegistry()
  for (const code of Object.keys(reg.namespaces.govstruct)) {
    assert.equal(isRegistered(code), true, `${code} should be registered`)
    assert.equal(typeof meaningOf(code), 'string')
  }
})

test('a namespaced code resolves against its namespace', () => {
  assert.equal(isRegistered('packstruct/entry'), true)
  assert.equal(isRegistered('packstruct/nope'), false)
  assert.equal(isRegistered('nope/E_X'), false)
})

test('an unregistered code is refused as E_REFUSAL_UNREGISTERED', () => {
  const r = new Refusal('E_MADE_UP', 'this code does not exist')
  assert.equal(r.code, 'E_REFUSAL_UNREGISTERED')
  assert.equal(r.context.attempted, 'E_MADE_UP')
})

test('a registered code keeps its code', () => {
  const r = new Refusal('E_ID_DUPLICATE', 'two members share an id')
  assert.equal(r.code, 'E_ID_DUPLICATE')
})

test('a RefusalBag reports ok and sorts deterministically', () => {
  const bag = new RefusalBag()
  assert.equal(bag.ok, true)
  bag.add('E_URL_FORMAT', 'b').add('E_ID_DUPLICATE', 'a')
  assert.equal(bag.ok, false)
  assert.equal(bag.length, 2)
  const sorted = bag.sorted()
  assert.equal(sorted[0].code, 'E_ID_DUPLICATE')
  assert.equal(sorted[1].code, 'E_URL_FORMAT')
})
