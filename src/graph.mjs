// src/graph.mjs - the dependency graph (PRD section 6.3, G3).
//
// Members depend on members (govstruct -> packstruct; coreforge ->
// prestruct + poststruct). The manifest carries those edges as needs[].
// Topo-sort and cycle refusal live in manifest.mjs; this module is the
// other half the PRD promises: the roll-up renders the graph, and a bump
// walks it to every dependent.
//
// The propagation path is the point. When a member's floor moves, the
// question a maintainer actually asks is "who does this touch?" - the
// reverse closure over needs[]. A dependent list is a fact about the
// manifest, so it is derived, never hand-maintained.
import { Refusal } from './refusals.mjs'

/** Adjacency: id -> the ids it needs (forward edges, deduped). */
export function buildGraph(manifest) {
  const ids = new Set(manifest.members.map((m) => m.id))
  const needs = new Map()
  const dependents = new Map([...ids].map((id) => [id, []]))
  for (const m of manifest.members) {
    const out = []
    for (const n of Array.isArray(m.needs) ? m.needs : []) {
      if (n && typeof n.id === 'string' && ids.has(n.id) && n.id !== m.id) out.push(n.id)
    }
    needs.set(m.id, [...new Set(out)].sort())
    for (const dep of needs.get(m.id)) dependents.get(dep).push(m.id)
  }
  for (const [, list] of dependents) list.sort()
  return { needs, dependents }
}

/**
 * Who depends on `id`, directly and transitively (the propagation path).
 * Returns { id, direct, transitive } or throws a nameable Refusal when the
 * id is not a member.
 */
export function impact(manifest, id) {
  const { dependents } = buildGraph(manifest)
  if (!dependents.has(id)) {
    throw new Refusal('E_IMPACT_UNKNOWN_MEMBER', `no member "${id}" in the roster`, { id })
  }
  const direct = dependents.get(id)
  const seen = new Set()
  const queue = [...direct]
  while (queue.length) {
    const next = queue.shift()
    if (seen.has(next)) continue
    seen.add(next)
    for (const d of dependents.get(next) ?? []) if (!seen.has(d)) queue.push(d)
  }
  return { id, direct, transitive: [...seen].sort() }
}

/**
 * A stable text rendering of the graph: one line per member, its needs
 * sorted, and a reverse "needed by" line. Byte-deterministic, so it can be
 * a roll-up surface.
 */
export function renderGraph(manifest) {
  const { needs, dependents } = buildGraph(manifest)
  const lines = []
  for (const id of manifest.order) {
    const n = needs.get(id) ?? []
    const d = dependents.get(id) ?? []
    lines.push(`${id}: needs [${n.join(', ')}] needed-by [${d.join(', ')}]`)
  }
  return lines.join('\n') + '\n'
}
