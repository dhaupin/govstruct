// test/config.test.mjs - the config loader (section 16).
//
// The config is the only required input. A missing or malformed config is a
// named refusal, never a crash.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadConfig, DEFAULTS } from '../src/config.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLEAN = join(HERE, 'fixtures', 'clean')

test('loads the clean fixture config and fills defaults', () => {
  const { config, root } = loadConfig(CLEAN)
  assert.equal(root, CLEAN)
  assert.equal(config.members.dir, 'members')
  assert.equal(config.surfaces.registry, DEFAULTS.surfaces.registry)
})

test('a missing config refuses E_CONFIG_MISSING', () => {
  assert.throws(() => loadConfig(join(HERE, 'fixtures', 'nope')), (e) => e.code === 'E_CONFIG_MISSING')
})

test('a config with the wrong schemaVersion refuses E_CONFIG_INVALID', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-cfg-'))
  try {
    writeFileSync(join(dir, 'govstruct.config.json'), JSON.stringify({ schemaVersion: 2 }))
    assert.throws(() => loadConfig(dir), (e) => e.code === 'E_CONFIG_INVALID')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a config that is not JSON refuses E_CONFIG_INVALID', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-cfg-'))
  try {
    writeFileSync(join(dir, 'govstruct.config.json'), '{ not json')
    assert.throws(() => loadConfig(dir), (e) => e.code === 'E_CONFIG_INVALID')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a scalar override of a null-default config key merges cleanly (iso.profile)', () => {
  // Regression: merge() treated a null default as an object and crashed on
  // `Object.entries(null)`; a host setting iso.profile (null by default) hit it.
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-cfg-'))
  try {
    writeFileSync(join(dir, 'govstruct.config.json'), JSON.stringify({ schemaVersion: 1, iso: { profile: 'my-profile.json' } }))
    const { config } = loadConfig(dir)
    assert.equal(config.iso.profile, 'my-profile.json')
    assert.equal(config.iso.enabled, true, 'the sibling default is preserved')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
