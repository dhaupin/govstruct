// test/stamp.test.mjs - the write path (G1) and credential grants (G5).
//
// A stamp is a reviewable, refusable claim: it validates like a hand-authored
// block, refuses to overwrite an existing member, and refuses to spend a
// credential the member's grants[] does not list. The ledger row makes the
// mint auditable offline.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { init } from '../src/init.mjs'
import { stamp, validateStamp } from '../src/stamp.mjs'
import { loadConfig } from '../src/config.mjs'
import { auditVerify } from '../src/audit.mjs'
import { lint } from '../src/lint.mjs'

function freshFamily() {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-stamp-'))
  init(dir)
  return dir
}

function record(over = {}) {
  return {
    member: {
      id: 'widget',
      name: 'Widget',
      role: 'product',
      url: 'https://widget.example.com',
      repo: null,
      npm: null,
      aliases: [],
      home: null,
      blurb: 'A stamped member.',
      icon: 'widget',
      order: 2,
      status: 'In Development',
      section: 'open-source',
      needs: [],
      grants: [{ kind: 'github', scope: 'repo:acme/widget' }],
      ...over.member,
    },
    spends: over.spends ?? [{ kind: 'github', scope: 'repo:acme/widget' }],
  }
}

test('a valid stamp writes the member and a ledger row', () => {
  const dir = freshFamily()
  try {
    const r = stamp(dir, record())
    assert.equal(r.ok, true, JSON.stringify(r.refusals))
    assert.ok(existsSync(join(dir, 'members', 'widget.json')))
    assert.equal(r.entry.verb, 'stamp')
    assert.equal(auditVerify(dir).ok, true)
    assert.equal(lint(dir).ok, true)
    assert.equal(lint(dir).memberCount, 2)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a stamp never overwrites an existing member file', () => {
  const dir = freshFamily()
  try {
    assert.equal(stamp(dir, record()).ok, true)
    const again = stamp(dir, record())
    assert.equal(again.ok, false)
    const codes = again.refusals.map((x) => x.code)
    assert.ok(codes.includes('E_STAMP_DUPLICATE'), codes.join(','))
    assert.ok(codes.includes('E_STAMP_TARGET_EXISTS'), codes.join(','))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a stamp spending an unlisted credential refuses E_GRANT_UNLISTED', () => {
  const dir = freshFamily()
  try {
    const r = stamp(dir, record({ spends: [{ kind: 'npm', scope: 'pkg:widget' }] }))
    assert.equal(r.ok, false)
    assert.equal(r.refusals[0].code, 'E_GRANT_UNLISTED')
    assert.ok(!existsSync(join(dir, 'members', 'widget.json')), 'no file on refusal')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a wildcard grant scope covers any scope of its kind', () => {
  const dir = freshFamily()
  try {
    const r = stamp(dir, record({
      member: { grants: [{ kind: 'npm', scope: '*' }] },
      spends: [{ kind: 'npm', scope: 'pkg:anything' }],
    }))
    assert.equal(r.ok, true, JSON.stringify(r.refusals))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a stamp carrying an invalid block refuses the grammar code', () => {
  const dir = freshFamily()
  try {
    const r = stamp(dir, record({ member: { id: 'Bad_Id' } }))
    assert.equal(r.ok, false)
    const codes = r.refusals.map((x) => x.code)
    assert.ok(codes.includes('E_ID_FORMAT'), codes.join(','))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('dry-run validates but writes nothing', () => {
  const dir = freshFamily()
  try {
    const r = stamp(dir, record(), { dryRun: true })
    assert.equal(r.ok, true)
    assert.equal(r.wrote, null)
    assert.ok(!existsSync(join(dir, 'members', 'widget.json')))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('validateStamp folds the config load in', () => {
  const dir = freshFamily()
  try {
    const { config } = loadConfig(dir)
    const v = validateStamp(dir, record(), config)
    assert.equal(v.ok, true)
    assert.equal(v.block.id, 'widget')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
