/**
 * test/release-verify.test.mjs - the release-verify leg, run OFFLINE on every
 * push (the standing receipt eyestruct carries, eyestruct@4e2b552
 * tests/release-verify.test.js). It exercises the SAME script the publish
 * lane's verify job runs on the served tarball, so the contents assertions
 * are proven every push instead of living only on release days.
 *
 * Case 1 (positive): npm pack of THIS tree -> the pack ladder -> PASS. The
 *   consumer-install half needs the registry; when offline the script prints
 *   a NAMED skip - the leg asserts "no silent skip", not "always network".
 * Case 2 (negative, fully offline): a doctored tarball carrying a file under
 *   a forbidden prefix (labs/) is refused BY NAME, before any install.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync, mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const script = join(root, 'scripts', 'verify-release.cjs')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const exportsKeys = Object.keys(pkg.exports).join(',')

function packTree(dest) {
  const r = spawnSync('npm', ['pack', '--pack-destination', dest], { cwd: root, encoding: 'utf8', timeout: 180000 })
  assert.equal(r.status, 0, `npm pack failed: ${r.stderr}`)
  const tgz = join(dest, `${pkg.name}-${pkg.version}.tgz`)
  assert.ok(existsSync(tgz), `npm pack produced nothing at ${tgz}`)
  return tgz
}

test('the pack ladder verifies real npm pack output (contents + identity + bin)', () => {
  const work = mkdtempSync(join(tmpdir(), 'release-verify-'))
  const tgz = packTree(work)
  const r = spawnSync('node', [script, '--pack', tgz, '--version', pkg.version, '--exports', exportsKeys], { cwd: root, encoding: 'utf8', timeout: 300000 })
  const out = `${r.stdout}\n${r.stderr}`
  assert.equal(r.status, 0, `pack ladder failed (${r.status}):\n${out}`)
  assert.ok(out.includes('PASS forbidden scan'), 'forbidden scan never ran')
  assert.ok(out.includes('PASS served set == npm pack of this tree'), 'expected-set equality never asserted')
  assert.ok(out.includes(`PASS identity: ${pkg.name}@`), 'identity line missing')
  assert.ok(out.includes('PASS exports map held'), 'the exports pin never ran')
  assert.ok(out.includes('PASS installed bin govstruct --version'), 'the installed bin --version probe never passed')
  if (!out.includes('PASS consumer probes')) {
    assert.ok(out.includes('SKIP consumer install'), `no PASS and no named SKIP for the consumer install:\n${out}`)
  }
  rmSync(work, { recursive: true, force: true })
})

test('a doctored tarball is refused BY NAME before any install', () => {
  const toy = mkdtempSync(join(tmpdir(), 'verify-release-smuggle-'))
  writeFileSync(join(toy, 'package.json'), JSON.stringify({ name: 'govstruct', version: pkg.version, files: ['package.json'] }, null, 2))
  const r = spawnSync('npm', ['pack', '--pack-destination', toy], { cwd: toy, encoding: 'utf8', timeout: 120000 })
  assert.equal(r.status, 0, `toy npm pack failed: ${r.stderr}`)
  const base = join(toy, `govstruct-${pkg.version}.tgz`)
  const ex = join(toy, 'extracted')
  mkdirSync(ex, { recursive: true })
  assert.equal(spawnSync('tar', ['-xzf', base, '-C', ex], { encoding: 'utf8' }).status, 0)
  mkdirSync(join(ex, 'package', 'labs'), { recursive: true })
  writeFileSync(join(ex, 'package', 'labs', 'smuggled.txt'), 'must never ship\n')
  const doctored = join(toy, 'doctored.tgz')
  assert.equal(spawnSync('tar', ['-czf', doctored, '-C', join(ex, 'package'), '.'], { encoding: 'utf8' }).status, 0)
  const rv = spawnSync('node', [script, '--pack', doctored, '--version', pkg.version], { cwd: toy, encoding: 'utf8', timeout: 300000 })
  const out = `${rv.stdout}\n${rv.stderr}`
  assert.equal(rv.status, 1, `the smuggle was not refused (${rv.status}):\n${out}`)
  assert.ok(out.includes('labs/smuggled.txt'), `the refusal does not name the smuggle:\n${out}`)
  rmSync(toy, { recursive: true, force: true })
})
