// src/refusals.mjs - the shared refusal vocabulary (PRD section 6.4, G10).
//
// The family's core law is "refusal instant and nameable." Each tool already
// names its own codes; a refusal the next tool cannot recognize is not
// portable. This module is the reader for spec/refusals.json: a namespaced
// registry (tool/E_CODE) so govstruct can report "member X refused with
// E_..." and a consumer can act on it.
//
// The registry is DATA, not a dialect. Each tool keeps its own codes and
// registers them. govstruct refuses to emit a code it has not registered -
// an unregistered code is itself a refusal (E_REFUSAL_UNREGISTERED), so the
// vocabulary cannot drift silently.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REGISTRY_PATH = join(HERE, '..', 'spec', 'refusals.json')

let _registry = null

/** Load and memoize the refusal registry. */
export function loadRegistry() {
  if (_registry) return _registry
  const raw = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'))
  if (raw.schemaVersion !== 1) {
    throw new Error(`refusals.json: schemaVersion must be 1 (got ${JSON.stringify(raw.schemaVersion)})`)
  }
  _registry = raw
  return _registry
}

/**
 * Is `code` a registered code? Accepts a bare govstruct code (E_...) or a
 * namespaced code (tool/E_...). A bare code is looked up in the govstruct
 * namespace, which is the only namespace govstruct itself emits.
 */
export function isRegistered(code) {
  const reg = loadRegistry()
  if (typeof code !== 'string' || !code) return false
  if (code.includes('/')) {
    const [ns, name] = code.split('/', 2)
    return Boolean(reg.namespaces[ns] && reg.namespaces[ns][name] !== undefined)
  }
  return Boolean(reg.namespaces.govstruct && reg.namespaces.govstruct[code] !== undefined)
}

/** The human-readable meaning of a registered code (or null). */
export function meaningOf(code) {
  const reg = loadRegistry()
  if (typeof code !== 'string' || !code) return null
  if (code.includes('/')) {
    const [ns, name] = code.split('/', 2)
    return reg.namespaces[ns]?.[name] ?? null
  }
  return reg.namespaces.govstruct?.[code] ?? null
}

/**
 * A Refusal is the one error shape govstruct emits: a registered code, a
 * one-line message, and optional context (which member, which field). It is
 * a real Error so `throw` and stack traces behave, but the code is the
 * contract - a consumer reads `err.code`, never the prose.
 */
export class Refusal extends Error {
  constructor(code, message, context = {}) {
    super(message)
    this.name = 'Refusal'
    this.code = code
    this.context = context
    if (!isRegistered(code)) {
      // The registry is the law: an unregistered code cannot be emitted.
      // Surface it as the refusal it is rather than letting it travel.
      this.code = 'E_REFUSAL_UNREGISTERED'
      this.context = { ...context, attempted: code }
      this.message = `refusal code "${code}" is not in the registry: ${message}`
    }
  }
}

/** Collect refusals without throwing (the lint/doctor accumulate-and-report shape). */
export class RefusalBag {
  constructor() {
    this.items = []
  }

  add(code, message, context = {}) {
    this.items.push(new Refusal(code, message, context))
    return this
  }

  get length() {
    return this.items.length
  }

  get ok() {
    return this.items.length === 0
  }

  /** Sorted by code then message, so a report is byte-deterministic. */
  sorted() {
    return [...this.items].sort((a, b) =>
      a.code === b.code ? a.message.localeCompare(b.message) : a.code.localeCompare(b.code),
    )
  }
}
