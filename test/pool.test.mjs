// test/pool.test.mjs - the shared bounded async pool (issue #83 port).
//
// The contract the online doctor relies on: results land at the ORIGINAL
// index however completion interleaves, the limit is honored, and a bad
// limit throws rather than improvising.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runPool } from '../src/pool.mjs'

test('runPool: results land at the original index under reverse completion', async () => {
  const delays = [30, 15, 1]
  const rows = await runPool(['a', 'b', 'c'], 3, (x, i) => new Promise((r) => setTimeout(() => r(`${x}:${i}`), delays[i])))
  assert.deepEqual(rows, ['a:0', 'b:1', 'c:2'])
})

test('runPool: the limit is honored and actually runs concurrent work', async () => {
  let inFlight = 0
  let peak = 0
  await runPool([1, 2, 3, 4, 5], 2, async () => {
    inFlight++
    peak = Math.max(peak, inFlight)
    await new Promise((r) => setTimeout(r, 5))
    inFlight--
  })
  assert.ok(peak <= 2, `pool exceeded its limit (peak ${peak})`)
  assert.ok(peak >= 2, 'the pool must actually run concurrent work at width 2')
})

test('runPool: the default limit is 1 (an unstated run is the serial loop)', async () => {
  let inFlight = 0
  let peak = 0
  await runPool([1, 2, 3], undefined, async () => {
    inFlight++
    peak = Math.max(peak, inFlight)
    await new Promise((r) => setTimeout(r, 5))
    inFlight--
  })
  assert.equal(peak, 1)
})

test('runPool: a non-integer or sub-1 limit throws', async () => {
  for (const bad of [0, -1, 2.5, NaN, 'x']) {
    await assert.rejects(() => runPool([1], bad, () => 1), /concurrency must be an integer/)
  }
})

test('runPool: an empty list resolves to an empty result', async () => {
  assert.deepEqual(await runPool([], 4, () => 1), [])
})
