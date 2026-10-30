// test/a11y.test.mjs - the a11y/i18n surface (S5, G8).
//
// The rendered pane must carry a named landmark, real anchors, a visible
// focus ring, and keyed chrome strings with an explicit locale fallback.
// Both ways: the emitted pane is clean, and a hostile pane refuses by code.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadCheckPacks } from '../src/check.mjs'
import { renderPartial } from '../src/render.mjs'
import { loadManifest } from '../src/manifest.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const CLEAN = join(HERE, 'fixtures', 'clean')
const PANE = 'web/public/apps-menu.html'

async function a11yPack() {
  const { packs } = await loadCheckPacks(ROOT)
  return packs.find((p) => p.name === 'a11y-shapes')
}

// A tiny ctx over a temp tree holding one file.
function treeWith(rel, content) {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-a11y-'))
  const full = join(dir, rel)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content)
  return dir
}

async function runPack(dir) {
  const { existsSync, readFileSync } = await import('node:fs')
  const pack = await a11yPack()
  const ctx = {
    exists: (p) => existsSync(join(dir, p)),
    readFile: (p) => readFileSync(join(dir, p), 'utf8'),
  }
  const findings = []
  for (const c of pack.checks) findings.push(...(await c.run(ctx)))
  return findings
}

test('the emitted pane passes every a11y/i18n check', async () => {
  const html = renderPartial(loadManifest(CLEAN).manifest)
  const dir = treeWith(PANE, html)
  try {
    assert.deepEqual(await runPack(dir), [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a pane with no landmark refuses E_A11Y_NO_LANDMARK', async () => {
  const dir = treeWith(PANE, '<div class="apps-menu"><ul></ul></div>')
  try {
    const codes = (await runPack(dir)).map((f) => f.code)
    assert.ok(codes.includes('E_A11Y_NO_LANDMARK'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a click-handler row refuses E_A11Y_FAKE_ANCHOR', async () => {
  const dir = treeWith(PANE, '<nav aria-label="Suite apps"><ul><li class="apps-menu__item" onclick="go()">x</li></ul></nav>')
  try {
    const codes = (await runPack(dir)).map((f) => f.code)
    assert.ok(codes.includes('E_A11Y_FAKE_ANCHOR'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a pane with no focus ring refuses E_A11Y_NO_FOCUS', async () => {
  const dir = treeWith(PANE, '<nav aria-label="Suite apps"><ul></ul></nav>')
  try {
    const codes = (await runPack(dir)).map((f) => f.code)
    assert.ok(codes.includes('E_A11Y_NO_FOCUS'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('an unkeyed landmark refuses E_I18N_UNKEYED', async () => {
  const dir = treeWith(PANE, '<nav aria-label="Suite apps"><ul></ul></nav>')
  try {
    const codes = (await runPack(dir)).map((f) => f.code)
    assert.ok(codes.includes('E_I18N_UNKEYED'))
    assert.ok(codes.includes('E_I18N_NO_FALLBACK'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
