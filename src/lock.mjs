// src/lock.mjs - the lock verb (PRD section 6): archive + sha256 receipt,
// monoforge-shaped.
//
// A lock is a checksummed, resumable archive of the tree (the archive
// carries .git history, so it is a repo, not a file dump) plus a receipt
// naming the sha256. The receipt rides the surfaces (section 5.1), so a
// consumer can prove the copy it read is the copy the suite emitted.
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { loadConfig, resolveIn } from './config.mjs'
import { loadManifest } from './manifest.mjs'
import { manifestChecksum } from './render.mjs'

/** Compute the sha256 of a file. */
export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

/**
 * Lock the tree: emit a receipt over the manifest checksum and, when git is
 * available, a git archive of HEAD. Returns { ok, archive, sha256, receipt,
 * lines }.
 */
export function lock(target = '.') {
  const { root, config } = loadConfig(target)
  const outDir = resolveIn(root, config.lock.out)
  const name = config.lock.name ?? 'govstruct'
  const version = readVersion(root)
  const lines = []
  const { manifest } = loadManifest(root, { root, config })
  const receipt = {
    schemaVersion: 1,
    tool: 'govstruct',
    name,
    version,
    manifest: manifestChecksum(manifest),
    at: new Date().toISOString(),
  }

  let archive = null
  let sha256 = null

  const gitOk = spawnSync('git', ['-C', root, 'rev-parse', '--is-inside-work-tree'], { encoding: 'utf8' }).status === 0
  if (gitOk) {
    mkdirSync(outDir, { recursive: true })
    const stamp = new Date().toISOString().slice(0, 10)
    archive = join(outDir, `${name}-${version}-lock-${stamp}.tar.gz`)
    const r = spawnSync('git', ['-C', root, 'archive', '--format=tar.gz', '-o', archive, 'HEAD'], { encoding: 'utf8' })
    if (r.status === 0 && existsSync(archive)) {
      sha256 = sha256File(archive)
      receipt.archive = relativeTo(root, archive)
      receipt.sha256 = sha256
      lines.push(`govstruct lock: wrote ${relativeTo(root, archive)}`)
      lines.push(`  sha256 ${sha256}`)
    } else {
      archive = null
      lines.push('govstruct lock: git archive unavailable (non-fatal)')
    }
  } else {
    lines.push('govstruct lock: not a git work tree; emitting the receipt only')
  }

  mkdirSync(outDir, { recursive: true })
  const receiptPath = join(outDir, `${name}-lock-receipt.json`)
  writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n')
  lines.push(`govstruct lock: wrote ${relativeTo(root, receiptPath)}`)

  return { ok: true, archive: archive ? relativeTo(root, archive) : null, sha256, receipt, lines }
}

function readVersion(root) {
  try {
    return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function relativeTo(root, p) {
  const r = resolve(root)
  const a = resolve(p)
  return a.startsWith(r) ? a.slice(r.length + 1) : a
}
