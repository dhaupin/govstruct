// src/lint.mjs - the lint verb: manifest grammar (PRD section 6).
//
// lint is the immediate payoff: it kills the "manifest declares a member
// that does not exist / two members share an order / the url is not https"
// class at author time, in any family. It reads the member blocks, validates
// the grammar, composes the manifest, and reports every refusal by code.
//
// Offline by default (G11): lint never opens a socket. Resolvability is the
// doctor's opt-in online pass.
import { loadConfig } from './config.mjs'
import { loadManifest } from './manifest.mjs'
import { isRegistered, meaningOf, Refusal } from './refusals.mjs'

/**
 * Run lint over the family rooted at `target`. Returns
 * { ok, refusals, manifest, memberCount } - never throws on a bad family
 * (a refusal is data the caller reports, not a crash).
 */
export function lint(target = '.') {
  let manifest
  let bag
  try {
    const loaded = loadManifest(target)
    manifest = loaded.manifest
    bag = loaded.bag
  } catch (e) {
    // A load-level refusal (missing config, missing members dir) is data,
    // not a crash: lint reports it like any other refusal.
    const r = e instanceof Refusal ? e : new Refusal('E_CONFIG_INVALID', e.message)
    return { ok: false, refusals: [r], manifest: { members: [], memberCount: 0, order: [] }, memberCount: 0 }
  }
  // Every refusal must carry a registered code (the registry is the law).
  for (const r of bag.items) {
    if (!isRegistered(r.code)) {
      bag.add('E_REFUSAL_UNREGISTERED', `lint emitted unregistered code ${r.code}`)
    }
  }
  return {
    ok: bag.ok,
    refusals: bag.sorted(),
    manifest,
    memberCount: manifest.memberCount,
  }
}

/** Format lint refusals for the human report (one line per refusal). */
export function formatRefusals(refusals) {
  return refusals.map((r) => `  REFUSED [${r.code}]: ${r.message}`).join('\n')
}

export { meaningOf, loadConfig }
