// test/init.test.mjs - the stranger's first minute (section 16.4, G9).
//
// init scaffolds a one-member family that lints green, so the tool works
// for a stranger with no Creadev-shaped assumptions.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { init } from '../src/init.mjs'
import { lint } from '../src/lint.mjs'

test('init scaffolds a family that lints green', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-init-'))
  try {
    const r = init(dir)
    assert.equal(r.ok, true)
    assert.ok(r.files.includes('govstruct.config.json'))
    assert.ok(r.files.includes('members/hello.json'))
    const l = lint(dir)
    assert.equal(l.ok, true, JSON.stringify(l.refusals.map((x) => x.code)))
    assert.equal(l.memberCount, 1)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('init refuses to overwrite an existing config without --force', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-init-'))
  try {
    init(dir)
    assert.equal(init(dir).ok, false)
    assert.equal(init(dir, { force: true }).ok, true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
