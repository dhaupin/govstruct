// src/doctor.mjs - the doctor (PRD section 6).
//
// Small, toothy, refusing. The doctor verifies the adopter serves the same
// truth the manifest declares. Two modes, split explicitly (G11):
//
//   offline (default) - manifest grammar, pins, floors, checksums, the
//     graph, the refusal vocabulary. No sockets, byte-deterministic.
//   online (--network) - url resolvability, npm existence, repo existence.
//
// `--suite` reads every member's declared state and reports drift: a
// lagging adopter is a state, not a crime, so suite mode warns where doctor
// mode refuses. This is the author-time-vs-run-time split packstruct draws.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig, resolveIn } from './config.mjs'
import { loadManifest } from './manifest.mjs'
import { RefusalBag } from './refusals.mjs'
import { surfaceDrift, versionedRollupDrift } from './surfaces.mjs'
import { verifySurfaces } from './surface.mjs'
import { runPool } from './pool.mjs'

/**
 * Adopter doctor: this tree against its own manifest. Returns
 * { ok, refusals, report, lines }.
 */
export function doctor(target = '.', { network = false } = {}) {
  const { root, config } = loadConfig(target)
  const bag = new RefusalBag()
  const lines = []
  const report = { checks: [], memberCount: 0, network }

  const { manifest, bag: loadBag } = loadManifest(root, { root, config })
  for (const r of loadBag.items) bag.add(r.code, r.message, r.context)
  report.memberCount = manifest.memberCount

  // Check 1: manifest grammar (folded in above via loadManifest).
  report.checks.push({ name: 'manifest-grammar', ok: loadBag.ok, detail: `${manifest.memberCount} member(s)` })

  // Check 2: emitted surfaces match a fresh render (the checksum gate).
  for (const target of ['apps', 'react', 'partial', 'readme', 'registry']) {
    const d = surfaceDrift(root, target)
    if (!d.present) {
      report.checks.push({ name: `surface-${target}`, ok: true, detail: 'not emitted yet (a state)' })
      continue
    }
    if (d.drift) {
      bag.add('E_CHECKSUM_DRIFT', `emitted surface "${target}" does not match a fresh render: ${config.surfaces[target]}`)
    }
    report.checks.push({ name: `surface-${target}`, ok: !d.drift, detail: d.drift ? 'drift' : 'in sync' })
  }

  // Check 2b: the versioned roll-up at its stable address (PRD 5.1, G12).
  const vdr = versionedRollupDrift(root)
  if (vdr.present) {
    if (vdr.etagStale) {
      bag.add('E_ROLLUP_ETAG_STALE', `emitted roll-up ETag disagrees with a fresh render: ${config.surfaces.registry}`)
    }
    if (vdr.drift) {
      bag.add('E_ROLLUP_NOT_CANONICAL', `emitted roll-up at ${vdr.path} does not match a fresh registry rendering`)
    }
    report.checks.push({ name: 'surface-rollup-address', ok: !vdr.drift && !vdr.etagStale, detail: vdr.drift ? 'drift' : vdr.etagStale ? 'stale etag' : 'in sync' })
  } else {
    report.checks.push({ name: 'surface-rollup-address', ok: true, detail: 'not emitted yet (a state)' })
  }

  // Check 2c: the emitted surfaces honor the stability contract (PRD 5.1).
  // A promised field that is absent, or carries the wrong type, is a breaking
  // change an integrator would feel; the doctor refuses it by name.
  const sv = verifySurfaces(root)
  for (const f of sv.findings) bag.add(f.code, f.message)
  report.checks.push({ name: 'surface-contract', ok: sv.ok, detail: sv.ok ? 'promised fields honored' : `${sv.findings.length} finding(s)` })

  // Check 3: compliance blocks present for each member (M1.5).
  const compDir = resolveIn(root, config.compliance.dir)
  for (const m of manifest.members) {
    const p = compDir ? join(compDir, `${m.id}.json`) : null
    if (p && !existsSync(p)) {
      bag.add('E_FIELD_MISSING', `compliance block missing for member "${m.id}"`, { id: m.id })
    }
  }
  report.checks.push({ name: 'compliance-blocks', ok: bag.ok, detail: `${manifest.memberCount} member(s)` })

  // Check 4: online truth, opt-in only.
  if (network) {
    report.checks.push({ name: 'network', ok: true, detail: 'online is a separate explicit ask: `govstruct doctor --network` (this call stays socket-free)' })
  } else {
    report.checks.push({ name: 'network', ok: true, detail: 'offline (default)' })
  }

  const refusals = bag.sorted()
  lines.push(`govstruct doctor: ${manifest.memberCount} member(s) in ${root}`)
  for (const c of report.checks) lines.push(`  ${c.ok ? 'ok  ' : 'FAIL'} ${c.name}: ${c.detail}`)
  for (const r of refusals) lines.push(`  REFUSED [${r.code}]: ${r.message}`)
  return { ok: bag.ok, refusals, report, lines }
}

/**
 * Suite doctor (--suite): every member's declared state vs its measured
 * state. Reads each member's own served facts where reachable. Returns
 * { ok, refusals, report, lines, drifts }. Suite mode warns (a lagging
 * adopter is a state), so `ok` is true unless a hard drift is found.
 */
export async function doctorSuite(target = '.', { network = false } = {}) {
  const { root, config } = loadConfig(target)
  const bag = new RefusalBag()
  const lines = []
  const drifts = []

  const { manifest, bag: loadBag } = loadManifest(root, { root, config })
  for (const r of loadBag.items) bag.add(r.code, r.message, r.context)

  // Verify the declared roster is internally consistent first.
  lines.push(`govstruct doctor --suite: ${manifest.memberCount} member(s) declared`)

  // Home-drift rule (PRD 16.6): a member claimed by two homes is a drift.
  const homeClaims = new Map()
  for (const m of manifest.members) {
    if (!m.home) continue
    if (homeClaims.has(m.id)) {
      drifts.push(`home-drift: member "${m.id}" is claimed by two homes`)
    }
    homeClaims.set(m.id, m.home)
  }

  // Topological order sanity: the composed order must cover every member.
  if (manifest.order.length !== manifest.memberCount) {
    bag.add('E_NEEDS_CYCLE', `topological order covers ${manifest.order.length} of ${manifest.memberCount} members`)
  }

  const report = {
    memberCount: manifest.memberCount,
    order: manifest.order,
    drifts,
    network,
    byRole: countBy(manifest.members, 'role'),
    byStatus: countBy(manifest.members, 'status'),
  }

  for (const [role, n] of Object.entries(report.byRole)) lines.push(`  ${role}: ${n}`)
  if (drifts.length) for (const d of drifts) lines.push(`  DRIFT ${d}`)
  for (const r of bag.sorted()) lines.push(`  REFUSED [${r.code}]: ${r.message}`)

  // Suite mode: drift is a warning, so ok only fails on a hard refusal.
  return { ok: bag.ok, refusals: bag.sorted(), report, lines, drifts }
}

function countBy(items, key) {
  const out = {}
  for (const i of items) out[i[key]] = (out[i[key]] ?? 0) + 1
  return out
}

/**
 * Online doctor (--network): the socket leg, opt-in and explicit. The offline
 * doctor stays deterministic and socket-free (G11); this is the ONLY arm that
 * opens one. It checks each member's url resolvability (and that it lands on
 * https) and each declared npm name's existence. `probe` is injectable so the
 * tests never touch the network: it takes a url and returns an HTTP status
 * (0 on a transport failure). Returns { ok, refusals, report, lines }.
 *
 * `concurrency` (default 1) races the per-member probes N-wide through the
 * shared pool (the crashtest#83 lever, ported): every member's probes are
 * independent, so a suite of N members no longer pays N serial round-trips.
 * Results land at the ORIGINAL index, so the refusals and rows stay in member
 * order regardless of completion order. `perMember` (opt-in) attaches a
 * per-member accounting row (durationMs, probes) and a run-level wall roll-up
 * to the report - wall timing is non-deterministic, so it never rides a
 * default run.
 */
export async function doctorOnline(target = '.', { probe = defaultProbe, concurrency = 1, perMember = false } = {}) {
  const { root, config } = loadConfig(target)
  const bag = new RefusalBag()
  const lines = []
  const report = { checks: [], memberCount: 0, network: true }

  const { manifest, bag: loadBag } = loadManifest(root, { root, config })
  for (const r of loadBag.items) bag.add(r.code, r.message, r.context)
  report.memberCount = manifest.memberCount

  // One member's probes, returned as a row so the pool can write it back at
  // its original index. A member's url probe is https + its http twin; the
  // npm probe is the registry existence check. Refusals are collected per-row
  // and folded back in member order below, so a raced run is order-identical
  // to the serial one.
  const probeMember = async (m) => {
    const started = perMember ? Date.now() : 0
    const row = { id: m.id, refusals: [], urlsChecked: 0, npmChecked: 0, pendingSkipped: 0 }
    // Issue #23 ask #3: a resource the member declares `pending` is a named
    // state, not a refusal - the record already says it is not live yet. The
    // online leg honors the annotation instead of crying 404 at a promise.
    const pending = new Set(Array.isArray(m.pending?.resources) ? m.pending.resources : [])
    if (typeof m.url === 'string' && m.url) {
      if (pending.has('url')) {
        row.pendingSkipped += 1
      } else {
        const https = await probe(m.url)
        const insecure = await probe(m.url.replace(/^https:/, 'http:'))
        row.urlsChecked += 1
        if (https < 200 || https >= 400) {
          if (insecure >= 200 && insecure < 400) {
            row.refusals.push(['E_URL_INSECURE', `member "${m.id}" resolves over http but not https: ${m.url}`, { id: m.id, url: m.url }])
          } else {
            row.refusals.push(['E_URL_UNRESOLVABLE', `member "${m.id}" url does not resolve: ${m.url} (HTTP ${https})`, { id: m.id, url: m.url }])
          }
        }
      }
    }
    if (typeof m.npm === 'string' && m.npm) {
      if (pending.has('npm')) {
        row.pendingSkipped += 1
      } else {
        const st = await probe(`https://registry.npmjs.org/${m.npm}`)
        row.npmChecked += 1
        if (st < 200 || st >= 400) {
          row.refusals.push(['E_NPM_MISSING', `member "${m.id}" declares npm "${m.npm}" which is not on the registry (HTTP ${st})`, { id: m.id, npm: m.npm }])
        }
      }
    }
    if (perMember) row.durationMs = Date.now() - started
    return row
  }

  const rows = await runPool(manifest.members, concurrency, probeMember)

  // Fold rows back in member order: the refusals and the counts read exactly
  // as the serial loop produced them, whatever order the probes completed in.
  let urlsChecked = 0
  let npmChecked = 0
  let pendingSkipped = 0
  for (const row of rows) {
    urlsChecked += row.urlsChecked
    npmChecked += row.npmChecked
    pendingSkipped += row.pendingSkipped
    for (const [code, message, context] of row.refusals) bag.add(code, message, context)
  }

  report.checks.push({ name: 'url-resolvability', ok: bag.ok, detail: `${urlsChecked} url(s) checked` })
  report.checks.push({ name: 'npm-existence', ok: bag.ok, detail: `${npmChecked} npm name(s) checked` })
  report.checks.push({ name: 'pending-resources', ok: true, detail: `${pendingSkipped} declared-pending resource(s) skipped (a named state)` })

  if (perMember) {
    report.members = rows
    const totalMs = rows.reduce((sum, r) => sum + (r.durationMs ?? 0), 0)
    const slowest = rows.reduce((a, b) => ((b.durationMs ?? 0) > (a.durationMs ?? 0) ? b : a), rows[0])
    report.wallMs = totalMs
    report.slowest = slowest ? { id: slowest.id, durationMs: slowest.durationMs ?? 0 } : null
  }

  const refusals = bag.sorted()
  lines.push(`govstruct doctor --network: ${manifest.memberCount} member(s) in ${root}`)
  for (const c of report.checks) lines.push(`  ${c.ok ? 'ok  ' : 'FAIL'} ${c.name}: ${c.detail}`)
  if (perMember && rows.length) {
    lines.push('  per-member accounting (id | durationMs | urls | npm | pending):')
    for (const row of rows) {
      lines.push(`    ${row.id} | ${row.durationMs ?? '-'} | ${row.urlsChecked} | ${row.npmChecked} | ${row.pendingSkipped}`)
    }
    lines.push(`    total probe wall: ${report.wallMs}ms across ${rows.length} member(s); slowest: ${report.slowest.id} (${report.slowest.durationMs}ms)`)
  }
  for (const r of refusals) lines.push(`  REFUSED [${r.code}]: ${r.message}`)
  return { ok: bag.ok, refusals, report, lines }
}

/** The default probe: a HEAD request, status 0 on a transport failure. */
async function defaultProbe(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual' })
    return res.status
  } catch {
    return 0
  }
}

export { readFileSync }
