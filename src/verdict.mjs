// src/verdict.mjs - the verdict bus (PRD section 7.2, G4).
//
// The self-proof the arms provide is a PULL: the suite polls every member at
// a pinned rev, so the roll-up is only as fresh as the last cron and a member
// that ships tells nobody. This module adds the other direction - a PUSH.
//
// A member's CI emits a status receipt on green. The receipt is the ledger
// pattern one level up: append-only, content-addressed, chained to its
// predecessor, so it is tamper-evident and verifiable offline with no secret
// and no network (the doctor's posture). It names the member, the rev, the
// verdicts, and the refusal codes - portable because the vocabulary is shared
// (G10).
//
// The roll-up reads receipts when fresh and falls back to polling the
// manifest's declared state when not, so "the suite is green right now" is a
// fact, not a cache age.
import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig } from './config.mjs'
import { loadManifest } from './manifest.mjs'
import { entryAddress } from './audit.mjs'
import { RefusalBag, isRegistered } from './refusals.mjs'

export const RECEIPT_PATH = 'labs/receipts.jsonl'
export const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000

// The verdict vocabulary is the family's (crashtest's status emitter, the
// family-status@1 dialect): a receipt's rows carry these. Any other value
// degrades the member to RED - never a fake green.
export const PASS_VERDICTS = ['REFUSED', 'PASSED', 'BOUNDED']

/** Read the receipt log as parsed entries (empty when absent). */
export function readReceipts(root) {
  const p = join(root, RECEIPT_PATH)
  if (!existsSync(p)) return []
  return readFileSync(p, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l, i) => {
      try {
        return JSON.parse(l)
      } catch (e) {
        return { __invalid: true, __line: i + 1, __error: e.message }
      }
    })
}

/** Validate a receipt body without writing it. Returns a RefusalBag. */
export function validateReceipt(body, { roster = null } = {}) {
  const bag = new RefusalBag()
  const where = { member: body?.member }
  if (!body || typeof body !== 'object') {
    bag.add('E_RECEIPT_INVALID', 'a receipt must be an object', where)
    return bag
  }
  if (typeof body.member !== 'string' || !body.member) {
    bag.add('E_RECEIPT_INVALID', 'a receipt needs a member id', where)
  } else if (roster && !roster.has(body.member)) {
    bag.add('E_RECEIPT_UNKNOWN_MEMBER', `receipt names member "${body.member}" which is not in the roster`, where)
  }
  if (typeof body.rev !== 'string' || !body.rev) {
    bag.add('E_RECEIPT_INVALID', 'a receipt needs a rev', where)
  }
  if (!Array.isArray(body.verdicts)) {
    bag.add('E_RECEIPT_INVALID', 'a receipt needs a verdicts array', where)
  } else {
    for (const v of body.verdicts) {
      if (!v || typeof v.name !== 'string' || !v.name) {
        bag.add('E_RECEIPT_INVALID', 'each verdict row needs a name', where)
      } else if (typeof v.verdict !== 'string' || !v.verdict) {
        bag.add('E_RECEIPT_INVALID', `verdict row "${v.name}" needs a verdict`, where)
      }
    }
  }
  if (body.refusals !== undefined) {
    if (!Array.isArray(body.refusals)) {
      bag.add('E_RECEIPT_INVALID', 'refusals must be an array of codes', where)
    } else {
      for (const code of body.refusals) {
        // A receipt is portable only if the vocabulary is shared (G10): a
        // code the registry does not name cannot travel.
        if (!isRegistered(code)) {
          bag.add('E_RECEIPT_INVALID', `receipt carries an unregistered refusal code "${code}"`, where)
        }
      }
    }
  }
  return bag
}

/** Is a receipt's verdict set green (every row in the pass vocabulary)? */
export function isGreen(receipt) {
  if (!Array.isArray(receipt?.verdicts)) return false
  return receipt.verdicts.every((v) => PASS_VERDICTS.includes(v.verdict))
}

/**
 * Append one receipt to the log. Returns { ok, entry, refusals, lines }.
 * Never overwrites: the log is append-only and each entry chains to its
 * predecessor, so history cannot be rewritten without breaking the chain.
 */
export function emitReceipt(root, receipt, { at } = {}) {
  const { config } = loadConfig(root)
  const { manifest } = loadManifest(root, { root, config })
  const roster = new Set(manifest.members.map((m) => m.id))
  const bag = validateReceipt(receipt, { roster })
  const lines = []
  if (!bag.ok) {
    for (const r of bag.sorted()) lines.push(`  REFUSED [${r.code}]: ${r.message}`)
    return { ok: false, entry: null, refusals: bag.sorted(), lines }
  }

  const log = readReceipts(root)
  const prev = log.length ? log[log.length - 1].addr : null
  const body = {
    seq: log.length + 1,
    prev,
    at: at ?? new Date().toISOString(),
    member: receipt.member,
    rev: receipt.rev,
    verdicts: receipt.verdicts.map((v) => ({ name: v.name, verdict: v.verdict })),
    refusals: receipt.refusals ?? [],
    actor: receipt.actor ?? { kind: 'ci', id: 'govstruct' },
  }
  const entry = { ...body, addr: entryAddress(body) }
  mkdirSync(join(root, 'labs'), { recursive: true })
  appendFileSync(join(root, RECEIPT_PATH), JSON.stringify(entry) + '\n')
  lines.push(`govstruct verdict emit: seq ${entry.seq} ${entry.member}@${entry.rev} (${entry.addr})`)
  return { ok: true, entry, refusals: [], lines }
}

/**
 * Verify the receipt chain offline. Returns { ok, checked, refusals, lines }.
 */
export function verifyReceipts(root) {
  const log = readReceipts(root)
  const refusals = []
  const lines = []
  if (log.length === 0) {
    lines.push('govstruct verdict verify: receipt log is empty (nothing to verify)')
    return { ok: true, checked: 0, refusals, lines }
  }
  lines.push(`govstruct verdict verify: walking ${log.length} receipt(s)`)
  let prevAddr = null
  for (let i = 0; i < log.length; i++) {
    const e = log[i]
    if (e.__invalid) {
      refusals.push(`E_RECEIPT_TAMPER line ${e.__line}: not valid JSON`)
      continue
    }
    if (e.seq !== i + 1) refusals.push(`E_RECEIPT_CHAIN seq ${e.seq} at line ${i + 1} (expected ${i + 1})`)
    if (e.prev !== prevAddr) refusals.push(`E_RECEIPT_CHAIN entry ${e.seq}: prev ${e.prev} does not link to ${prevAddr}`)
    const { addr, ...body } = e
    if (entryAddress(body) !== addr) refusals.push(`E_RECEIPT_TAMPER entry ${e.seq}: address does not match body`)
    prevAddr = e.addr
  }
  for (const r of refusals) lines.push(`  REFUSED [${r.split(' ')[0]}]: ${r.slice(r.indexOf(' ') + 1)}`)
  if (refusals.length === 0) lines.push('  ok   chain intact; receipts are verifiable offline')
  return { ok: refusals.length === 0, checked: log.length, refusals, lines }
}

/** The latest receipt per member (by seq). */
export function latestByMember(log = []) {
  const out = new Map()
  for (const e of log) {
    if (e.__invalid || !e.member) continue
    const cur = out.get(e.member)
    if (!cur || e.seq >= cur.seq) out.set(e.member, e)
  }
  return out
}

/**
 * The roll-up: read receipts when fresh, fall back to polling the manifest's
 * declared state when not. Returns { ok, members, refusals, lines, fresh,
 * polled }. `now` and `maxAgeMs` are injectable so the report is
 * byte-deterministic under test.
 */
export function verdictRollup(root, { maxAgeMs = DEFAULT_MAX_AGE_MS, now = Date.now() } = {}) {
  const { config } = loadConfig(root)
  const { manifest, bag: loadBag } = loadManifest(root, { root, config })
  const refusals = []
  const lines = []
  const latest = latestByMember(readReceipts(root))
  const members = []
  let fresh = 0
  let polled = 0
  let red = 0

  for (const m of manifest.members) {
    const r = latest.get(m.id)
    if (r) {
      const ageMs = now - Date.parse(r.at)
      const stale = !Number.isFinite(ageMs) || ageMs > maxAgeMs
      if (!stale) {
        fresh += 1
        const green = isGreen(r)
        if (!green) red += 1
        members.push({ id: m.id, source: 'receipt', fresh: true, rev: r.rev, verdict: green ? 'GREEN' : 'RED', ageMs, refusals: r.refusals ?? [] })
        continue
      }
      lines.push(`  STALE ${m.id}: receipt at ${r.at} is older than ${Math.round(maxAgeMs / 1000)}s - polling`)
    }
    polled += 1
    members.push({ id: m.id, source: 'polled', fresh: false, status: m.status, verdict: 'UNKNOWN' })
  }

  for (const r of loadBag.sorted()) refusals.push(r)
  lines.push(`govstruct verdict rollup: ${manifest.memberCount} member(s), ${fresh} fresh receipt(s), ${polled} polled, ${red} red`)
  for (const m of members) {
    lines.push(`  ${m.source === 'receipt' ? (m.verdict === 'GREEN' ? 'ok  ' : 'FAIL') : 'POLL'} ${m.id}: ${m.source}${m.rev ? `@${m.rev}` : ''} ${m.verdict}`)
  }
  for (const r of refusals) lines.push(`  REFUSED [${r.code}]: ${r.message}`)
  return {
    ok: refusals.length === 0 && red === 0,
    members, refusals, lines,
    fresh, polled, red,
  }
}
