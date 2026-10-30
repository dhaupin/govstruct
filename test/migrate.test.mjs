// test/migrate.test.mjs - the migration ritual (section 8, G6).
//
// A migration is a named, resumable change. A step naming an unknown member
// refuses; --dry-run writes nothing.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { migrateStatus, migrateDryRun } from '../src/migrate.mjs'
import { init } from '../src/init.mjs'
test('no migrations is a green status', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-mig-'))
  try {
    init(dir)
    assert.equal(migrateStatus(dir).ok, true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
test('a step naming an unknown member refuses', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-mig-'))
  try {
    init(dir)
    mkdirSync(join(dir, 'migrations'))
    writeFileSync(join(dir, 'migrations', '0001-demo.json'), JSON.stringify({
      id: '0001-demo', from: '1', to: '2', summary: 'demo',
      steps: [{ member: 'ghost', action: 'rename', status: 'pending' }],
    }))
    assert.equal(migrateStatus(dir).ok, false)
    assert.equal(migrateDryRun(dir).ok, false)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
