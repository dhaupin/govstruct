// src/audit.mjs - the audit ledger (PRD section 19, G14).
//
// One append-only, content-addressed ledger. Every governance action
// appends exactly one entry. Each entry is addressed by the sha256 of its
// own body and chains to the previous entry's hash, so the ledger is
// tamper-evident: you cannot rewrite or remove history without breaking
// the chain. This is vant's traveler pattern lifted from one subsystem to
// the whole suite.
//
// `audit verify` walks the chain from seq 1 with no secret, no operator
// trust, no network - the same posture as the doctor.
import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { loadConfig } from './config.mjs'

export const LEDGER_PATH = 'labs/audit-ledger.jsonl'

/** The address of an entry body: sha256 over the canonical JSON. */
export function entryAddress(body) {
  return 'sha256:' + createHash('sha256').update(canonical(body)).digest('hex')
}

/**
 * Canonical JSON: object keys sorted RECURSIVELY, array order preserved.
 * A shallow key sort (JSON.stringify's replacer form) drops nested keys
 * entirely - `{verdicts:[{verdict:'REFUSED'}]}` would hash as
 * `{"verdicts":[{}]}`, so a rewritten verdict row or actor id would not
 * move the address and tamper-evidence would be a lie. The deep form
 * covers every byte of the body.
 */
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']'
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((k) => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}'
  }
  return JSON.stringify(value) ?? 'null'
}

/** Read the ledger as an array of parsed entries (empty when absent). */
export function readLedger(root) {
  const p = join(root, LEDGER_PATH)
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

/**
 * Append one entry to the ledger. Returns the written entry (with seq,
 * prev, and addr filled in). The entry body is everything except `addr`;
 * the address is the sha256 of the body.
 */
export function appendEntry(root, entry) {
  const ledger = readLedger(root)
  const prev = ledger.length ? ledger[ledger.length - 1].addr : null
  const seq = ledger.length + 1
  const body = {
    seq,
    prev,
    at: entry.at ?? new Date().toISOString(),
    verb: entry.verb,
    actor: entry.actor ?? { kind: 'ci', id: 'govstruct' },
    subject: entry.subject ?? {},
    evidence: entry.evidence ?? [],
    clause: entry.clause ?? {},
    verdict: entry.verdict ?? 'PASS',
  }
  const addr = entryAddress(body)
  const full = { ...body, addr }
  mkdirSync(join(root, 'labs'), { recursive: true })
  appendFileSync(join(root, LEDGER_PATH), JSON.stringify(full) + '\n')
  return full
}

/**
 * Verify the chain. Returns { ok, checked, refusals, lines }. The four
 * audit questions a stranger can answer offline: what changed, who
 * authorized it, on what evidence, within the rules.
 */
export function auditVerify(root) {
  const ledger = readLedger(root)
  const lines = []
  const refusals = []

  if (ledger.length === 0) {
    lines.push('govstruct audit verify: ledger is empty (nothing to verify)')
    return { ok: true, checked: 0, refusals, lines }
  }

  lines.push(`govstruct audit verify: walking ${ledger.length} entr(ies)`)
  let prevAddr = null
  for (let i = 0; i < ledger.length; i++) {
    const e = ledger[i]
    if (e.__invalid) {
      refusals.push(`E_LEDGER_TAMPER line ${e.__line}: not valid JSON`)
      continue
    }
    // seq is monotonic.
    if (e.seq !== i + 1) {
      refusals.push(`E_LEDGER_SEQ_GAP seq ${e.seq} at line ${i + 1} (expected ${i + 1})`)
    }
    // prev links form an unbroken chain.
    if (e.prev !== prevAddr) {
      refusals.push(`E_LEDGER_BROKEN entry ${e.seq}: prev ${e.prev} does not link to ${prevAddr}`)
    }
    // content hash matches the address.
    const { addr, ...body } = e
    const recomputed = entryAddress(body)
    if (recomputed !== addr) {
      refusals.push(`E_LEDGER_TAMPER entry ${e.seq}: address ${addr} does not match body ${recomputed}`)
    }
    prevAddr = e.addr
  }

  for (const r of refusals) lines.push(`  REFUSED [${r.split(' ')[0]}]: ${r.slice(r.indexOf(' ') + 1)}`)
  if (refusals.length === 0) lines.push('  ok   chain intact; history is verifiable offline')
  return { ok: refusals.length === 0, checked: ledger.length, refusals, lines }
}
