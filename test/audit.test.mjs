// test/audit.test.mjs - the audit ledger (section 19, G14).
//
// The chain is tamper-evident: a rewritten body breaks the address, a
// removed entry breaks the prev link, a gap breaks seq. All three refuse,
// offline, with no operator trust.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { appendEntry, auditVerify, readLedger, entryAddress, LEDGER_PATH } from '../src/audit.mjs'

function scratch() {
  return mkdtempSync(join(tmpdir(), 'govstruct-audit-'))
}

test('an empty ledger verifies green', () => {
  const root = scratch()
  try {
    assert.equal(auditVerify(root).ok, true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('appended entries form a verifiable chain', () => {
  const root = scratch()
  try {
    appendEntry(root, { verb: 'stamp', subject: { member: 'alpha' } })
    appendEntry(root, { verb: 'rename', subject: { member: 'beta' } })
    const r = auditVerify(root)
    assert.equal(r.ok, true, JSON.stringify(r.refusals))
    assert.equal(r.checked, 2)
    const ledger = readLedger(root)
    assert.equal(ledger[0].prev, null)
    assert.equal(ledger[1].prev, ledger[0].addr)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a tampered body breaks the address (E_LEDGER_TAMPER)', () => {
  const root = scratch()
  try {
    appendEntry(root, { verb: 'stamp' })
    appendEntry(root, { verb: 'rename' })
    const p = join(root, LEDGER_PATH)
    const lines = readFileSync(p, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
    lines[0].verdict = 'FAIL' // rewrite history without re-addressing
    writeFileSync(p, lines.map((l) => JSON.stringify(l)).join('\n') + '\n')
    const r = auditVerify(root)
    assert.equal(r.ok, false)
    assert.ok(r.refusals.some((x) => x.startsWith('E_LEDGER_TAMPER')))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a removed entry breaks the chain (E_LEDGER_SEQ_GAP)', () => {
  const root = scratch()
  try {
    appendEntry(root, { verb: 'a' })
    appendEntry(root, { verb: 'b' })
    appendEntry(root, { verb: 'c' })
    const p = join(root, LEDGER_PATH)
    const lines = readFileSync(p, 'utf8').trim().split('\n')
    writeFileSync(p, [lines[0], lines[2]].join('\n') + '\n') // drop seq 2
    const r = auditVerify(root)
    assert.equal(r.ok, false)
    assert.ok(r.refusals.some((x) => x.startsWith('E_LEDGER_SEQ_GAP') || x.startsWith('E_LEDGER_BROKEN')))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('entryAddress is a pure function of the body', () => {
  const body = { seq: 1, prev: null, verb: 'x' }
  assert.equal(entryAddress(body), entryAddress({ ...body }))
})

test('a NESTED field rewrite breaks the address (deep canonicalization)', () => {
  const root = scratch()
  try {
    appendEntry(root, {
      verb: 'stamp',
      subject: { member: 'alpha' },
      actor: { kind: 'ci', id: 'govstruct' },
      evidence: [{ code: 'E_GRANT_UNLISTED' }],
    })
    const p = join(root, LEDGER_PATH)
    const lines = readFileSync(p, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
    // Rewrite a nested field only - a shallow key-sort would not cover it.
    lines[0].actor.id = 'attacker'
    lines[0].evidence[0].code = 'E_FORGED'
    writeFileSync(p, lines.map((l) => JSON.stringify(l)).join('\n') + '\n')
    const r = auditVerify(root)
    assert.equal(r.ok, false, 'nested tampering must break the address')
    assert.ok(r.refusals.some((x) => x.startsWith('E_LEDGER_TAMPER')))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('entryAddress covers nested fields, not just top-level keys', () => {
  const a = { verdicts: [{ name: 'lint', verdict: 'REFUSED' }] }
  const b = { verdicts: [{ name: 'lint', verdict: 'EXPLOITED' }] }
  assert.notEqual(entryAddress(a), entryAddress(b))
})
