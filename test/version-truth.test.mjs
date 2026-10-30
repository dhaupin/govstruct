/**
 * test/version-truth.test.mjs - the version-truth census leg (the family
 * ruling; eyestruct@3d8a822 is the worked example). package.json is THE
 * single version truth of this tree; every living surface that names the
 * CURRENT version is pinned to it, so a release is "move package.json + the
 * CHANGELOG" and this battery refuses the surface that forgot.
 *
 * Lawful by classification (kept as-is): dated era rows (CHANGELOG dated
 * sections), range pins such as "0.9.x is the manual ladder" (they bind
 * ladder COMPATIBILITY, never the current version), and other packages'
 * version mentions.
 */
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('version truth: package.json is the single version source, and the living surfaces cannot drift from it', () => {
  const root = JSON.parse(read('package.json')).version
  assert.match(root, /^\d+\.\d+\.\d+$/, 'root package.json version is not semver')

  // web/package.json is a side package: it rides the root version, never a copy.
  const web = JSON.parse(read('web/package.json')).version
  assert.equal(
    web,
    root,
    'web/package.json version drifted from root package.json - the release commit moves them together',
  )

  // The README status line names the current version; it moves with the root.
  const status = read('README.md').match(/Status:\*\* (\d+\.\d+\.\d+)/)
  assert.ok(status, 'README must carry a "Status:** X.Y.Z, ..." line for the version pin')
  assert.equal(
    status[1],
    root,
    'README status line carries a stale version - move it in the same commit as root package.json, or drop the number',
  )
})
