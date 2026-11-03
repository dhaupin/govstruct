/**
 * test/distribution.test.mjs - the distribution contract (poststruct#79).
 *
 * govstruct's check packs are only as useful as their DELIVERY: an adopter
 * arms the check host by an EXACT npm pin, so the packs must ride the
 * published tarball. npm honours package.json `files`, so a pack tree
 * excluded there is invisible to `npm i govstruct` even though it is
 * committed and green. This test pins the two halves of that contract
 * against the real tree - the `files` whitelist carries `packs/`, and every
 * committed pack dir is one the whitelist would ship - so a refactor that
 * drops `packs/` from `files` (silently un-delivering the packs) fails here
 * instead of in a consumer's CI.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const treeRoot = fileURLToPath(new URL('..', import.meta.url))
const pkg = JSON.parse(readFileSync(join(treeRoot, 'package.json'), 'utf8'))
const files = Array.isArray(pkg.files) ? pkg.files : []
const packsRoot = join(treeRoot, 'packs', 'public')

test('package.json `files` carries `packs/` (npm i govstruct must deliver the packs)', () => {
  assert.ok(
    files.includes('packs/'),
    'package.json `files` must carry `packs/` - otherwise npm i govstruct delivers no packs (poststruct#79)',
  )
})

test('every committed pack dir rides the whitelist', () => {
  const packDirs = readdirSync(packsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
  assert.ok(packDirs.length > 0, `packs/public/ must carry at least one pack dir (found ${packDirs.length})`)
  for (const name of packDirs) {
    assert.ok(existsSync(join(packsRoot, name, 'pack.json')), `pack dir packs/public/${name} must carry a pack.json`)
  }
  // `files: ["packs/"]` ships the whole subtree, so one entry covers them
  // all - but the whitelist must not be narrowed to a pack-by-pack list that
  // misses a newly added pack.
  const barePacks = files.includes('packs/')
  const namedAll = packDirs.every((n) => files.includes(`packs/public/${n}`) || files.includes(`packs/public/${n}/`))
  assert.ok(barePacks || namedAll, `every pack dir must be delivered: ${packDirs.join(', ')} (files=${JSON.stringify(files)})`)
})

test('the manifest-shapes pack the check host arms is committed and delivered', () => {
  assert.ok(
    existsSync(join(packsRoot, 'govstruct-manifest-shapes', 'pack.json')),
    'the govstruct-manifest-shapes pack (the check host\'s reference profile) must be committed under packs/public/',
  )
})
