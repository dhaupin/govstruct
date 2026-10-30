// src/registry.mjs - the suite roll-up (PRD sections 5.1, 10 S1-S4).
//
// The roll-up answers "what is the suite pinned to right now?" in one
// address: floors, env keys, pins, and versions, gathered from the member
// blocks and their compliance blocks. It is a rendering of the manifest,
// never a second source of truth.
//
// G12: the roll-up has a stable address and a checksum, so a consumer can
// prove the copy it read is the copy the suite emitted.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig, resolveIn } from './config.mjs'
import { loadManifest } from './manifest.mjs'
import { manifestChecksum } from './render.mjs'

/** Compose the suite roll-up from the manifest plus compliance blocks. */
export function suiteRegistry(target = '.') {
  const { root, config } = loadConfig(target)
  const { manifest } = loadManifest(root, { root, config })
  const compDir = resolveIn(root, config.compliance.dir)

  const floors = []
  const env = []
  const pins = []
  const versions = []

  for (const m of manifest.members) {
    const comp = readCompliance(compDir, m.id)
    if (!comp) continue
    if (comp.floors) floors.push({ id: m.id, ...comp.floors })
    if (Array.isArray(comp.env)) for (const e of comp.env) env.push({ id: m.id, ...e })
    if (Array.isArray(comp.pins)) for (const p of comp.pins) pins.push({ id: m.id, ...p })
    if (comp.version) versions.push({ id: m.id, ...comp.version })
  }

  return {
    family: manifest.family,
    manifest: manifestChecksum(manifest),
    memberCount: manifest.memberCount,
    byRole: countBy(manifest.members, 'role'),
    byStatus: countBy(manifest.members, 'status'),
    floors,
    env,
    pins,
    versions,
  }
}

function readCompliance(dir, id) {
  if (!dir) return null
  const p = join(dir, `${id}.json`)
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

function countBy(items, key) {
  const out = {}
  for (const i of items) out[i[key]] = (out[i[key]] ?? 0) + 1
  return out
}
