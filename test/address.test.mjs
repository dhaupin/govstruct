// test/address.test.mjs - the roll-up's address and cache contract (PRD 5.1, G12).
//
// registry.json is a build artifact many consumers read, so it needs a stable
// address and a cache policy: apps.json is canonical, the roll-up serves at a
// versioned path with an ETag and a max-age, and a checksum rides the surface
// so a consumer can prove the copy it read is the copy the suite emitted.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadManifest } from '../src/manifest.mjs'
import { renderApps, renderRegistry, manifestChecksum } from '../src/render.mjs'
import { rollupAddress, rollupEtag, ADDRESS_SCHEMA, CACHE_MAX_AGE } from '../src/address.mjs'
import { Refusal } from '../src/refusals.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLEAN = join(HERE, 'fixtures', 'clean')
const manifest = () => loadManifest(CLEAN).manifest

test('the address is versioned, cached, and checksummed', () => {
  const a = rollupAddress(manifest())
  assert.equal(a.schemaVersion, ADDRESS_SCHEMA)
  assert.equal(a.path, 'registry.v1.json')
  assert.equal(a.maxAge, CACHE_MAX_AGE)
  assert.match(a.cacheControl, /max-age=\d+/)
  assert.equal(a.checksum, manifestChecksum(manifest()))
  assert.match(a.etag, /^"sha256:[0-9a-f]{64}"$/)
})

test('the ETag is deterministic and moves with the members', () => {
  const m = manifest()
  assert.equal(rollupEtag(m), rollupEtag(m))
  assert.equal(rollupAddress(m).etag, rollupEtag(m))
  const changed = structuredClone(m)
  changed.members[0].blurb = 'different'
  assert.notEqual(rollupEtag(m), rollupEtag(changed))
})

test('an unrenderable payload schema refuses by name', () => {
  const m = structuredClone(manifest())
  m.schemaVersion = 99
  assert.throws(() => rollupAddress(m), (e) => e instanceof Refusal && e.code === 'E_ADDRESS_VERSION_UNKNOWN')
})

test('apps is canonical; the registry is one rendering of it', () => {
  const apps = JSON.parse(renderApps(manifest()))
  const registry = JSON.parse(renderRegistry(manifest()))
  assert.equal(apps.generated.manifest, registry.generated.manifest)
  assert.equal(apps.address.etag, registry.address.etag)
  assert.equal(apps.memberCount, registry.memberCount)
  // The roll-up belongs to apps: same address, same members.
  assert.deepEqual(registry.order, apps.order)
})

test('the registry carries no compliance bodies (they are apps-only)', () => {
  const registry = JSON.parse(renderRegistry(manifest()))
  assert.equal(registry.compliance, undefined)
  assert.ok(registry.members.every((m) => !('floors' in m && 'clause' in m)))
})

test('apps carries the compliance map when given one', () => {
  const apps = JSON.parse(renderApps(manifest(), { alpha: { id: 'alpha', floors: { consumer: '>=20' } } }))
  assert.equal(apps.compliance.alpha.floors.consumer, '>=20')
})
