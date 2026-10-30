// src/surfaces.mjs - emit surfaces to disk (PRD section 5).
//
// render <target> prints to stdout; render <target> --write emits to the
// configured path. Both read the same manifest, so a printed surface and a
// written surface are the same bytes.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { loadConfig, resolveIn } from './config.mjs'
import { loadManifest } from './manifest.mjs'
import { SURFACES } from './render.mjs'

/** Render one surface to a string (throws on an unknown target). */
export function renderSurface(root, target) {
  if (!(target in SURFACES)) {
    throw new Error(`unknown render target "${target}" (have: ${Object.keys(SURFACES).join(', ')})`)
  }
  const { manifest } = loadManifest(root)
  return SURFACES[target](manifest)
}

/**
 * Write surfaces to their configured paths. Returns the list of written
 * paths (relative to root). `--out` overrides the configured path for a
 * single-surface write.
 */
export function writeSurfaces(root, targets, { out } = {}) {
  const { config } = loadConfig(root)
  const { manifest } = loadManifest(root)
  const written = []
  for (const target of targets) {
    if (!(target in SURFACES)) throw new Error(`unknown render target "${target}"`)
    const dest = out ? resolveIn(root, out) : resolveIn(root, config.surfaces[target])
    if (!dest) throw new Error(`no configured path for surface "${target}"`)
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, SURFACES[target](manifest))
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

function relativeTo(root, p) {
  const r = resolve(root)
  const a = resolve(p)
  return a.startsWith(r) ? a.slice(r.length + 1) : a
}
