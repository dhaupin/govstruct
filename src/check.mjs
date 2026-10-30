// src/check.mjs - the check verb: run the compliance shape packs
// (PRD sections 10, 11).
//
// Compliance rules ARE check-profile packs (the packstruct SPEC v1 `check`
// profile: a default export { checks: [Check] }). govstruct is a
// check-profile host like poststruct. This module loads the packs under
// packs/public/, runs each check over the target tree, and reports by code.
//
// The interop law governs the crossing: govstruct never imports a sibling
// to check a sibling - it invokes the sibling's public CLI. When packstruct
// is present, `check` shells `packstruct lint packs --deep`; the built-in
// checks below run regardless, so the verb works with zero devDeps.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { loadConfig, resolveIn } from './config.mjs'
import { loadManifest } from './manifest.mjs'
import { RefusalBag, loadRegistry } from './refusals.mjs'
import { loadIsoProfile, isoCoverage } from './iso.mjs'
import { loadSurfaceContract, verifySurfaces } from './surface.mjs'

/**
 * Load every check pack under `<root>/packs/public/<name>/`. Returns
 * { packs, bag } where each pack is { name, dir, manifest, checks }.
 */
export async function loadCheckPacks(root) {
  const bag = new RefusalBag()
  const packs = []
  const dir = join(root, 'packs', 'public')
  if (!existsSync(dir)) return { packs, bag }
  for (const name of readdirSync(dir).sort()) {
    const packDir = join(dir, name)
    if (!statSync(packDir).isDirectory()) continue
    const manifestPath = join(packDir, 'pack.json')
    if (!existsSync(manifestPath)) {
      bag.add('E_PACK_INVALID', `pack "${name}" has no pack.json`, { pack: name })
      continue
    }
    let manifest
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    } catch (e) {
      bag.add('E_PACK_INVALID', `pack "${name}" pack.json is not valid JSON: ${e.message}`, { pack: name })
      continue
    }
    if (manifest.schemaVersion !== 1) {
      bag.add('E_PACK_INVALID', `pack "${name}" schemaVersion must be 1`, { pack: name })
      continue
    }
    if (manifest.name !== name) {
      bag.add('E_PACK_INVALID', `pack name "${manifest.name}" does not match its directory "${name}"`, { pack: name })
    }
    const entryPath = join(packDir, manifest.entry)
    if (!existsSync(entryPath)) {
      bag.add('E_PACK_INVALID', `pack "${name}" entry "${manifest.entry}" does not exist`, { pack: name })
      continue
    }
    let mod
    try {
      mod = (await import(pathToFileURL(entryPath).href)).default
    } catch (e) {
      bag.add('E_PACK_INVALID', `pack "${name}" entry failed to import: ${e.message}`, { pack: name })
      continue
    }
    const checks = Array.isArray(mod?.checks) ? mod.checks : []
    if (!Array.isArray(mod?.checks)) {
      // A pack that exports `attacks` is a crashtest scenario pack sharing
      // the /packs tree; it is not a check-profile pack, so the check host
      // passes it by (the interop law: govstruct never judges a sibling's
      // pack shape - crashtest owns it).
      if (Array.isArray(mod?.attacks)) continue
      bag.add('E_PACK_INVALID', `pack "${name}" default export must carry a checks array (the check profile)`, { pack: name })
      continue
    }
    packs.push({ name, dir: packDir, manifest, checks })
  }
  return { packs, bag }
}

/**
 * Run the check packs over `target`. Returns { ok, refusals, lines, results }.
 * Each check is a pure reader: it receives a context and returns zero or
 * more finding rows ({ code, message, path }).
 */
export async function runChecks(target = '.', { json = false, packsDir } = {}) {
  const { root, config } = loadConfig(target)
  const { packs, bag } = await loadCheckPacks(packsDir ?? root)
  const lines = []
  const results = []
  const { manifest } = loadManifest(root, { root, config })
  const ctx = {
    root,
    config,
    readFile: (p) => readFileSync(join(root, p), 'utf8'),
    exists: (p) => existsSync(join(root, p)),
    readdir: (p = '.') => readdirSync(join(root, p)),
    list: (p = '.', { ext } = {}) => walk(root, p).filter((f) => !ext || f.endsWith(ext)),
    loadManifest: () => manifest,
    loadCompliance: (id) => {
      const p = join(root, config.compliance.dir, `${id}.json`)
      return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null
    },
    loadIsoProfile: () => loadIsoProfile(root),
    loadRegistry: () => loadRegistry(),
    isoCoverage: () => isoCoverage(loadRegistry(), { profile: loadIsoProfile(root) }),
    loadSurfaceContract: () => loadSurfaceContract(),
    verifySurfaces: () => verifySurfaces(root, loadSurfaceContract()),
  }

  lines.push(`govstruct check: ${packs.length} pack(s) over ${root}`)
  for (const pack of packs) {
    for (const check of pack.checks) {
      if (!check || typeof check.id !== 'string') {
        bag.add('E_PACK_INVALID', `pack "${pack.name}" has a check without a kebab-case id`, { pack: pack.name })
        continue
      }
      let findings = []
      try {
        findings = (await check.run(ctx)) ?? []
      } catch (e) {
        bag.add('E_PACK_INVALID', `check "${pack.name}/${check.id}" threw: ${e.message}`, { pack: pack.name })
        continue
      }
      for (const f of findings) {
        const code = f.code && /^[A-Z][A-Z0-9_]*$/.test(f.code) ? f.code : 'E_SUITE_DRIFT'
        bag.add(code, `[${pack.name}/${check.id}] ${f.message}`, { pack: pack.name, check: check.id, path: f.path })
      }
      results.push({ pack: pack.name, check: check.id, findings: findings.length })
      lines.push(`  ${findings.length ? 'FAIL' : 'ok  '} ${pack.name}/${check.id}: ${findings.length} finding(s)`)
    }
  }

  // Interop: if packstruct is available, shell its lint over our packs.
  const packstruct = which('packstruct')
  if (packstruct && existsSync(join(root, 'packs'))) {
    const r = spawnSync(packstruct, ['lint', join(root, 'packs'), '--deep'], { encoding: 'utf8' })
    const ok = r.status === 0
    if (!ok) bag.add('E_PACK_INVALID', `packstruct lint refused our packs:\n${r.stdout || r.stderr}`)
    lines.push(`  ${ok ? 'ok  ' : 'FAIL'} packstruct lint packs --deep`)
  }

  const refusals = bag.sorted()
  for (const r of refusals) lines.push(`  REFUSED [${r.code}]: ${r.message}`)
  if (json) console.log(JSON.stringify({ schema: 1, mode: 'check', ok: bag.ok, packs: packs.length, results, refusals: refusals.map((r) => ({ code: r.code, message: r.message })) }, null, 2))
  else for (const l of lines) console.log(l)
  return { ok: bag.ok, refusals, lines, results }
}

function which(cmd) {
  const r = spawnSync('sh', ['-c', `command -v ${cmd}`], { encoding: 'utf8' })
  return r.status === 0 ? r.stdout.trim() : null
}

const SKIP_DIRS = new Set(['.git', 'node_modules', '.prestruct', 'dist', '_site', 'vendor', 'horcrux', 'labs'])

/** Recursively list files under `root/rel`, returning repo-relative paths. */
function walk(root, rel = '.') {
  const out = []
  const base = join(root, rel)
  if (!existsSync(base)) return out
  const visit = (dir, prefix) => {
    for (const name of readdirSync(dir).sort()) {
      if (SKIP_DIRS.has(name)) continue
      const full = join(dir, name)
      const relPath = prefix ? `${prefix}/${name}` : name
      if (statSync(full).isDirectory()) visit(full, relPath)
      else out.push(relPath)
    }
  }
  visit(base, rel === '.' ? '' : rel)
  return out
}

export { resolveIn }
