// src/lifecycle.mjs - lifecycle and revocation (PRD section 6.6, G7).
//
// A member is not just Live or not: it is born, changed, and retired, and
// retirement must not break the links that point at it. The ladder is
// forward-only:
//
//   Live -> Beta -> In Development -> Backburner -> Archived -> Tombstoned
//
// Tombstoned is terminal. Its law: a retired member KEEPS its aliases
// forwarding and its row, so an old id or url resolves to a tombstone
// ("retired") - never a 404. The transition is recorded in `history[]`, so
// the member carries the receipt of how it got here, and `status` must agree
// with the last transition (validateBlock enforces both).
//
// Like the stamp path (G1), retire is a governed write: it validates against
// the same grammar a hand-authored change does, never invents a transition
// the ladder forbids, and appends one ledger row (G14). The tool never
// commits or pushes.
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { RefusalBag } from './refusals.mjs'
import { loadConfig, membersDir } from './config.mjs'
import { loadManifest, LIFECYCLE, STATUSES } from './manifest.mjs'
import { appendEntry } from './audit.mjs'

/**
 * Validate a retirement against the roster. Returns { ok, refusals, block,
 * target }. A refusal is data, never a crash.
 */
export function validateRetire(root, record, config) {
  const bag = new RefusalBag()
  const id = record?.id
  if (typeof id !== 'string' || !id) {
    bag.add('E_RETIRE_UNKNOWN_MEMBER', 'a retirement needs a member id', {})
    return { ok: false, refusals: bag.sorted(), block: null, target: null }
  }

  const { manifest } = loadManifest(root, { root, config })
  const member = manifest.members.find((m) => m.id === id)
  if (!member) {
    bag.add('E_RETIRE_UNKNOWN_MEMBER', `member "${id}" is not in the roster`, { id })
    return { ok: false, refusals: bag.sorted(), block: null, target: null }
  }
  if (member.status === 'Tombstoned') {
    bag.add('E_RETIRE_ALREADY_TOMBSTONED', `member "${id}" is already Tombstoned (retirement is terminal)`, { id })
  }

  // A retirement must leave a forwarding alias so old links resolve. The
  // member's own id is always a valid forward, but an alias is required only
  // when the id changes; accept an explicit alias, else fall back to keeping
  // the member's current aliases.
  const alias = record?.alias
  if (alias !== undefined && (typeof alias !== 'string' || !alias.trim())) {
    bag.add('E_RETIRE_ALIAS_REQUIRED', `alias must be a non-empty string when supplied`, { id })
  }

  const target = join(membersDir(root, config), `${id}.json`)
  if (!existsSync(target)) {
    bag.add('E_RETIRE_UNKNOWN_MEMBER', `member file ${id}.json is missing`, { id })
  }

  // Read the raw block so history and aliases survive the rewrite.
  let raw = null
  if (existsSync(target)) {
    try {
      raw = JSON.parse(readFileSync(target, 'utf8'))
    } catch (e) {
      bag.add('E_RETIRE_UNKNOWN_MEMBER', `member file ${id}.json is not valid JSON: ${e.message}`, { id })
    }
  }

  return { ok: bag.ok, refusals: bag.sorted(), block: raw, target, member }
}

/**
 * Retire a member: append the Tombstoned transition to history, keep the
 * forwarding alias, and append the ledger row. With dryRun, validate only.
 * Returns { ok, refusals, wrote, entry, lines }.
 */
export function retire(root, record, { dryRun = false, at } = {}) {
  const { config } = loadConfig(root)
  const lines = []
  const v = validateRetire(root, record, config)
  if (!v.ok) {
    for (const r of v.refusals) lines.push(`  REFUSED [${r.code}]: ${r.message}`)
    return { ok: false, refusals: v.refusals, wrote: null, entry: null, lines }
  }

  const block = v.block
  const history = Array.isArray(block.history) ? [...block.history] : []
  history.push({ status: 'Tombstoned', at: at ?? new Date().toISOString(), note: record?.note ?? 'retired' })

  const aliases = new Set(Array.isArray(block.aliases) ? block.aliases : [])
  if (typeof record?.alias === 'string' && record.alias.trim()) aliases.add(record.alias)
  // The member keeps its row, so its own id still resolves to the tombstone;
  // we never add the id as its own alias (that is E_ALIAS_SELF). An alias is
  // only for a FORMER id, which is what a rename leaves behind.

  const next = { ...block, status: 'Tombstoned', aliases: [...aliases], history }

  const rel = join(config.members.dir, `${block.id}.json`)
  if (dryRun) {
    lines.push(`govstruct retire: would tombstone ${rel} (dry-run, no change)`)
    return { ok: true, refusals: [], wrote: null, entry: null, lines }
  }

  writeFileSync(v.target, JSON.stringify(next, null, 2) + '\n')
  const entry = appendEntry(root, {
    verb: 'retire',
    actor: record?.actor ?? { kind: 'human', id: 'govstruct' },
    subject: { member: block.id, from: block.status, to: 'Tombstoned' },
    evidence: record?.evidence ?? [],
    verdict: 'PASS',
  })
  lines.push(`govstruct retire: tombstoned ${rel}`)
  lines.push(`  ledger seq ${entry.seq} (${entry.addr.slice(0, 16)}...)`)
  return { ok: true, refusals: [], wrote: rel, entry, lines }
}

export { LIFECYCLE, STATUSES }
