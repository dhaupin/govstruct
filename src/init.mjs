// src/init.mjs - the stranger's first minute (PRD section 16.4, G9).
//
// `govstruct init` scaffolds a one-member family in under a minute: a
// govstruct.config.json, a members/hello.json, and a green doctor. The
// target from section 0: a stranger runs it on their own family within a
// minute of cloning, no Creadev-shaped assumptions to unpick.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const CONFIG = {
  schemaVersion: 1,
  family: { name: 'my-family', title: 'My family of repos' },
  members: { dir: 'members' },
  compliance: { dir: 'compliance' },
  manifest: { out: 'apps.json' },
  surfaces: {
    react: 'web/src/components/AppsMenu.jsx',
    partial: 'web/public/apps-menu.html',
    readme: 'labs/readme-members.md',
    registry: 'registry.json',
  },
  gates: { packstruct: false, crashtest: false, poststruct: false },
  names: { reserved: [] },
  lock: { out: 'horcrux', name: 'my-family' },
}

const HELLO = {
  id: 'hello',
  name: 'Hello',
  role: 'product',
  url: 'https://example.com',
  repo: null,
  npm: null,
  aliases: [],
  home: null,
  blurb: 'The first member: edit or replace this block with your own.',
  icon: 'hello',
  order: 1,
  status: 'Live',
  section: 'open-source',
  needs: [],
  grants: [],
}

/** Scaffold a family in `dir`. Returns { ok, dir, files, lines }. */
export function init(dir = '.', { force = false } = {}) {
  const lines = []
  const files = []
  const configPath = join(dir, 'govstruct.config.json')
  const memberPath = join(dir, 'members', 'hello.json')

  if (!force && existsSync(configPath)) {
    lines.push(`govstruct init: ${configPath} already exists (pass --force to overwrite)`)
    return { ok: false, dir, files, lines }
  }

  mkdirSync(join(dir, 'members'), { recursive: true })
  writeFileSync(configPath, JSON.stringify(CONFIG, null, 2) + '\n')
  files.push('govstruct.config.json')
  if (force || !existsSync(memberPath)) {
    writeFileSync(memberPath, JSON.stringify(HELLO, null, 2) + '\n')
    files.push('members/hello.json')
  }

  lines.push(`govstruct init: scaffolded a one-member family in ${dir}`)
  for (const f of files) lines.push(`  created ${f}`)
  lines.push('  next: govstruct lint && govstruct render registry')
  return { ok: true, dir, files, lines }
}
