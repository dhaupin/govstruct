// test/verdict.test.mjs - the verdict bus (G4).
//
// A receipt is the ledger pattern one level up: append-only, chained, and
// verifiable offline. It is portable only if its refusal codes are in the
// shared vocabulary (G10). The roll-up reads fresh receipts and polls the
// rest, so "the suite is green right now" is a fact, not a cache age.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { init } from '../src/init.mjs'
import {
  emitReceipt, verifyReceipts, verdictRollup, validateReceipt,
  latestByMember, isGreen, RECEIPT_PATH,
} from '../src/verdict.mjs'

function freshFamily() {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-verdict-'))
  init(dir)
  return dir
}

// init scaffolds a member; read its id so a receipt names a real one.
function memberId(dir) {
  const manifest = JSON.parse(readFileSync(join(dir, 'members', 'hello.json'), 'utf8'))
  return manifest.id
}

function receipt(member, over = {}) {
  return {
    member,
    rev: 'abc1234',
    verdicts: [{ name: 'lint', verdict: 'REFUSED' }],
    refusals: [],
    ...over,
  }
}

test('a valid receipt appends and the chain verifies', () => {
  const dir = freshFamily()
  try {
    const id = memberId(dir)
    const r = emitReceipt(dir, receipt(id))
    assert.equal(r.ok, true, JSON.stringify(r.refusals))
    assert.equal(r.entry.member, id)
    assert.equal(r.entry.seq, 1)
    assert.equal(verifyReceipts(dir).ok, true)
    assert.ok(existsSync(join(dir, RECEIPT_PATH)))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('receipts chain: seq is monotonic and prev links', () => {
  const dir = freshFamily()
  try {
    const id = memberId(dir)
    emitReceipt(dir, receipt(id, { rev: 'r1' }))
    emitReceipt(dir, receipt(id, { rev: 'r2' }))
    const log = verifyReceipts(dir)
    assert.equal(log.checked, 2)
    assert.equal(log.ok, true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a receipt naming an unknown member refuses E_RECEIPT_UNKNOWN_MEMBER', () => {
  const dir = freshFamily()
  try {
    const r = emitReceipt(dir, receipt('ghost'))
    assert.equal(r.ok, false)
    assert.equal(r.refusals[0].code, 'E_RECEIPT_UNKNOWN_MEMBER')
    assert.equal(verifyReceipts(dir).checked, 0, 'a refusal writes nothing')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a receipt with an unregistered refusal code is not portable', () => {
  const dir = freshFamily()
  try {
    const id = memberId(dir)
    const r = emitReceipt(dir, receipt(id, { refusals: ['E_MADE_UP'] }))
    assert.equal(r.ok, false)
    assert.equal(r.refusals[0].code, 'E_RECEIPT_INVALID')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a receipt with a registered namespaced code is portable', () => {
  const dir = freshFamily()
  try {
    const id = memberId(dir)
    const r = emitReceipt(dir, receipt(id, { refusals: ['crashtest/REFUSED', 'E_LEDGER_TAMPER'] }))
    assert.equal(r.ok, true, JSON.stringify(r.refusals))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a malformed receipt refuses E_RECEIPT_INVALID', () => {
  assert.equal(validateReceipt(null).ok, false)
  assert.equal(validateReceipt({ member: 'x' }).items[0].code, 'E_RECEIPT_INVALID')
  assert.equal(validateReceipt({ member: 'x', rev: 'r', verdicts: [{ name: 'lint' }] }).ok, false)
})

test('a tampered receipt breaks the chain', () => {
  const dir = freshFamily()
  try {
    const id = memberId(dir)
    emitReceipt(dir, receipt(id))
    const p = join(dir, RECEIPT_PATH)
    const line = JSON.parse(readFileSync(p, 'utf8').trim())
    line.verdicts[0].verdict = 'EXPLOITED' // rewrite history
    writeFileSync(p, JSON.stringify(line) + '\n')
    const v = verifyReceipts(dir)
    assert.equal(v.ok, false)
    assert.ok(v.refusals.some((x) => x.startsWith('E_RECEIPT_TAMPER')))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('isGreen holds only when every row is in the pass vocabulary', () => {
  assert.equal(isGreen({ verdicts: [{ verdict: 'REFUSED' }, { verdict: 'BOUNDED' }] }), true)
  assert.equal(isGreen({ verdicts: [{ verdict: 'EXPLOITED' }] }), false)
  assert.equal(isGreen({ verdicts: [] }), true)
  assert.equal(isGreen({}), false)
})

test('latestByMember keeps the highest seq per member', () => {
  const log = [
    { seq: 1, member: 'a', addr: 'x' },
    { seq: 2, member: 'a', addr: 'y' },
    { seq: 3, member: 'b', addr: 'z' },
  ]
  const latest = latestByMember(log)
  assert.equal(latest.get('a').seq, 2)
  assert.equal(latest.get('b').seq, 3)
})

test('rollup reads a fresh receipt and polls the rest', () => {
  const dir = freshFamily()
  try {
    const id = memberId(dir)
    emitReceipt(dir, receipt(id, { verdicts: [{ name: 'lint', verdict: 'REFUSED' }] }))
    const r = verdictRollup(dir, { now: Date.now() })
    const m = r.members.find((x) => x.id === id)
    assert.equal(m.source, 'receipt')
    assert.equal(m.verdict, 'GREEN')
    assert.equal(r.fresh, 1)
    assert.equal(r.polled, 0)
    assert.equal(r.ok, true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a stale receipt falls back to polling', () => {
  const dir = freshFamily()
  try {
    const id = memberId(dir)
    emitReceipt(dir, receipt(id), { at: '2020-01-01T00:00:00.000Z' })
    const r = verdictRollup(dir, { now: Date.parse('2026-10-29T00:00:00.000Z') })
    const m = r.members.find((x) => x.id === id)
    assert.equal(m.source, 'polled')
    assert.equal(r.fresh, 0)
    assert.equal(r.polled, 1)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a red receipt makes the rollup not ok', () => {
  const dir = freshFamily()
  try {
    const id = memberId(dir)
    emitReceipt(dir, receipt(id, { verdicts: [{ name: 'lint', verdict: 'EXPLOITED' }] }))
    const r = verdictRollup(dir, { now: Date.now() })
    assert.equal(r.ok, false)
    assert.equal(r.red, 1)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
