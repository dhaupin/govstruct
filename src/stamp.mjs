// src/stamp.mjs - the write path (PRD section 6.5, G1).
//
// Until now the manifest was authored by hand. section 16.9 lets a machine
// write it: an agent stamps a repo and registers a member. Two agents
// stamping at once is a race, and the manifest is a committed file, so the
// write path is explicit and append-mostly:
//
//   - a stamp NEVER overwrites an existing member file (E_STAMP_TARGET_EXISTS);
//     the manifest is append-mostly, and a member row is a small unit.
//   - a stamp is validated exactly like a human's change: the member block
//     must pass the grammar (lint) and the doctor is the pre-merge check.
//   - a stamp that will spend a credential must declare it in spends[], and
//     every spend must be covered by the member's grants[] (G5). A stamp
//     cannot widen a wall.
//   - the stamp is a ledger row (G14), so the mint is auditable offline.
//
// The tool never commits and never pushes: it writes the block file and the
// ledger row, and the caller (railyard, a human, CI) opens the PR. This is
// the difference between a registry (last writer wins) and a governance
// system (every write is a reviewable, refusable claim).
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { Refusal, RefusalBag } from './refusals.mjs'
import { loadConfig, membersDir } from './config.mjs'
import { loadMemberBlocks, validateBlock } from './manifest.mjs'
import { checkSpends } from './grants.mjs'
import { appendEntry } from './audit.mjs'

/**
 * Validate a stamp record against the roster and the grammar. Returns
 * { ok, refusals, block, member } - a refusal is data, never a crash.
 *
 * A stamp record is: { member: <block>, spends?: [{ kind, scope }] }.
 */
export function validateStamp(root, record, config) {
  const bag = new RefusalBag()
  const block = record?.member
  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    bag.add('E_STAMP_INVALID', 'a stamp record must carry a "member" object')
    return { ok: false, refusals: bag.sorted(), block: null }
  }

  // The block must carry an id, and the target file must not already exist
  // (append-mostly: a stamp never overwrites).
  if (typeof block.id !== 'string' || !block.id) {
    bag.add('E_STAMP_INVALID', 'the stamped member must carry a string id')
  }

  // The block is validated with the same grammar a hand-authored one is.
  const synthetic = { ...block, __file: `${block.id ?? '?'}.json`, __filename: block.id }
  validateBlock(synthetic, bag)

  // The id must not already be a member (E_STAMP_DUPLICATE) and the target
  // file must not exist (E_STAMP_TARGET_EXISTS).
  const { blocks } = loadMemberBlocks(root, config)
  const existing = new Set(blocks.map((b) => b.id))
  if (typeof block.id === 'string' && existing.has(block.id)) {
    bag.add('E_STAMP_DUPLICATE', `member "${block.id}" is already in the roster`, { id: block.id })
  }
  const target = join(membersDir(root, config), `${block.id}.json`)
  if (existsSync(target)) {
    bag.add('E_STAMP_TARGET_EXISTS', `refusing to overwrite existing member file ${block.id}.json`, { id: block.id })
  }

  // G5: every declared spend must be covered by the member's grants[].
  for (const r of checkSpends(block, record?.spends)) {
    bag.add(r.code, r.message, r.context)
  }

  return { ok: bag.ok, refusals: bag.sorted(), block, target }
}

/**
 * Apply a stamp: validate, then write the member block and append the
 * ledger row. With dryRun, validate only and report the intended write.
 * Returns { ok, refusals, wrote, entry, lines }.
 */
export function stamp(root, record, { dryRun = false } = {}) {
  const { config } = loadConfig(root)
  const lines = []
  const v = validateStamp(root, record, config)
  if (!v.ok) {
    for (const r of v.refusals) lines.push(`  REFUSED [${r.code}]: ${r.message}`)
    return { ok: false, refusals: v.refusals, wrote: null, entry: null, lines }
  }

  const rel = join(config.members.dir, `${v.block.id}.json`)
  if (dryRun) {
    lines.push(`govstruct stamp: would write ${rel} (dry-run, no change)`)
    return { ok: true, refusals: [], wrote: null, entry: null, lines }
  }

  mkdirSync(membersDir(root, config), { recursive: true })
  // Strip the synthetic internal fields before writing.
  const { __file, __filename, ...clean } = v.block
  writeFileSync(v.target, JSON.stringify(clean, null, 2) + '\n')

  const entry = appendEntry(root, {
    verb: 'stamp',
    actor: record.actor ?? { kind: 'machine', id: 'govstruct' },
    subject: { member: v.block.id, spends: record.spends ?? [] },
    evidence: record.evidence ?? [],
    clause: record.clause ?? {},
    verdict: 'PASS',
  })

  lines.push(`govstruct stamp: wrote ${rel}`)
  lines.push(`  ledger seq ${entry.seq} (${entry.addr.slice(0, 16)}...)`)
  return { ok: true, refusals: [], wrote: rel, entry, lines }
}

export { Refusal }
