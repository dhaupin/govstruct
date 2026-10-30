// src/surfaces.mjs - emit surfaces to disk (PRD section 5).
//
// render <target> prints to stdout; render <target> --write emits to the
// configured path. Both read the same manifest, so a printed surface and a
// written surface are the same bytes.
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { loadConfig, resolveIn } from './config.mjs'
import { loadManifest } from './manifest.mjs'
import { SURFACES, renderRegistry } from './render.mjs'
import { rollupAddress } from './address.mjs'

/** Render one surface to a string (throws on an unknown target). */
export function renderSurface(root, target) {
  if (!(target in SURFACES)) {
    throw new Error(`unknown render target "${target}" (have: ${Object.keys(SURFACES).join(', ')})`)
  }
  const { config } = loadConfig(root)
  const { manifest } = loadManifest(root)
  return SURFACES[target](manifest, { compliance: complianceMap(root, config) })
}

/** The compliance blocks, keyed by member id (the canonical apps body). */
export function complianceMap(root, config) {
  const dir = resolveIn(root, config.compliance?.dir)
  const out = {}
  if (!dir || !existsSync(dir)) return out
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue
    try {
      const block = JSON.parse(readFileSync(join(dir, f), 'utf8'))
      if (block && typeof block.id === 'string') out[block.id] = block
    } catch {
      // an unreadable block is the doctor's problem, not the renderer's
    }
  }
  return out
}

/**
 * Write surfaces to their configured paths. Returns the list of written
 * paths (relative to root). `--out` overrides the configured path for a
 * single-surface write.
 */
export function writeSurfaces(root, targets, { out } = {}) {
  const { config } = loadConfig(root)
  const { manifest } = loadManifest(root)
  const ctx = { compliance: complianceMap(root, config) }
  const written = []
  for (const target of targets) {
    if (!(target in SURFACES)) throw new Error(`unknown render target "${target}"`)
    const dest = out ? resolveIn(root, out) : resolveIn(root, config.surfaces[target])
    if (!dest) throw new Error(`no configured path for surface "${target}"`)
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, SURFACES[target](manifest, ctx))
    written.push(relativeTo(root, dest))
  }
  return written
}

/** Verify a written surface matches a fresh render (the checksum gate). */
export function surfaceDrift(root, target) {
  const { config } = loadConfig(root)
  const dest = resolveIn(root, config.surfaces[target])
  if (!dest || !existsSync(dest)) return { present: false, drift: false, path: dest }
  const current = readFileSync(dest, 'utf8')
  const fresh = renderSurface(root, target)
  return { present: true, drift: current !== fresh, path: dest }
}

/**
 * Write the roll-up's versioned copy at its stable address (PRD 5.1, G12).
 * registry.json is the mutable rendering; `registry.v1.json` is the address a
 * consumer pins. Returns the list of written paths (relative to root).
 */
export function writeVersionedRollup(root) {
  const { config } = loadConfig(root)
  const { manifest } = loadManifest(root)
  const address = rollupAddress(manifest)
  const dest = resolveIn(root, address.path)
  if (!dest) throw new Error('no root for the versioned roll-up')
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, renderRegistry(manifest))
  return [relativeTo(root, dest)]
}

/**
 * Verify the emitted versioned roll-up matches a fresh render (the checksum
 * gate at the stable address). Returns { present, drift, etagStale, path }.
 */
export function versionedRollupDrift(root) {
  const { manifest } = loadManifest(root)
  const address = rollupAddress(manifest)
  const dest = resolveIn(root, address.path)
  if (!dest || !existsSync(dest)) return { present: false, drift: false, etagStale: false, path: dest, etag: address.etag }
  const current = readFileSync(dest, 'utf8')
  const fresh = renderRegistry(manifest)
  let etagStale = false
  try {
    etagStale = JSON.parse(current).address?.etag !== address.etag
  } catch {
    etagStale = true
  }
  return { present: true, drift: current !== fresh, etagStale, path: dest, etag: address.etag }
}

function relativeTo(root, p) {
  const r = resolve(root)
  const a = resolve(p)
  return a.startsWith(r) ? a.slice(r.length + 1) : a
}
