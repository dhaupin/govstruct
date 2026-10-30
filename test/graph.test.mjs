// test/graph.test.mjs - the dependency graph (G3).
//
// Topo-sort and cycle refusal live in manifest.mjs; this covers the other
// half the PRD promises: the reverse closure (who a bump touches) and the
// graph the roll-up renders.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadManifest } from '../src/manifest.mjs'
import { buildGraph, impact, renderGraph } from '../src/graph.mjs'
import { suiteRegistry } from '../src/registry.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLEAN = join(HERE, 'fixtures', 'clean')

test('buildGraph reads needs[] into forward and reverse edges', () => {
  const { manifest } = loadManifest(CLEAN)
  const { needs, dependents } = buildGraph(manifest)
  assert.deepEqual(needs.get('beta'), ['alpha'])
  assert.deepEqual(dependents.get('alpha'), ['beta'])
  assert.deepEqual(needs.get('alpha'), [])
})

test('impact walks the reverse closure (direct + transitive)', () => {
  const { manifest } = loadManifest(CLEAN)
  const r = impact(manifest, 'alpha')
  assert.deepEqual(r.direct, ['beta'])
  assert.deepEqual(r.transitive, ['beta'])
  assert.deepEqual(impact(manifest, 'beta').transitive, [])
})

test('impact on an unknown member refuses E_IMPACT_UNKNOWN_MEMBER', () => {
  const { manifest } = loadManifest(CLEAN)
  assert.throws(() => impact(manifest, 'ghost'), (e) => e.code === 'E_IMPACT_UNKNOWN_MEMBER')
})

test('renderGraph is byte-deterministic', () => {
  const { manifest } = loadManifest(CLEAN)
  const g = renderGraph(manifest)
  assert.equal(g, renderGraph(manifest))
  assert.match(g, /^alpha: needs \[\] needed-by \[beta\]$/m)
  assert.match(g, /^beta: needs \[alpha\] needed-by \[\]$/m)
})

test('the roll-up carries the graph', () => {
  const r = suiteRegistry(CLEAN)
  const alpha = r.graph.find((n) => n.id === 'alpha')
  assert.deepEqual(alpha, { id: 'alpha', needs: [], neededBy: ['beta'] })
})
