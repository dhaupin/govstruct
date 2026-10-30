// test/cli.test.mjs - the CLI exit contract (the same ladder packstruct uses).
//
// 0 all honored, 1 any refusal, 2 usage error.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { init } from '../src/init.mjs'
const HERE = dirname(fileURLToPath(import.meta.url))
const CLI = join(HERE, '..', 'bin', 'cli.mjs')
const ROOT = join(HERE, '..')
function run(args, cwd = ROOT) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' })
}
test('lint exits 0 on the reference roster', () => {
  assert.equal(run(['lint']).status, 0)
})
test('lint --json emits a schema-1 report', () => {
  const r = run(['lint', '--json'])
  const parsed = JSON.parse(r.stdout)
  assert.equal(parsed.schema, 1)
  assert.equal(parsed.ok, true)
  assert.equal(parsed.memberCount, 23)
})
test('an unknown verb exits 2', () => {
  assert.equal(run(['frobnicate']).status, 2)
})
test('an unknown flag exits 2', () => {
  assert.equal(run(['lint', '--jso']).status, 2)
})
test('doctor --suite exits 0 on the reference roster', () => {
  assert.equal(run(['doctor', '--suite']).status, 0)
})
test('render registry prints JSON', () => {
  const r = run(['render', 'registry'])
  assert.equal(r.status, 0)
  assert.equal(JSON.parse(r.stdout).memberCount, 23)
})
test('lint honors a positional target: the clean fixture lints green', () => {
  assert.equal(run(['lint', 'test/fixtures/clean']).status, 0)
})
test('lint honors a positional target: a broken fixture refuses', () => {
  const r = run(['lint', 'test/fixtures/broken/id-mismatch'])
  assert.equal(r.status, 1)
  assert.match(r.stdout, /E_ID_MISMATCH/)
})
test('doctor honors a positional target', () => {
  assert.equal(run(['doctor', 'test/fixtures/clean']).status, 0)
})
test('check honors a positional target', () => {
  assert.equal(run(['check', 'test/fixtures/clean']).status, 0)
})
test('stamp with no record file exits 2 (usage)', () => {
  assert.equal(run(['stamp']).status, 2)
})
test('stamp on a non-JSON record refuses E_STAMP_INVALID', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-cli-stamp-'))
  try {
    init(dir)
    writeFileSync(join(dir, 'bad.json'), '{ not json')
    const r = spawnSync(process.execPath, [CLI, 'stamp', 'bad.json'], { cwd: dir, encoding: 'utf8' })
    assert.equal(r.status, 1)
    assert.match(r.stderr, /E_STAMP_INVALID/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('retire needs a member id (usage)', () => {
  assert.equal(run(['retire']).status, 2)
})

test('retire tombstones a member and the family still lints', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-cli-retire-'))
  try {
    init(dir)
    const r = spawnSync(process.execPath, [CLI, 'retire', 'hello', '--json'], { cwd: dir, encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    const out = JSON.parse(r.stdout)
    assert.equal(out.ok, true)
    assert.equal(spawnSync(process.execPath, [CLI, 'lint'], { cwd: dir, encoding: 'utf8' }).status, 0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('retire of an unknown member refuses', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-cli-retire2-'))
  try {
    init(dir)
    const r = spawnSync(process.execPath, [CLI, 'retire', 'ghost', '--json'], { cwd: dir, encoding: 'utf8' })
    assert.equal(r.status, 1)
    assert.equal(JSON.parse(r.stdout).refusals[0].code, 'E_RETIRE_UNKNOWN_MEMBER')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('verdict needs a subcommand (usage)', () => {
  assert.equal(run(['verdict']).status, 2)
})

test('verdict emit -> verify -> rollup round-trips green', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-cli-verdict-'))
  try {
    init(dir)
    writeFileSync(join(dir, 'r.json'), JSON.stringify({
      member: 'hello', rev: 'abc1234', verdicts: [{ name: 'lint', verdict: 'REFUSED' }],
    }))
    const emit = spawnSync(process.execPath, [CLI, 'verdict', 'emit', 'r.json'], { cwd: dir, encoding: 'utf8' })
    assert.equal(emit.status, 0, emit.stderr)
    assert.equal(spawnSync(process.execPath, [CLI, 'verdict', 'verify'], { cwd: dir, encoding: 'utf8' }).status, 0)
    const roll = spawnSync(process.execPath, [CLI, 'verdict', 'rollup'], { cwd: dir, encoding: 'utf8' })
    assert.equal(roll.status, 0, roll.stderr)
    assert.match(roll.stdout, /1 fresh receipt/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('verdict emit of an unknown member refuses', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-cli-verdict2-'))
  try {
    init(dir)
    writeFileSync(join(dir, 'r.json'), JSON.stringify({
      member: 'ghost', rev: 'x', verdicts: [{ name: 'lint', verdict: 'REFUSED' }],
    }))
    const r = spawnSync(process.execPath, [CLI, 'verdict', 'emit', 'r.json'], { cwd: dir, encoding: 'utf8' })
    assert.equal(r.status, 1)
    assert.match(r.stdout, /E_RECEIPT_UNKNOWN_MEMBER/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
