// test/lock.test.mjs - the lock verb (section 6).
//
// A lock emits a receipt over the manifest checksum; the archive is a git
// archive when this is a work tree.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { lock, sha256File } from '../src/lock.mjs'
import { init } from '../src/init.mjs'
test('lock writes a receipt carrying the manifest checksum', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-lock-'))
  try {
    init(dir)
    const r = lock(dir)
    assert.equal(r.ok, true)
    assert.match(r.receipt.manifest, /^sha256:[0-9a-f]{64}$/)
    assert.equal(r.receipt.tool, 'govstruct')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
test('sha256File is stable', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-lock-'))
  try {
    mkdirSync(join(dir, 'x'))
    const p = join(dir, 'x', 'f.txt')
    writeFileSync(p, 'hello')
    assert.equal(sha256File(p), sha256File(p))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
