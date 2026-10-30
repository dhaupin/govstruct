// src/grants.mjs - credential delegation (PRD section 10 S6, G5).
//
// The scariest surface for an agent-minted world: an agent that can mint a
// repo can also spend any credential the minting process holds. The wall is
// a member's grants[] - the credential kinds and scopes its stamps may
// spend. A spend absent from the list is refused (E_GRANT_UNLISTED): a
// stamp cannot widen a wall.
//
// This module is pure: it reads a member block's grants[] and answers
// whether a proposed spend is covered. The ledger row is the caller's job
// (stamp.mjs), so the check stays offline and byte-deterministic.
import { Refusal } from './refusals.mjs'

/**
 * Does `member`'s grants[] cover the spend { kind, scope }? Returns
 * { ok, refusal }. Scope matching is exact-or-wildcard: a grant scope of
 * "*" covers any scope of that kind; otherwise the scopes must match.
 */
export function coversGrant(member, spend) {
  const grants = Array.isArray(member?.grants) ? member.grants : []
  const kind = spend?.kind
  const scope = spend?.scope
  if (typeof kind !== 'string' || !kind.trim() || typeof scope !== 'string' || !scope.trim()) {
    return { ok: false, refusal: new Refusal('E_STAMP_INVALID', 'a spend must be { kind, scope } with non-empty strings') }
  }
  const hit = grants.find((g) => g && g.kind === kind && (g.scope === '*' || g.scope === scope))
  if (hit) return { ok: true, refusal: null }
  return {
    ok: false,
    refusal: new Refusal(
      'E_GRANT_UNLISTED',
      `member "${member?.id ?? '?'}" may not spend ${kind}/${scope}: not in its grants list`,
      { id: member?.id, kind, scope },
    ),
  }
}

/** Check every spend in a list against a member's grants[]. Returns a RefusalBag-like list. */
export function checkSpends(member, spends) {
  const refusals = []
  for (const s of Array.isArray(spends) ? spends : []) {
    const r = coversGrant(member, s)
    if (!r.ok) refusals.push(r.refusal)
  }
  return refusals
}
