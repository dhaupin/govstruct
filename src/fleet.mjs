// src/fleet.mjs - the fleet drift meter (PRD section 16.10, G13).
//
// The golden case: the four proving cases are events (a rename, a move, a
// handshake, a stamp); this is the steady state - a living fleet that
// drifts unless something holds it. coreforge is prevention (it stamps a NEW
// repo with the pattern); govstruct is detection (it notices when a repo
// LEAVES the pattern, and which, and how, on one page).
//
// The meter reads each member's LIVE surfaces - the repo's engines floor,
// its lockfile, its pin style, its workflow count, its published version -
// and compares each against the truth the manifest declares. Every
// disagreement is a typed refusal with a clause and a fix. Offline by
// default: it reads a local checkout when it can find one (`--fleet-root`)
// and otherwise reports what the manifest alone can prove, naming the
// unchecked surface as a state, never a silent pass.
//
// A fleet of fact read: a drift you cannot name is a drift you cannot fix.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig } from './config.mjs'
import { loadManifest } from './manifest.mjs'
import { RefusalBag } from './refusals.mjs'

/**
 * Read the live facts of one member repo, best-effort. Returns a plain
 * object of what was found; absent facts are `null`, never guessed. Reads
 * nothing when the root is missing.
 */
export function readRepoFacts(knownRoot) {
  const facts = { present: false, engines: null, hasPackageJson: false, hasLockfile: false, workflows: null, version: null }
  if (!knownRoot || !existsSync(knownRoot)) return facts
  facts.present = true

  const pkgPath = join(knownRoot, 'package.json')
  if (existsSync(pkgPath)) {
    facts.hasPackageJson = true
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
      facts.version = typeof pkg.version === 'string' ? pkg.version : null
      facts.engines = pkg.engines?.node ?? null
    } catch {
      // A malformed package.json is the repo's own problem, not the meter's.
    }
  }
  facts.hasLockfile = existsSync(join(knownRoot, 'package-lock.json'))

  const wfDir = join(knownRoot, '.github', 'workflows')
  if (existsSync(wfDir)) {
    try {
      facts.workflows = readdirSync(wfDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml')).length
    } catch {
      // unreadable directory: leave null
    }
  } else {
    facts.workflows = 0
  }
  return facts
}

/**
 * Meter the fleet: every member's declared truth vs its live facts on one
 * page. `roots` maps member id -> a known checkout path (optional). Returns
 * { ok, refusals, report, lines, drifts }.
 *
 * The meter WARNS where the doctor REFUSES: a lagging repo is a state, not a
 * crime (the author-time-vs-run-time split). So `ok` is true unless a member
 * declares a fact it does not satisfy AND the surface was actually read.
 */
export function fleetMeter(target = '.', { roots = {} } = {}) {
  const { root, config } = loadConfig(target)
  const bag = new RefusalBag()
  const lines = []
  const drifts = []

  const { manifest, bag: loadBag } = loadManifest(root, { root, config })
  for (const r of loadBag.items) bag.add(r.code, r.message, r.context)

  const rows = []
  for (const m of manifest.members) {
    const comp = readCompliance(root, config, m.id)
    const knownRoot = roots[m.id] ?? null
    const facts = readRepoFacts(knownRoot)
    const row = { id: m.id, read: facts.present, surfaces: {} }

    // S1: the shipped engines floor vs the declared floor.
    const declaredFloor = comp?.floors?.consumer ?? null
    row.surfaces.floor = { declared: declaredFloor, live: facts.engines, known: facts.present && facts.engines !== null }
    if (facts.present && facts.engines && declaredFloor) {
      const want = normalizeFloor(declaredFloor)
      const got = normalizeFloor(facts.engines)
      if (want !== got) {
        const msg = `${m.id} floor "${facts.engines}" disagrees with its declared floor "${declaredFloor}" (S1)`
        drifts.push(msg)
        bag.add('E_FLEET_FLOOR_DRIFT', msg, { id: m.id, declared: declaredFloor, live: facts.engines })
      }
    }

    // Lockfile: a repo that ships package.json but no lock can drift on install.
    row.surfaces.lockfile = { hasPackageJson: facts.hasPackageJson, hasLockfile: facts.hasLockfile }
    if (facts.present && facts.hasPackageJson && !facts.hasLockfile) {
      const msg = `${m.id} ships package.json with no lockfile`
      drifts.push(msg)
      bag.add('E_FLEET_LOCK_MISSING', msg, { id: m.id })
    }

    // S4: the live version vs the declared repo version.
    const declaredVersion = comp?.version?.repo ?? null
    row.surfaces.version = { declared: declaredVersion, live: facts.version, known: facts.present && facts.version !== null }
    if (facts.present && facts.version && declaredVersion && facts.version !== declaredVersion) {
      const msg = `${m.id} version "${facts.version}" disagrees with its declared repo version "${declaredVersion}" (S4)`
      drifts.push(msg)
      bag.add('E_FLEET_VERSION_DRIFT', msg, { id: m.id, declared: declaredVersion, live: facts.version })
    }

    // CI shape: the live workflow count vs the declared shape (when declared).
    const declaredCi = comp?.ci?.workflows ?? null
    row.surfaces.ci = { declared: declaredCi, live: facts.workflows, known: facts.present && facts.workflows !== null }
    if (facts.present && declaredCi !== null && facts.workflows !== null && facts.workflows !== declaredCi) {
      const msg = `${m.id} ships ${facts.workflows} workflow(s), declared ${declaredCi}`
      drifts.push(msg)
      bag.add('E_FLEET_CI_SHAPE_DRIFT', msg, { id: m.id, declared: declaredCi, live: facts.workflows })
    }

    // S3: the companion pin style vs the declared pin.
    const declaredPin = comp?.pins?.find((p) => p && p.kind === 'companion') ?? null
    row.surfaces.pin = { declared: declaredPin?.style ?? null, live: null, known: false }
    if (facts.present && declaredPin?.style && facts.hasPackageJson) {
      const style = pinStyle(knownRoot, declaredPin.name ?? 'packstruct')
      row.surfaces.pin = { declared: declaredPin.style, live: style, known: style !== null }
      if (style && style !== declaredPin.style) {
        const msg = `${m.id} pins ${declaredPin.name ?? 'packstruct'} as "${style}", declared "${declaredPin.style}" (S3)`
        drifts.push(msg)
        bag.add('E_FLEET_PIN_STYLE_DRIFT', msg, { id: m.id, declared: declaredPin.style, live: style })
      }
    }

    rows.push(row)
  }

  const read = rows.filter((r) => r.read).length
  const report = { memberCount: manifest.memberCount, read, unchecked: manifest.memberCount - read, drifts, rows }

  lines.push(`govstruct doctor --suite --fleet: ${manifest.memberCount} member(s), ${read} read`)
  for (const d of drifts) lines.push(`  DRIFT ${d}`)
  if (!drifts.length) lines.push('  ok   no drift')
  if (manifest.memberCount - read > 0) {
    lines.push(`  note  ${manifest.memberCount - read} member(s) had no local checkout to read (provide --fleet-root to meter them)`)
  }
  for (const r of bag.sorted()) lines.push(`  REFUSED [${r.code}]: ${r.message}`)

  // The meter warns on a lagging repo (a state); only a hard refusal fails.
  return { ok: bag.ok, refusals: bag.sorted(), report, lines, drifts }
}

/** Compare floors by their ordered digits: ">=20" and ">=20.0.0" agree. */
function normalizeFloor(s) {
  if (typeof s !== 'string') return null
  const digits = s.match(/\d+/g) ?? []
  while (digits.length > 1 && digits[digits.length - 1] === '0') digits.pop()
  return digits.join('.')
}

/** Read a companion pin's style ("exact" | "range") from package.json. */
function pinStyle(root, name) {
  const p = join(root, 'package.json')
  if (!existsSync(p)) return null
  try {
    const pkg = JSON.parse(readFileSync(p, 'utf8'))
    const spec = pkg.devDependencies?.[name] ?? pkg.dependencies?.[name]
    if (typeof spec !== 'string') return null
    return /^[\^~]/.test(spec) ? 'range' : 'exact'
  } catch {
    return null
  }
}

function readCompliance(root, config, id) {
  const dir = config.compliance?.dir
  if (!dir) return null
  const p = join(root, dir, `${id}.json`)
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}
