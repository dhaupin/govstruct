// test/lifecycle.test.mjs - lifecycle and revocation (G7).
//
// A member is born, changed, and retired. Retirement is a governed write:
// it appends the Tombstoned transition to history[], keeps the forwarding
// alias so old links resolve (never a 404), and logs one ledger row. The
// ladder is forward-only and status must agree with the last transition.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { init } from '../src/init.mjs'
import { retire, validateRetire } from '../src/lifecycle.mjs'
import { lint } from '../src/lint.mjs'
import { auditVerify } from '../src/audit.mjs'

function freshFamily() {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-life-'))
  init(dir)
  return dir
}

function memberPath(dir, id) {
  return join(dir, 'members', `${id}.json`)
}

test('retiring a member tombstones it, keeps an alias, and lints green', () => {
  const dir = freshFamily()
  try {
    const r = retire(dir, { id: 'hello', alias: 'old-hello' })
    assert.equal(r.ok, true, JSON.stringify(r.refusals))
    const block = JSON.parse(readFileSync(memberPath(dir, 'hello'), 'utf8'))
    assert.equal(block.status, 'Tombstoned')
    assert.ok(block.aliases.includes('old-hello'))
    assert.equal(block.history.at(-1).status, 'Tombstoned')
    // The retired member still lints green: it resolves, never a 404.
    assert.equal(lint(dir).ok, true, JSON.stringify(lint(dir).refusals.map((x) => x.code)))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('retirement records a ledger row', () => {
  const dir = freshFamily()
  try {
    const r = retire(dir, { id: 'hello' })
    assert.equal(r.ok, true)
    assert.ok(r.entry)
    assert.equal(r.entry.verb, 'retire')
    assert.equal(auditVerify(dir).ok, true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a retirement with no explicit alias keeps the row so the id resolves', () => {
  const dir = freshFamily()
  try {
    const r = retire(dir, { id: 'hello' })
    assert.equal(r.ok, true)
    const block = JSON.parse(readFileSync(memberPath(dir, 'hello'), 'utf8'))
    assert.equal(block.id, 'hello')
    assert.equal(block.status, 'Tombstoned')
    // The history is the receipt that it was retired; the row keeps the id.
    assert.equal(block.history.at(-1).status, 'Tombstoned')
    assert.equal(lint(dir).ok, true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('retiring an unknown member refuses E_RETIRE_UNKNOWN_MEMBER', () => {
  const dir = freshFamily()
  try {
    const r = retire(dir, { id: 'ghost' })
    assert.equal(r.ok, false)
    assert.equal(r.refusals[0].code, 'E_RETIRE_UNKNOWN_MEMBER')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('retirement is terminal: a second retire refuses E_RETIRE_ALREADY_TOMBSTONED', () => {
  const dir = freshFamily()
  try {
    assert.equal(retire(dir, { id: 'hello' }).ok, true)
    const second = retire(dir, { id: 'hello' })
    assert.equal(second.ok, false)
    assert.equal(second.refusals[0].code, 'E_RETIRE_ALREADY_TOMBSTONED')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a retirement needs an id', () => {
  const dir = freshFamily()
  try {
    const r = retire(dir, {})
    assert.equal(r.ok, false)
    assert.equal(r.refusals[0].code, 'E_RETIRE_UNKNOWN_MEMBER')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('an empty alias refuses E_RETIRE_ALIAS_REQUIRED', () => {
  const dir = freshFamily()
  try {
    const r = retire(dir, { id: 'hello', alias: '  ' })
    assert.equal(r.ok, false)
    assert.equal(r.refusals[0].code, 'E_RETIRE_ALIAS_REQUIRED')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('--dry-run writes nothing', () => {
  const dir = freshFamily()
  try {
    const before = readFileSync(memberPath(dir, 'hello'), 'utf8')
    const r = retire(dir, { id: 'hello' }, { dryRun: true })
    assert.equal(r.ok, true)
    assert.equal(r.wrote, null)
    assert.equal(readFileSync(memberPath(dir, 'hello'), 'utf8'), before)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('validateRetire reports the member block it would rewrite', () => {
  const dir = freshFamily()
  try {
    const v = validateRetire(dir, { id: 'hello' }, JSON.parse(readFileSync(join(dir, 'govstruct.config.json'), 'utf8')))
    assert.equal(v.ok, true)
    assert.equal(v.block.id, 'hello')
    assert.ok(v.target.endsWith('hello.json'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
