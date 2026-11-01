// test/render.test.mjs - the render surfaces (section 5).
//
// Every surface is emitted from the manifest, statically: the react surface
// carries every anchor in the initial HTML, the partial carries no JS, the
// readme is a table, and the registry is machine-readable. The manifest
// checksum is stable and changes when a member changes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadManifest } from '../src/manifest.mjs'
import {
  renderReact, renderPartial, renderReadme, renderRegistry,
  manifestChecksum, publicMembers, SURFACES, PANE_CSS,
} from '../src/render.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLEAN = join(HERE, 'fixtures', 'clean')

function manifest() {
  return loadManifest(CLEAN).manifest
}

test('the react surface carries every public anchor in the HTML', () => {
  const out = renderReact(manifest())
  assert.match(out, /href="https:\/\/alpha\.example\.com"/)
  assert.match(out, /href="https:\/\/beta\.example\.com"/)
})

test('the partial surface carries no script tag', () => {
  const out = renderPartial(manifest())
  assert.doesNotMatch(out, /<script/i)
  assert.match(out, /href="https:\/\/alpha\.example\.com"/)
})

test('the readme surface is a pipe-terminated table', () => {
  const out = renderReadme(manifest())
  for (const line of out.split('\n')) {
    if (line.startsWith('|')) assert.match(line, /\|\s*$/)
  }
  assert.match(out, /Alpha/)
})

test('the registry surface is valid JSON carrying the checksum', () => {
  const out = renderRegistry(manifest())
  const parsed = JSON.parse(out)
  assert.equal(parsed.schemaVersion, 1)
  assert.equal(parsed.generated.manifest, manifestChecksum(manifest()))
  assert.equal(parsed.memberCount, 2)
})

test('the checksum is stable across calls and moves with the members', () => {
  const m = manifest()
  assert.equal(manifestChecksum(m), manifestChecksum(m))
  const changed = structuredClone(m)
  changed.members[0].blurb = 'different'
  assert.notEqual(manifestChecksum(m), manifestChecksum(changed))
})

test('publicMembers excludes members with a null url', () => {
  const m = structuredClone(manifest())
  m.members[0].url = null
  assert.equal(publicMembers(m).length, 1)
})

test('SURFACES names exactly the five targets', () => {
  assert.deepEqual(Object.keys(SURFACES).sort(), ['apps', 'partial', 'react', 'readme', 'registry'])
})

// The pane ships its own stylesheet (PRD 5): the emitted bytes are
// self-contained, so a consumer needs no host CSS. The failure this catches:
// the classes were emitted while only a focus-ring rode along, so the pane
// rendered as a raw unstyled list on the live site.
test('the react surface carries the pane stylesheet, not just a focus ring', () => {
  const out = renderReact(manifest())
  assert.match(out, /\.apps-menu__pane\s*\{/)
  assert.match(out, /\.apps-menu__list\s*\{/)
  assert.match(out, /\.apps-menu__toggle\s*\{/)
  assert.match(out, /\.apps-menu__name\s*\{/)
  assert.match(out, /\.apps-menu__blurb\s*\{/)
  assert.match(out, /:focus-visible/)
})

test('the partial surface carries the pane stylesheet, not just a focus ring', () => {
  const out = renderPartial(manifest())
  assert.match(out, /\.apps-menu__pane\s*\{/)
  assert.match(out, /\.apps-menu__toggle\s*\{/)
  assert.match(out, /:focus-visible/)
})

test('the pane stylesheet rides the theme tokens, never a hardcoded hex', () => {
  // No rule may hardcode a color: the pane must re-theme with light/dark and
  // the paint scheme (the family house rule - no class hardcodes a hex).
  assert.doesNotMatch(PANE_CSS, /#[0-9a-fA-F]{3,8}\b/)
  for (const token of ['--surface', '--line', '--ink', '--ink-soft', '--accent', '--raised']) {
    assert.match(PANE_CSS, new RegExp(`var\\(${token}\\)`))
  }
})

test('the emitted react STYLE constant embeds the whole pane stylesheet', () => {
  const out = renderReact(manifest())
  // The STYLE const is the CSS the component injects; it must equal PANE_CSS.
  const m = out.match(/const STYLE = `([\s\S]*)`\n/)
  assert.ok(m, 'react surface has no STYLE template literal')
  assert.equal(m[1], PANE_CSS)
})
