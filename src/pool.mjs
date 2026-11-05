// src/pool.mjs - the one bounded async pool (zero deps).
//
// The scan-speed lever crashtest#83 landed, ported to govstruct's online
// doctor: the member probes (url resolvability, npm existence) are independent
// and serial today, so a suite of N members pays N round-trips end to end. The
// shape is the family one (poststruct's external probe pool): `limit` workers,
// each pulling the next index, results written back AT THE ORIGINAL INDEX so
// completion order never reorders the report - the doctor's refusals and rows
// stay byte-stable per run.
//
// The offline doctor stays socket-free and serial (G11); this pool is only
// reached by the opt-in online arm. The default limit is 1, so an unstated run
// is the old serial loop byte-for-byte.

/**
 * Run `fn(item, index)` over `items`, at most `limit` in flight, returning
 * results in the ORIGINAL order. `limit` defaults to 1 (serial); a non-integer
 * or sub-1 limit throws a plain Error the CLI boundary turns into a usage
 * error (exit 2), matching the family ladder.
 */
export async function runPool(items, limit, fn) {
  const width = limit == null ? 1 : limit
  if (!Number.isInteger(width) || width < 1) {
    throw new Error(`concurrency must be an integer >= 1, got "${String(limit)}"`)
  }
  const results = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(width, items.length) }, worker))
  return results
}
