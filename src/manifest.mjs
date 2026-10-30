// src/manifest.mjs - the suite manifest: load member blocks, validate the
// grammar, compose apps.json (PRD sections 4 and 6).
//
// The manifest is the payload. Members are data, never code: adding member
// 24 is a block file plus a doctor run, never a PRD edit. This module is the
// single place the grammar is defined, so lint, render, doctor, and check
// all read the same truth.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'
import { Refusal, RefusalBag } from './refusals.mjs'
import { membersDir, complianceDir, resolveIn } from './config.mjs'

export const ROLES = ['arm', 'forge', 'factory', 'composer', 'product', 'component']
export const STATUSES = ['Live', 'Beta', 'In Development', 'Backburner', 'Archived', 'Tombstoned']
export const SECTIONS = ['open-source', 'proprietary', 'other']
// G5: the governed credential kinds a member's stamps may spend. A kind
// outside this list is a refusal (a stamp cannot widen a wall by inventing
// a credential class).
export const GRANT_KINDS = ['github', 'npm', 'domain', 'registry', 'dns', 'cloud', 'secret']

const KEBAB = /^[a-z0-9][a-z0-9-]*$/
const REQUIRED = ['id', 'name', 'role', 'status', 'section', 'blurb', 'icon', 'order']

/**
 * Load every member block in the members directory. Returns
 * { blocks, bag } where blocks are raw parsed objects (with a synthetic
 * `__file` naming the source) and bag carries the load-level refusals.
 * A malformed file is a refusal, never a thrown crash: lint reports all.
 */
export function loadMemberBlocks(root, config) {
  const dir = membersDir(root, config)
  const bag = new RefusalBag()
  const blocks = []
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    bag.add('E_MEMBERS_DIR_MISSING', `members directory does not exist: ${config.members.dir}`)
    return { blocks, bag, dir }
  }
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
  for (const f of files) {
    const path = join(dir, f)
    let raw
    try {
      raw = JSON.parse(readFileSync(path, 'utf8'))
    } catch (e) {
      bag.add('E_MEMBER_INVALID_JSON', `member block ${f} is not valid JSON: ${e.message}`, { file: f })
      continue
    }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      bag.add('E_MEMBER_INVALID_JSON', `member block ${f} must be a JSON object`, { file: f })
      continue
    }
    raw.__file = f
    raw.__filename = basename(f, '.json')
    blocks.push(raw)
  }
  return { blocks, bag, dir }
}

/** Validate one member block's grammar into the bag. */
export function validateBlock(block, bag) {
  const file = block.__file
  const where = { file, id: block.id }

  for (const field of REQUIRED) {
    if (block[field] === undefined) {
      bag.add('E_FIELD_MISSING', `${file}: required field "${field}" is missing`, where)
    }
  }

  if (block.id === undefined) {
    bag.add('E_ID_MISSING', `${file}: member block has no id`, { file })
  } else if (typeof block.id !== 'string' || !KEBAB.test(block.id)) {
    bag.add('E_ID_FORMAT', `${file}: id must be kebab-case (got ${JSON.stringify(block.id)})`, where)
  } else if (block.id !== block.__filename) {
    bag.add('E_ID_MISMATCH', `${file}: id "${block.id}" does not match filename "${block.__filename}"`, where)
  }

  if (block.role !== undefined && !ROLES.includes(block.role)) {
    bag.add('E_ROLE_UNKNOWN', `${file}: role must be one of ${ROLES.join(' | ')} (got ${JSON.stringify(block.role)})`, where)
  }
  if (block.status !== undefined && !STATUSES.includes(block.status)) {
    bag.add('E_STATUS_UNKNOWN', `${file}: status must be one of ${STATUSES.join(' | ')} (got ${JSON.stringify(block.status)})`, where)
  }
  if (block.section !== undefined && !SECTIONS.includes(block.section)) {
    bag.add('E_SECTION_UNKNOWN', `${file}: section must be one of ${SECTIONS.join(' | ')} (got ${JSON.stringify(block.section)})`, where)
  }

  for (const field of ['name', 'blurb', 'icon']) {
    if (block[field] !== undefined && (typeof block[field] !== 'string' || !block[field].trim())) {
      bag.add('E_FIELD_EMPTY', `${file}: "${field}" must be a non-empty string`, where)
    }
  }

  if (block.url !== undefined && block.url !== null) {
    if (typeof block.url !== 'string' || !/^https:\/\/[^\s]+$/.test(block.url)) {
      bag.add('E_URL_FORMAT', `${file}: url must be an absolute https url (got ${JSON.stringify(block.url)})`, where)
    }
  }

  if (block.repo !== undefined && block.repo !== null) {
    if (typeof block.repo !== 'string' || !/^[^/\s]+\/[^/\s]+$/.test(block.repo)) {
      bag.add('E_FIELD_TYPE', `${file}: repo must be "owner/name" or null (got ${JSON.stringify(block.repo)})`, where)
    }
  }

  if (block.order !== undefined && (!Number.isInteger(block.order) || block.order < 0)) {
    bag.add('E_FIELD_TYPE', `${file}: order must be a non-negative integer (got ${JSON.stringify(block.order)})`, where)
  }

  if (block.aliases !== undefined) {
    if (!Array.isArray(block.aliases)) {
      bag.add('E_FIELD_TYPE', `${file}: aliases must be an array`, where)
    } else {
      for (const a of block.aliases) {
        if (typeof a !== 'string' || !KEBAB.test(a)) {
          bag.add('E_FIELD_TYPE', `${file}: alias must be kebab-case (got ${JSON.stringify(a)})`, where)
        } else if (a === block.id) {
          bag.add('E_ALIAS_SELF', `${file}: alias "${a}" is the member's own id`, where)
        }
      }
    }
  }

  for (const edge of ['needs', 'grants']) {
    if (block[edge] !== undefined && !Array.isArray(block[edge])) {
      bag.add('E_FIELD_TYPE', `${file}: ${edge} must be an array`, where)
    }
  }

  if (block.needs !== undefined && Array.isArray(block.needs)) {
    for (const n of block.needs) {
      if (!n || typeof n !== 'object' || typeof n.id !== 'string' || !KEBAB.test(n.id)) {
        bag.add('E_FIELD_TYPE', `${file}: each needs entry must be { id, floor? } with a kebab-case id`, where)
      }
    }
  }

  if (block.grants !== undefined && Array.isArray(block.grants)) {
    const seen = new Set()
    for (const g of block.grants) {
      if (!g || typeof g !== 'object' || typeof g.kind !== 'string' || !g.kind.trim()) {
        bag.add('E_FIELD_TYPE', `${file}: each grants entry must be { kind, scope } with a non-empty kind`, where)
        continue
      }
      if (!GRANT_KINDS.includes(g.kind)) {
        bag.add('E_GRANT_UNKNOWN_KIND', `${file}: grant kind "${g.kind}" is outside the governed vocabulary (${GRANT_KINDS.join(' | ')})`, where)
      }
      if (typeof g.scope !== 'string' || !g.scope.trim()) {
        bag.add('E_GRANT_SCOPE_EMPTY', `${file}: grant "${g.kind}" must carry a non-empty scope`, where)
        continue
      }
      const key = `${g.kind}\u0000${g.scope}`
      if (seen.has(key)) {
        bag.add('E_GRANT_DUPLICATE', `${file}: grant ${g.kind}/${g.scope} is listed twice`, where)
      }
      seen.add(key)
    }
  }

  // G7: a tombstone with no alias and no history is a lie about a member
  // that never existed. A tombstone must keep a forwarding alias.
  if (block.status === 'Tombstoned') {
    const aliases = Array.isArray(block.aliases) ? block.aliases : []
    if (aliases.length === 0) {
      bag.add('E_TOMBSTONE_EMPTY', `${file}: a Tombstoned member must carry at least one alias (never a 404)`, where)
    }
  }
}

/**
 * Validate the whole roster: uniqueness, order collisions, aliases, home,
 * and the dependency graph (G3). Returns the composed manifest on success.
 */
export function composeManifest(blocks, bag) {
  const byId = new Map()
  const byUrl = new Map()
  const byAlias = new Map()
  const orderKeys = new Map()

  for (const b of blocks) {
    if (typeof b.id === 'string') {
      if (byId.has(b.id)) {
        bag.add('E_ID_DUPLICATE', `id "${b.id}" is declared twice (${byId.get(b.id).__file} and ${b.__file})`, { id: b.id })
      } else {
        byId.set(b.id, b)
      }
    }
    if (typeof b.url === 'string') {
      if (byUrl.has(b.url)) {
        bag.add('E_URL_DUPLICATE', `url "${b.url}" is shared by "${byUrl.get(b.url)}" and "${b.id}"`, { id: b.id })
      } else {
        byUrl.set(b.url, b.id)
      }
    }
    if (Array.isArray(b.aliases)) {
      for (const a of b.aliases) {
        if (typeof a !== 'string') continue
        if (byAlias.has(a)) {
          bag.add('E_ALIAS_DUPLICATE', `alias "${a}" is declared by both "${byAlias.get(a)}" and "${b.id}"`, { id: b.id })
        } else {
          byAlias.set(a, b.id)
        }
      }
    }
    if (Number.isInteger(b.order)) {
      const key = String(b.order)
      if (orderKeys.has(key)) {
        bag.add('E_ORDER_COLLISION', `order ${b.order} collides (${orderKeys.get(key)} and ${b.id})`, { id: b.id })
      } else {
        orderKeys.set(key, b.id)
      }
    }
  }

  // An alias must not collide with a live id.
  for (const [alias, owner] of byAlias) {
    if (byId.has(alias) && byId.get(alias).id !== owner) {
      bag.add('E_ALIAS_DUPLICATE', `alias "${alias}" (of "${owner}") collides with the live member "${alias}"`, { id: owner })
    }
  }

  // home and needs must name known members.
  for (const b of blocks) {
    if (typeof b.home === 'string' && b.home && !byId.has(b.home)) {
      bag.add('E_HOME_UNKNOWN', `${b.__file}: home "${b.home}" is not a member in the roster`, { id: b.id })
    }
    if (Array.isArray(b.needs)) {
      for (const n of b.needs) {
        if (!n || typeof n.id !== 'string') continue
        if (n.id === b.id) {
          bag.add('E_NEEDS_SELF', `${b.__file}: member depends on itself`, { id: b.id })
        } else if (!byId.has(n.id)) {
          bag.add('E_NEEDS_UNKNOWN', `${b.__file}: needs "${n.id}" which is not a member in the roster`, { id: b.id })
        }
      }
    }
  }

  // G3: topo-sort; refuse a cycle.
  const order = topoSort(blocks, bag)

  const members = [...byId.values()]
    .map((b) => stripInternal(b))
    .sort((a, b) => (a.order - b.order) || a.id.localeCompare(b.id))

  return { members, order, byId }
}

/** Kahn topological sort over needs[] edges; a leftover node is a cycle. */
export function topoSort(blocks, bag) {
  const ids = new Set(blocks.filter((b) => typeof b.id === 'string').map((b) => b.id))
  const indeg = new Map([...ids].map((id) => [id, 0]))
  const out = new Map([...ids].map((id) => [id, []]))
  for (const b of blocks) {
    if (!Array.isArray(b.needs)) continue
    for (const n of b.needs) {
      if (!n || !ids.has(n.id) || n.id === b.id) continue
      out.get(n.id).push(b.id)
      indeg.set(b.id, indeg.get(b.id) + 1)
    }
  }
  const queue = [...ids].filter((id) => indeg.get(id) === 0).sort()
  const order = []
  while (queue.length) {
    const id = queue.shift()
    order.push(id)
    for (const next of out.get(id).sort()) {
      indeg.set(next, indeg.get(next) - 1)
      if (indeg.get(next) === 0) queue.push(next)
    }
    queue.sort()
  }
  if (order.length !== ids.size) {
    const cyclic = [...ids].filter((id) => !order.includes(id)).sort()
    bag.add('E_NEEDS_CYCLE', `dependency cycle among: ${cyclic.join(', ')}`)
  }
  return order
}

function stripInternal(b) {
  const { __file, __filename, ...rest } = b
  return rest
}

/**
 * Load + validate + compose in one call. Returns
 * { manifest, bag, dir, complianceDir }.
 */
export function loadManifest(target = '.', { root, config } = {}) {
  if (!root || !config) {
    const c = loadConfigSafe(target)
    root = c.root
    config = c.config
  }
  const { blocks, bag } = loadMemberBlocks(root, config)
  for (const b of blocks) validateBlock(b, bag)
  const { members, order } = composeManifest(blocks, bag)
  const manifest = {
    schemaVersion: 1,
    family: config.family ?? { name: 'family' },
    memberCount: members.length,
    order,
    members,
  }
  return { manifest, bag, dir: membersDir(root, config), complianceDir: complianceDir(root, config), root, config }
}

// Local import to avoid a cycle at module top (config -> refusals only).
import { loadConfig } from './config.mjs'
function loadConfigSafe(target) {
  return loadConfig(target)
}

export { resolveIn }
