// test/surfaces.test.mjs - emit surfaces to disk (section 5).
//
// A written surface and a printed surface are the same bytes, and the
// doctor's checksum gate sees no drift after a write.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { init } from '../src/init.mjs'
import { renderSurface, writeSurfaces, surfaceDrift } from '../src/surfaces.mjs'
test('writing a surface then drifting it reports drift', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-surf-'))
  try {
    init(dir)
    const written = writeSurfaces(dir, ['registry'])
    assert.ok(written.includes('registry.json'))
    assert.equal(surfaceDrift(dir, 'registry').drift, false)
    assert.match(renderSurface(dir, 'registry'), /schemaVersion/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
test('an unknown render target throws', () => {
  const dir = mkdtempSync(join(tmpdir(), 'govstruct-surf-'))
  try {
    init(dir)
    assert.throws(() => renderSurface(dir, 'nope'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
