// src/address.mjs - the roll-up's address and cache contract (PRD 5.1, G12).
//
// registry.json is a build artifact that many consumers read (creadev.org,
// vant's connector, railyard). Without a stable address and a cache policy
// every consumer re-derives it and the copies diverge. So:
//
//   - apps.json is the canonical source; registry.json is ONE rendering of
//     it. One artifact, many readers, no divergent copies.
//   - the roll-up serves at a VERSIONED path (a consumer pins the shape it
//     knows) with an ETag and a max-age, so it caches cheaply and revalidates
//     cheaply.
//   - a checksum rides the surface (lock, section 6), so a consumer can prove
//     the copy it read is the copy the suite emitted.
//
// The ETag is keyed on the manifest checksum, not the rendered bytes: the
// roll-up is a pure function of the manifest, so the two agree, and an etag
// inside the body is not self-referential.
import { createHash } from 'node:crypto'
import { manifestChecksum } from './render.mjs'
import { Refusal } from './refusals.mjs'

/** The payload schema version the tool can address. */
export const ADDRESS_SCHEMA = 1
/** The default cache lifetime, in seconds (cheap to cache, cheap to revalidate). */
export const CACHE_MAX_AGE = 300

/**
 * The stable address of a roll-up payload. `manifest` is the composed
 * manifest; the returned object names the versioned path, the ETag, and the
 * cache policy. A payload schema version the tool cannot render refuses
 * `E_ADDRESS_VERSION_UNKNOWN` - a consumer never reads a shape nobody served.
 */
export function rollupAddress(manifest) {
  const version = manifest.schemaVersion ?? ADDRESS_SCHEMA
  if (version !== ADDRESS_SCHEMA) {
    throw new Refusal('E_ADDRESS_VERSION_UNKNOWN', `cannot address roll-up payload schemaVersion ${JSON.stringify(version)} (have ${ADDRESS_SCHEMA})`, { version })
  }
  return {
    schemaVersion: ADDRESS_SCHEMA,
    path: `registry.v${version}.json`,
    url: `/registry.v${version}.json`,
    etag: rollupEtag(manifest),
    maxAge: CACHE_MAX_AGE,
    cacheControl: `public, max-age=${CACHE_MAX_AGE}, must-revalidate`,
    checksum: manifestChecksum(manifest),
  }
}

/** The strong ETag of a roll-up payload: a hash of the version + checksum. */
export function rollupEtag(manifest) {
  const version = manifest.schemaVersion ?? ADDRESS_SCHEMA
  const canonical = JSON.stringify({ schemaVersion: version, manifest: manifestChecksum(manifest) })
  return `"sha256:${createHash('sha256').update(canonical).digest('hex')}"`
}
