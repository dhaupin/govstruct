// src/migrate.mjs - the migration ritual (PRD section 8, G6).
//
// A rename and a factory move are two instances of one class: a governed
// change that touches many repos. A schema change (SPEC v2, a new required
// field) is the same class. So govstruct ships a migrations/ convention and
// `migrate --status / --dry-run`: a spec bump lands with a named, resumable
// migration, each member's progress is a row.
//
// A migration is a JSON file under migrations/:
//   { id, from, to, summary, steps: [{ member, action, status }] }
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig } from './config.mjs'
import { loadManifest } from './manifest.mjs'

function migrationsDir(root) {
  return join(root, 'migrations')
}

function readMigrations(root) {
  const dir = migrationsDir(root)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      try {
        return { file: f, ...JSON.parse(readFileSync(join(dir, f), 'utf8')) }
      } catch {
        return { file: f, invalid: true }
      }
    })
}

/** Report the state of every migration. */
export function migrateStatus(target = '.') {
  const { root, config } = loadConfig(target)
  const { manifest } = loadManifest(root, { root, config })
  const migrations = readMigrations(root)
  const lines = []
  let ok = true

  lines.push(`govstruct migrate --status: ${migrations.length} migration(s)`)
  for (const m of migrations) {
    if (m.invalid) {
      lines.push(`  INVALID ${m.file}`)
      ok = false
      continue
    }
    const steps = Array.isArray(m.steps) ? m.steps : []
    const done = steps.filter((s) => s.status === 'done').length
    const pending = steps.length - done
    lines.push(`  ${m.id} (${m.from} -> ${m.to}): ${done}/${steps.length} done${pending ? `, ${pending} pending` : ''}`)
    for (const s of steps.filter((s) => s.status !== 'done')) {
      lines.push(`    pending: ${s.member} - ${s.action}`)
    }
    // A migration step naming a member absent from the roster is a refusal.
    for (const s of steps) {
      if (!manifest.members.some((mm) => mm.id === s.member)) {
        lines.push(`    REFUSED [E_SUITE_DRIFT]: step names unknown member "${s.member}"`)
        ok = false
      }
    }
  }
  return { ok, migrations: migrations.length, lines }
}

/** Preview a migration: what each step would do, nothing written. */
export function migrateDryRun(target = '.') {
  const { root, config } = loadConfig(target)
  const { manifest } = loadManifest(root, { root, config })
  const migrations = readMigrations(root)
  const lines = []
  let ok = true

  lines.push('govstruct migrate --dry-run: no changes written')
  for (const m of migrations) {
    if (m.invalid) {
      lines.push(`  INVALID ${m.file}`)
      ok = false
      continue
    }
    const steps = Array.isArray(m.steps) ? m.steps : []
    lines.push(`  ${m.id}: would apply ${steps.filter((s) => s.status !== 'done').length} step(s)`)
    for (const s of steps) {
      const known = manifest.members.some((mm) => mm.id === s.member)
      lines.push(`    ${s.status === 'done' ? 'done ' : known ? 'apply' : 'REFUSE'} ${s.member}: ${s.action}`)
      if (!known && s.status !== 'done') ok = false
    }
  }
  return { ok, migrations: migrations.length, lines }
}
