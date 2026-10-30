// src/names.mjs - the naming authority (PRD section 6.2, G2).
//
// The rename was also a collision fix: `flowforge` was taken on npm, and
// nothing checked before admitting it. `names <id>` extends the doctor's
// "unique" rule outward - it checks a candidate against npm, GitHub, and
// the roster. The manifest carries a names.reserved block so a claim is
// recorded, not remembered.
//
// Offline by default: the roster and reserved checks are pure. The npm and
// GitHub probes need a socket and run only on --network.
import { loadConfig } from './config.mjs'
import { loadManifest } from './manifest.mjs'

/**
 * Check a candidate id. Returns { ok, id, checks, lines }. Offline checks
 * always run; network checks run only when `network` is true.
 */
export async function names(target, id, { network = false } = {}) {
  const { root, config } = loadConfig(target)
  const { manifest } = loadManifest(root, { root, config })
  const lines = []
  const checks = []
  let ok = true

  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    checks.push({ name: 'kebab-case', ok: false, detail: 'id must be kebab-case' })
    ok = false
  } else {
    checks.push({ name: 'kebab-case', ok: true, detail: 'ok' })
  }

  const live = manifest.members.some((m) => m.id === id)
  const alias = manifest.members.some((m) => (m.aliases ?? []).includes(id))
  checks.push({ name: 'roster', ok: !live && !alias, detail: live ? 'id is a live member' : alias ? 'id is a retired alias' : 'free' })
  if (live || alias) ok = false

  const reserved = new Set(config.names?.reserved ?? [])
  const isReserved = reserved.has(id)
  checks.push({ name: 'reserved', ok: !isReserved, detail: isReserved ? 'id is reserved' : 'not reserved' })
  if (isReserved) ok = false

  if (network) {
    const npm = await probe(`https://registry.npmjs.org/${id}`)
    const gh = await probe(`https://github.com/dhaupin/${id}`)
    checks.push({ name: 'npm', ok: npm === 404, detail: npm === 404 ? 'free (404)' : `HTTP ${npm}` })
    checks.push({ name: 'github', ok: gh === 404, detail: gh === 404 ? 'free (404)' : `HTTP ${gh}` })
    if (npm !== 404 || gh !== 404) ok = false
  } else {
    checks.push({ name: 'network', ok: true, detail: 'skipped (offline; pass --network to probe npm and GitHub)' })
  }

  lines.push(`govstruct names ${id}: ${ok ? 'free' : 'taken'}`)
  for (const c of checks) lines.push(`  ${c.ok ? 'ok  ' : 'FAIL'} ${c.name}: ${c.detail}`)
  return { ok, id, checks, lines }
}

async function probe(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual' })
    return res.status
  } catch {
    return 0
  }
}
