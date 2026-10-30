// test/grants.test.mjs - credential delegation (G5).
//
// A member's grants[] lists the credential kinds and scopes its stamps may
// spend. Scope matching is exact-or-wildcard ("*" covers any scope of that
// kind). A spend absent from the list is refused by name - a stamp cannot
// widen a wall.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { coversGrant, checkSpends } from '../src/grants.mjs'

test('coversGrant is exact-or-wildcard and names the miss', () => {
  const member = { id: 'm', grants: [{ kind: 'github', scope: 'repo:a/b' }] }
  assert.equal(coversGrant(member, { kind: 'github', scope: 'repo:a/b' }).ok, true)
  assert.equal(coversGrant(member, { kind: 'github', scope: 'repo:a/c' }).ok, false)
  assert.equal(coversGrant(member, { kind: 'npm', scope: '*' }).ok, false)
  const miss = coversGrant(member, { kind: 'npm', scope: 'pkg:x' })
  assert.equal(miss.refusal.code, 'E_GRANT_UNLISTED')
  assert.equal(miss.refusal.context.kind, 'npm')
})

test('a wildcard grant scope covers any scope of its kind', () => {
  const member = { id: 'm', grants: [{ kind: 'npm', scope: '*' }] }
  assert.equal(coversGrant(member, { kind: 'npm', scope: 'pkg:anything' }).ok, true)
})

test('a member with no grants may spend nothing', () => {
  assert.equal(coversGrant({ id: 'm' }, { kind: 'github', scope: 'repo:a/b' }).ok, false)
})

test('a spend with an empty scope or kind is E_STAMP_INVALID', () => {
  const r = coversGrant({ id: 'm', grants: [] }, { kind: 'npm', scope: '' })
  assert.equal(r.ok, false)
  assert.equal(r.refusal.code, 'E_STAMP_INVALID')
  assert.equal(coversGrant({ id: 'm', grants: [] }, { kind: '', scope: 'x' }).refusal.code, 'E_STAMP_INVALID')
})

test('checkSpends reports one refusal per unlisted spend', () => {
  const member = { id: 'm', grants: [{ kind: 'npm', scope: 'pkg:a' }] }
  const refusals = checkSpends(member, [
    { kind: 'npm', scope: 'pkg:a' },
    { kind: 'npm', scope: 'pkg:b' },
    { kind: 'github', scope: 'repo:a/b' },
  ])
  assert.equal(refusals.length, 2)
  assert.ok(refusals.every((r) => r.code === 'E_GRANT_UNLISTED'))
})
