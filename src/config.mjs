// src/config.mjs - load and validate govstruct.config.json (PRD section 16).
//
// The config is the ONLY required input: where the member blocks live, where
// surfaces emit, which gates run. Nothing here knows a project name; a
// stranger points the tool at their own members/ and gets their own suite.
import { readFileSync, existsSync } from 'node:fs'
import { resolve, isAbsolute, join, dirname } from 'node:path'
import { Refusal, RefusalBag } from './refusals.mjs'

export const CONFIG_NAME = 'govstruct.config.json'

const DEFAULTS = {
  members: { dir: 'members' },
  compliance: { dir: 'compliance' },
  manifest: { out: 'apps.json' },
  surfaces: {
    apps: 'apps.json',
    react: 'web/src/components/AppsMenu.jsx',
    partial: 'web/public/apps-menu.html',
    readme: 'labs/readme-members.md',
    registry: 'registry.json',
  },
  gates: { packstruct: true, crashtest: true, poststruct: false },
  names: { reserved: [] },
  lock: { out: 'horcrux', name: 'govstruct' },
}

function merge(base, over) {
  if (over === undefined || over === null) return base
  if (Array.isArray(base) || typeof base !== 'object') return over
  const out = { ...base }
  for (const [k, v] of Object.entries(over)) out[k] = merge(base[k], v)
  return out
}

/**
 * Load the config from `root` (a directory) or an explicit file path.
 * Returns { root, path, config } where root is the resolved project root.
 * Throws a Refusal when the file is absent or malformed.
 */
export function loadConfig(target = '.') {
  const abs = resolve(target)
  const isDir = existsSync(abs) && !abs.endsWith('.json')
  const path = isDir ? join(abs, CONFIG_NAME) : abs
  const root = isDir ? abs : dirname(abs)
  if (!existsSync(path)) {
    throw new Refusal('E_CONFIG_MISSING', `no ${CONFIG_NAME} at ${path}`)
  }
  let raw
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    throw new Refusal('E_CONFIG_INVALID', `${CONFIG_NAME} is not valid JSON: ${e.message}`)
  }
  if (raw.schemaVersion !== 1) {
    throw new Refusal('E_CONFIG_INVALID', `config schemaVersion must be 1 (got ${JSON.stringify(raw.schemaVersion)})`)
  }
  const config = merge(DEFAULTS, raw)
  return { root, path, config }
}

/** Resolve a config-relative path against the project root. */
export function resolveIn(root, p) {
  if (p === undefined || p === null) return null
  return isAbsolute(p) ? p : join(root, p)
}

/** The absolute members directory for a loaded config. */
export function membersDir(root, config) {
  return resolveIn(root, config.members.dir)
}

/** The absolute compliance directory for a loaded config. */
export function complianceDir(root, config) {
  return resolveIn(root, config.compliance.dir)
}

export { DEFAULTS }
