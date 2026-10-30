#!/usr/bin/env node
// bin/cli.mjs - the govstruct CLI, zero dependencies.
//
//   govstruct lint                 # manifest grammar
//   govstruct render <target>      # react | partial | readme | registry
//   govstruct doctor [--suite] [--fleet]  adopter checksum gate, suite-wide truth battery, or the fleet drift meter
//   govstruct check                # the compliance shape packs
//   govstruct registry             # the suite roll-up (env / pins / floors / versions)
//   govstruct lock                 # archive + sha256 receipt
//   govstruct names <id>           # check a candidate id against npm, GitHub, the roster
//   govstruct migrate              # --status / --dry-run a spec or field migration
//   govstruct init [<dir>]         # scaffold a one-member family
//   govstruct audit verify         # walk the audit ledger chain
//
// Exit contract: 0 all checks honored, 1 any refusal, 2 usage error - the
// same ladder packstruct and crashtest use.
import { lint, formatRefusals } from '../src/lint.mjs'
import * as fsMod from 'node:fs'
import * as pathMod from 'node:path'
import { loadConfig } from '../src/config.mjs'
import { loadManifest } from '../src/manifest.mjs'
import { SURFACES, renderRegistry, manifestChecksum } from '../src/render.mjs'
import { renderSurface, writeSurfaces, surfaceDrift, writeVersionedRollup } from '../src/surfaces.mjs'
import { doctor, doctorSuite, doctorOnline } from '../src/doctor.mjs'
import { fleetMeter } from '../src/fleet.mjs'
import { adopterGate } from '../src/adopters.mjs'
import { runChecks } from '../src/check.mjs'
import { suiteRegistry } from '../src/registry.mjs'
import { lock } from '../src/lock.mjs'
import { names } from '../src/names.mjs'
import { migrateStatus, migrateDryRun } from '../src/migrate.mjs'
import { init } from '../src/init.mjs'
import { auditVerify, appendEntry } from '../src/audit.mjs'
import { stamp } from '../src/stamp.mjs'
import { retire } from '../src/lifecycle.mjs'
import { emitReceipt, verifyReceipts, verdictRollup } from '../src/verdict.mjs'
import { Refusal } from '../src/refusals.mjs'
import { impact } from '../src/graph.mjs'

const argv = process.argv.slice(2)
const verb = argv[0] ?? 'help'
const rest = argv.slice(1)
const json = rest.includes('--json')

const usage = () => {
  console.error(`Usage: govstruct <verb> [options]

  lint                 validate the manifest grammar
  render <target>      emit react | partial | readme | registry
  doctor [--suite] [--fleet] [--adopters] [--network]  adopter checksum gate, suite battery, fleet drift meter, adopter pin gate, or the online leg
  check                run the compliance shape packs
  registry             emit the suite roll-up (env / pins / floors / versions)
  lock                 archive + sha256 receipt
  names <id>           check a candidate id against npm, GitHub, and the roster
  migrate --status     report migration state
  migrate --dry-run    preview a migration
  init [<dir>]         scaffold a one-member family
  stamp <record.json>  register a stamped member (write path, G1)
  retire <id>          tombstone a member, keeping its aliases (G7)
  audit verify         walk the audit ledger chain
  verdict emit <file>  push a member's status receipt (verdict bus, G4)
  verdict verify       walk the receipt chain offline
  verdict rollup       read fresh receipts, poll the rest
  impact <id>          the propagation path: who depends on <id>

Global: --json for machine output; --network to allow socket checks.`)
}

function usageError(msg) {
  if (msg) console.error(msg)
  usage()
  process.exit(2)
}

// Reject unknown leading-dash flags so a typo never silently changes mode.
function rejectUnknownFlags(args, known) {
  for (const a of args) {
    if (a.startsWith('-') && !known.includes(a)) usageError(`unknown flag "${a}" (have: ${known.join(', ')})`)
  }
}

/** The value that follows `flag` in args, or null. */
function flagValue(args, flag) {
  const i = args.indexOf(flag)
  return i >= 0 ? (args[i + 1] ?? null) : null
}

/** Is `a` the value consumed by `flag` (so it is not the target dir)? */
function isFlagValue(args, flag, a) {
  const i = args.indexOf(flag)
  return i >= 0 && args[i + 1] === a
}

/**
 * Resolve per-member checkout paths under a fleet root. `--fleet-root <dir>`
 * names a directory whose `<member-id>/` children are the fleet's checkouts:
 * `/repos/govstruct` -> { govstruct: '/repos/govstruct', ... }. Only members
 * with an existing child directory get a row.
 */
function fleetRoots(target, fleetRoot) {
  const { resolve } = pathMod
  const { existsSync } = fsMod
  const base = resolve(target, fleetRoot)
  const out = {}
  if (!existsSync(base)) return out
  for (const name of fsMod.readdirSync(base)) {
    const p = resolve(base, name)
    if (existsSync(p) && fsMod.statSync(p).isDirectory()) out[name] = p
  }
  return out
}

async function main() {
  try {
    switch (verb) {
      case 'lint': {
        rejectUnknownFlags(rest, ['--json'])
        const target = rest.find((a) => !a.startsWith('-')) ?? '.'
        const r = lint(target)
        if (json) {
          console.log(JSON.stringify({ schema: 1, mode: 'lint', ok: r.ok, memberCount: r.memberCount, refusals: r.refusals.map(serializeRefusal) }, null, 2))
        } else if (r.ok) {
          console.log(`govstruct lint: ${r.memberCount} member(s) clean`)
        } else {
          console.log(`govstruct lint: ${r.refusals.length} refusal(s)`)
          console.log(formatRefusals(r.refusals))
        }
        process.exit(r.ok ? 0 : 1)
      }

      case 'render': {
        const target = rest.find((a) => !a.startsWith('-'))
        rejectUnknownFlags(rest, ['--json', '--write', '--out'])
        if (!target) usageError('render needs a target: apps | react | partial | readme | registry')
        if (!(target in SURFACES)) usageError(`unknown render target "${target}" (have: ${Object.keys(SURFACES).join(', ')})`)
        const outIdx = rest.indexOf('--out')
        const out = outIdx !== -1 ? rest[outIdx + 1] : null
        if (rest.includes('--write')) {
          const written = writeSurfaces('.', [target], { out })
          if (json) console.log(JSON.stringify({ schema: 1, mode: 'render', target, written }, null, 2))
          else for (const w of written) console.log(`govstruct render: wrote ${w}`)
          process.exit(0)
        }
        process.stdout.write(renderSurface('.', target))
        process.exit(0)
      }

      case 'doctor': {
        rejectUnknownFlags(rest, ['--json', '--suite', '--network', '--fleet', '--fleet-root', '--adopters'])
        const useFleet = rest.includes('--fleet')
        const useAdopters = rest.includes('--adopters')
        const useSuite = useFleet || rest.includes('--suite')
        const network = rest.includes('--network')
        if (network && (useSuite || useAdopters)) {
          usageError('--network is its own mode (the online leg); it cannot be combined with --suite, --adopters, or --fleet')
        }
        const target = rest.find((a) => !a.startsWith('-') && !isFlagValue(rest, '--fleet-root', a)) ?? '.'
        let r
        if (network) {
          r = await doctorOnline(target, {})
        } else if (useAdopters) {
          const fleetRoot = flagValue(rest, '--fleet-root')
          r = adopterGate(target, { roots: fleetRoot ? fleetRoots(target, fleetRoot) : {} })
        } else if (useFleet) {
          const fleetRoot = flagValue(rest, '--fleet-root')
          r = fleetMeter(target, { roots: fleetRoot ? fleetRoots(target, fleetRoot) : {} })
        } else {
          r = useSuite ? await doctorSuite(target, { network }) : doctor(target, { network })
        }
        if (json) {
          const mode = network ? 'network' : useAdopters ? 'adopters' : useFleet ? 'fleet' : useSuite ? 'suite' : 'doctor'
          console.log(JSON.stringify({ schema: 1, mode, ok: r.ok, refusals: r.refusals.map(serializeRefusal), report: r.report }, null, 2))
        } else {
          for (const line of r.lines) console.log(line)
        }
        process.exit(r.ok ? 0 : 1)
      }

      case 'check': {
        rejectUnknownFlags(rest, ['--json'])
        const target = rest.find((a) => !a.startsWith('-')) ?? '.'
        const r = await runChecks(target, { json })
        process.exit(r.ok ? 0 : 1)
      }

      case 'registry': {
        rejectUnknownFlags(rest, ['--json', '--write'])
        const r = suiteRegistry('.')
        if (rest.includes('--write')) {
          // PRD 5.1: apps.json is the canonical source; registry.json is one
          // rendering. Both emit, plus a versioned copy at the stable address.
          const written = writeSurfaces('.', ['apps', 'registry'], {})
          const versioned = writeVersionedRollup('.')
          const all = [...written, ...versioned]
          if (!json) console.log(`govstruct registry: wrote ${all.join(', ')}`)
          else console.log(JSON.stringify({ schema: 1, mode: 'registry', written: all, registry: r }, null, 2))
          process.exit(0)
        }
        if (json) console.log(JSON.stringify({ schema: 1, mode: 'registry', registry: r }, null, 2))
        else console.log(renderRegistry((loadManifest('.').manifest)))
        process.exit(0)
      }

      case 'lock': {
        rejectUnknownFlags(rest, ['--json'])
        const r = lock('.')
        if (json) console.log(JSON.stringify({ schema: 1, mode: 'lock', ...r }, null, 2))
        else console.log(`govstruct lock: ${r.archive} (${r.sha256.slice(0, 16)}...)`)
        process.exit(r.ok ? 0 : 1)
      }

      case 'names': {
        rejectUnknownFlags(rest, ['--json', '--network'])
        const id = rest.find((a) => !a.startsWith('-'))
        if (!id) usageError('names needs a candidate id')
        const network = rest.includes('--network')
        const r = await names('.', id, { network })
        if (json) console.log(JSON.stringify({ schema: 1, mode: 'names', ...r }, null, 2))
        else for (const line of r.lines) console.log(line)
        process.exit(r.ok ? 0 : 1)
      }

      case 'migrate': {
        rejectUnknownFlags(rest, ['--json', '--status', '--dry-run'])
        const r = rest.includes('--dry-run') ? migrateDryRun('.') : migrateStatus('.')
        if (json) console.log(JSON.stringify({ schema: 1, mode: 'migrate', ...r }, null, 2))
        else for (const line of r.lines) console.log(line)
        process.exit(r.ok ? 0 : 1)
      }

      case 'init': {
        rejectUnknownFlags(rest, ['--json', '--force'])
        const dir = rest.find((a) => !a.startsWith('-')) ?? '.'
        const r = init(dir, { force: rest.includes('--force') })
        if (json) console.log(JSON.stringify({ schema: 1, mode: 'init', ...r }, null, 2))
        else for (const line of r.lines) console.log(line)
        process.exit(r.ok ? 0 : 1)
      }

      case 'stamp': {
        rejectUnknownFlags(rest, ['--json', '--dry-run'])
        const file = rest.find((a) => !a.startsWith('-'))
        if (!file) usageError('stamp needs a record file: govstruct stamp <record.json>')
        const { readFileSync } = await import('node:fs')
        let record
        try {
          record = JSON.parse(readFileSync(file, 'utf8'))
        } catch (e) {
          console.error(`  REFUSED [E_STAMP_INVALID]: ${file} is not valid JSON: ${e.message}`)
          process.exit(1)
        }
        const r = stamp('.', record, { dryRun: rest.includes('--dry-run') })
        if (json) console.log(JSON.stringify({ schema: 1, mode: 'stamp', ok: r.ok, wrote: r.wrote, entry: r.entry, refusals: r.refusals.map(serializeRefusal) }, null, 2))
        else for (const line of r.lines) console.log(line)
        process.exit(r.ok ? 0 : 1)
      }

      case 'retire': {
        rejectUnknownFlags(rest, ['--json', '--dry-run'])
        const id = rest.find((a) => !a.startsWith('-'))
        if (!id) usageError('retire needs a member id: govstruct retire <id>')
        const r = retire('.', { id }, { dryRun: rest.includes('--dry-run') })
        if (json) console.log(JSON.stringify({ schema: 1, mode: 'retire', ok: r.ok, wrote: r.wrote, entry: r.entry, refusals: r.refusals.map(serializeRefusal) }, null, 2))
        else for (const line of r.lines) console.log(line)
        process.exit(r.ok ? 0 : 1)
      }

      case 'verdict': {
        const sub = rest[0]
        rejectUnknownFlags(rest.slice(1), ['--json'])
        if (sub === 'emit') {
          const file = rest.slice(1).find((a) => !a.startsWith('-'))
          if (!file) usageError('verdict emit needs a receipt file: govstruct verdict emit <receipt.json>')
          const { readFileSync } = await import('node:fs')
          let receipt
          try {
            receipt = JSON.parse(readFileSync(file, 'utf8'))
          } catch (e) {
            console.error(`  REFUSED [E_RECEIPT_INVALID]: ${file} is not valid JSON: ${e.message}`)
            process.exit(1)
          }
          const r = emitReceipt('.', receipt)
          if (json) console.log(JSON.stringify({ schema: 1, mode: 'verdict', sub, ok: r.ok, entry: r.entry, refusals: r.refusals.map(serializeRefusal) }, null, 2))
          else for (const line of r.lines) console.log(line)
          process.exit(r.ok ? 0 : 1)
        }
        if (sub === 'verify') {
          const r = verifyReceipts('.')
          if (json) console.log(JSON.stringify({ schema: 1, mode: 'verdict', sub, ...r }, null, 2))
          else for (const line of r.lines) console.log(line)
          process.exit(r.ok ? 0 : 1)
        }
        if (sub === 'rollup') {
          const r = verdictRollup('.')
          if (json) console.log(JSON.stringify({ schema: 1, mode: 'verdict', sub, ok: r.ok, fresh: r.fresh, polled: r.polled, red: r.red, members: r.members, refusals: r.refusals.map(serializeRefusal) }, null, 2))
          else for (const line of r.lines) console.log(line)
          process.exit(r.ok ? 0 : 1)
        }
        usageError('verdict needs a subcommand: emit | verify | rollup')
      }

      case 'audit': {
        const sub = rest[0]
        rejectUnknownFlags(rest.slice(1), ['--json', '--verb', '--subject', '--member', '--rev'])
        if (sub === 'verify') {
          const r = auditVerify('.')
          if (json) console.log(JSON.stringify({ schema: 1, mode: 'audit', sub, ...r }, null, 2))
          else for (const line of r.lines) console.log(line)
          process.exit(r.ok ? 0 : 1)
        }
        if (sub === 'record') {
          const flag = (name) => {
            const i = rest.indexOf(name)
            return i !== -1 ? rest[i + 1] : undefined
          }
          const verbName = flag('--verb')
          if (!verbName) usageError('audit record needs --verb <name>')
          const entry = appendEntry('.', {
            verb: verbName,
            subject: { member: flag('--subject') ?? flag('--member'), rev: flag('--rev') },
            actor: { kind: 'human', id: process.env.GOVSTRUCT_ACTOR ?? 'local' },
          })
          if (json) console.log(JSON.stringify({ schema: 1, mode: 'audit', sub, entry }, null, 2))
          else console.log(`govstruct audit record: seq ${entry.seq} ${entry.verb} (${entry.addr})`)
          process.exit(0)
        }
        usageError('audit needs a subcommand: verify | record')
      }

      case 'impact': {
        rejectUnknownFlags(rest, ['--json'])
        const id = rest.find((a) => !a.startsWith('-'))
        if (!id) usageError('impact needs a member id: govstruct impact <id>')
        const { manifest } = loadManifest('.')
        const r = impact(manifest, id)
        if (json) {
          console.log(JSON.stringify({ schema: 1, mode: 'impact', ...r }, null, 2))
        } else {
          console.log(`govstruct impact: ${r.id}`)
          console.log(`  direct: ${r.direct.length ? r.direct.join(', ') : '(none)'}`)
          console.log(`  transitive: ${r.transitive.length ? r.transitive.join(', ') : '(none)'}`)
        }
        process.exit(0)
      }

      case 'help':
      case '--help':
      case '-h':
        usage()
        process.exit(0)

      default:
        usageError(`unknown verb "${verb}"`)
    }
  } catch (e) {
    if (e instanceof Refusal) {
      if (json) console.log(JSON.stringify({ schema: 1, ok: false, refusals: [serializeRefusal(e)] }, null, 2))
      else console.error(`  REFUSED [${e.code}]: ${e.message}`)
      process.exit(1)
    }
    console.error(`govstruct: ${e.message}`)
    process.exit(1)
  }
}

function serializeRefusal(r) {
  return { code: r.code, message: r.message, context: r.context ?? {} }
}

main()
