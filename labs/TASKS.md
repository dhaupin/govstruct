# labs/TASKS.md - govstruct work log

> Rolling log. Companion to [`labs/prd-govstruct.md`](./prd-govstruct.md) (the
> product contract). Newest session at top. Struck items are done.

Last updated: 2026-10-30.

## Session 2026-10-30 - the first build

The controller layer's core landed, all verbs green. Build-order from the PRD
gap list: G10 (refusal vocabulary) first, then G3 (the graph), then G1+G5
(write path + grants).

- [x] **G10 - the refusal vocabulary.** `spec/refusals.json`, 39 codes,
      namespaced by tool. Every refusal carries a registered code; an
      unregistered code is itself refused (`E_REFUSAL_UNREGISTERED`).
- [x] **The manifest grammar (lint).** id==filename, https + unique urls,
      order collisions (global rule), role/status/section enums, alias and
      `needs`/`home` edges, tombstone discipline. 18 two-way fixtures.
- [x] **G3 - the graph, both halves.** `needs[]` edges, topological sort,
      cycle refusal; the roll-up renders the graph, and `govstruct impact
      <id>` walks the reverse closure to every transitive dependent (the
      propagation path). Unknown id refuses `E_IMPACT_UNKNOWN_MEMBER`.
- [x] **The render surfaces.** react | partial | readme | registry, emitted
      statically; `registry.json` carries the manifest checksum.
- [x] **The doctor.** Offline by default (G11); `--suite` reports the
      suite-wide truth battery.
- [x] **The check host + source-consistency packs** (PRD section 11):
      comment, env, floor, hygiene, naming, pin, style, test, version, and
      (G8) a11y.
- [x] **The registry roll-up.** Floors, env, pins, versions from the
      compliance blocks into one addressed, checksummed surface.
- [x] **G14 - the audit ledger.** Append-only, tamper-evident
      (`labs/audit-ledger.jsonl`); `audit record` appends, `audit verify`
      walks the chain offline.
- [x] **G9 / G2 / G6 - init, names, migrate.** `init` scaffolds a green
      one-member family; `names` checks the roster + the reserved block;
      `migrate --status/--dry-run` reports the ritual.
- [x] **The crashtest dogfood.** `packs/public/govstruct-manifest-shapes`,
      nine attacks over a hostile corpus through an in-process double. All
      REFUSED, zero exploited.
- [x] **The test spine.** `node --test` over the modules, two-way fixtures.
- [x] **Docs + CI.** AGENTS.md, CHANGELOG.md, DEPLOY.md, README refresh,
      `.github/workflows/{test,crashtest,publish}.yml`.

## Next

- [x] **G1 + G5 - the write path + grants.** `govstruct stamp <record.json>`
      registers a member as a governed write: it validates the block with the
      same grammar a hand-authored one passes, refuses to overwrite an
      existing file (append-mostly), and refuses a duplicate id. Every
      declared spend must be covered by the member's `grants[]`
      (`E_GRANT_UNLISTED`), and `grants[]` is itself governed - a kind outside
      `GRANT_KINDS`, an empty scope, or a duplicate is a refusal. The stamp
      writes the block and one ledger row; it never commits or pushes - the
      caller opens the PR, so CI is the serializer.
- [x] **G4 - the verdict bus.** The push side of the self-proof:
      `govstruct verdict emit <receipt.json>` appends a chained, tamper-evident
      receipt to `labs/receipts.jsonl`; `verdict verify` walks it offline;
      `verdict rollup` reads fresh receipts and polls the rest. Receipts are
      portable only through the shared vocabulary (G10).
- [x] **Deep tamper-evidence.** `entryAddress` canonicalizes recursively (a
      shallow key sort left nested fields - verdict rows, actor ids - outside
      the hash); the committed ledger is re-addressed over unchanged bodies.
- [x] **G7 - lifecycle + revocation.** `history[]` records the transitions
      and `status` must agree with the last one, on a forward-only ladder
      (`Live -> Beta -> In Development -> Backburner -> Archived ->
      Tombstoned`). `govstruct retire <id>` tombstones a member as a governed
      write: it keeps the row so an old id resolves (never a 404), records
      the transition, and logs one ledger row. A backward step, a status
      mismatch, a second retirement, and a tombstone with neither alias nor
      history all refuse by name.
- [x] **G8 - accessibility + i18n** (PRD section 10 S5). The emitted pane
      carries a named landmark, a real anchor per row, a visible focus ring,
      and keyed chrome strings with an explicit locale fallback. A tenth
      check pack, `packs/public/a11y-shapes`, verifies it; the deeper
      DOM/contrast leg stays poststruct's (the interop law). The dogfood
      caught a real bug on the way: the check host renamed any code carrying
      a digit to `E_SUITE_DRIFT`, so the `E_A11Y_*` family never surfaced.
- [ ] **`compliance.yml`** - `govstruct doctor --suite` over every adopter at
      a pinned rev, refusing drift.
- [ ] **`web/` + `docs/`** - the coreforge landing shell and the Jekyll rig,
      adopted from a checkout per the house rule.
- [ ] **`apps.json`** - the composed manifest, if the block-file directory
      proves insufficient (open question, PRD section 17).

## Laws this repo carries

- Manifest frozen, refusal instant and nameable.
- Every refusal carries a registered code (G10).
- `labs/` is a receipt, not config: the rename doctor skips it.
- The doctor is offline by default: the default run never opens a socket.
