# labs/TASKS.md - govstruct work log

> Rolling log. Companion to [`labs/prd-govstruct.md`](./prd-govstruct.md) (the
> product contract). Newest session at top. Struck items are done.

Last updated: 2026-11-03.

## Session 2026-11-03 - v1.0.0 release notes + announcements

- The release-post tree lands for both lines: `docs/discussions/announcing-v0.9.0.md` (backfilled) and `docs/discussions/announcing-v1.0.0.md` (staged), with the index table updated to name both.
- Version truth reconciled after the bump: `package-lock.json` and `web/package-lock.json` re-derived (root version 0.9.0 -> 1.0.0, version-only diffs), the AGENTS release prose made era-free (it still called 0.9.0 "current"), and DEPLOY.md's bootstrap tense corrected (the manual 0.9.0 publish already ran, so it is not "must run first").
- The roll-up follows: `compliance/{poststruct,govstruct,monoforge,gistory}.json` move `version.repo` 0.9.0 -> 1.0.0 and `govstruct registry --write` re-emits `apps.json` (4 lines), so the canonical roll-up and the rendered registries stay in sync.
- Tarball re-verified at 1.0.0: 61 files, `/packs` present (28 entries, all under `/packs/public`, 14 `pack.json`).
- Gates: `npm test` (247), `npm run check`, and `npm run check:rig` all green.

## Session 2026-11-03 - v1.0.0 release prep (version bump + pack distribution)

- `packs/` now rides the published tarball (`package.json` `files`, poststruct#79), so an adopter's `npm i govstruct` delivers the check-profile packs instead of a committed-but-invisible tree.
- 0.9.0 -> 1.0.0 across the version-truth surfaces (`package.json`, `web/package.json`, the README status line) plus the `## [1.0.0] - 2026-11-03` changelog section the release job extracts.
- The release-verify ladder permits `packs/` by name in the forbidden scan; a new `test/distribution.test.mjs` refuses a `files` list that would silently un-deliver the packs.
- Gates: `npm test` green (247), `npm run check` + `check:rig` green.

## Session 2026-10-30 - the first build

The controller layer's core landed, all verbs green. Build-order from the PRD gap list: G10 (refusal vocabulary) first, then G3 (the graph), then G1+G5 (write path + grants).

- [x] **G10 - the refusal vocabulary.** `spec/refusals.json`, 39 codes, namespaced by tool. Every refusal carries a registered code; an unregistered code is itself refused (`E_REFUSAL_UNREGISTERED`).
- [x] **The manifest grammar (lint).** id==filename, https + unique urls, order collisions (global rule), role/status/section enums, alias and `needs`/`home` edges, tombstone discipline. 18 two-way fixtures.
- [x] **G3 - the graph, both halves.** `needs[]` edges, topological sort, cycle refusal; the roll-up renders the graph, and `govstruct impact <id>` walks the reverse closure to every transitive dependent (the propagation path). Unknown id refuses `E_IMPACT_UNKNOWN_MEMBER`.
- [x] **The render surfaces.** react | partial | readme | registry, emitted statically; `registry.json` carries the manifest checksum.
- [x] **The doctor.** Offline by default (G11); `--suite` reports the suite-wide truth battery. `--network` is the online leg - its own mode, the only socket arm (url resolvability + npm existence), with an injectable probe so its tests stay offline.
- [x] **The check host + source-consistency packs** (PRD section 11): comment, env, floor, hygiene, naming, pin, style, test, version, and (G8) a11y.
- [x] **The registry roll-up.** Floors, env, pins, versions from the compliance blocks into one addressed, checksummed surface.
- [x] **G14 - the audit ledger.** Append-only, tamper-evident (`labs/audit-ledger.jsonl`); `audit record` appends, `audit verify` walks the chain offline.
- [x] **G9 / G2 / G6 - init, names, migrate.** `init` scaffolds a green one-member family; `names` checks the roster + the reserved block; `migrate --status/--dry-run` reports the ritual.
- [x] **The crashtest dogfood.** `packs/public/govstruct-manifest-shapes`, nine attacks over a hostile corpus through an in-process double. All REFUSED, zero exploited.
- [x] **The test spine.** `node --test` over the modules, two-way fixtures.
- [x] **Docs + CI.** AGENTS.md, CHANGELOG.md, DEPLOY.md, README refresh, `.github/workflows/{test,crashtest,publish}.yml`.

## Next

- [x] **G1 + G5 - the write path + grants.** `govstruct stamp <record.json>` registers a member as a governed write: it validates the block with the same grammar a hand-authored one passes, refuses to overwrite an existing file (append-mostly), and refuses a duplicate id. Every declared spend must be covered by the member's `grants[]` (`E_GRANT_UNLISTED`), and `grants[]` is itself governed - a kind outside `GRANT_KINDS`, an empty scope, or a duplicate is a refusal. The stamp writes the block and one ledger row; it never commits or pushes - the caller opens the PR, so CI is the serializer.
- [x] **G4 - the verdict bus.** The push side of the self-proof: `govstruct verdict emit <receipt.json>` appends a chained, tamper-evident receipt to `labs/receipts.jsonl`; `verdict verify` walks it offline; `verdict rollup` reads fresh receipts and polls the rest. Receipts are portable only through the shared vocabulary (G10).
- [x] **Deep tamper-evidence.** `entryAddress` canonicalizes recursively (a shallow key sort left nested fields - verdict rows, actor ids - outside the hash); the committed ledger is re-addressed over unchanged bodies.
- [x] **G7 - lifecycle + revocation.** `history[]` records the transitions and `status` must agree with the last one, on a forward-only ladder (`Live -> Beta -> In Development -> Backburner -> Archived -> Tombstoned`). `govstruct retire <id>` tombstones a member as a governed write: it keeps the row so an old id resolves (never a 404), records the transition, and logs one ledger row. A backward step, a status mismatch, a second retirement, and a tombstone with neither alias nor history all refuse by name.
- [x] **G8 - accessibility + i18n** (PRD section 10 S5). The emitted pane carries a named landmark, a real anchor per row, a visible focus ring, and keyed chrome strings with an explicit locale fallback. A tenth check pack, `packs/public/a11y-shapes`, verifies it; the deeper DOM/contrast leg stays poststruct's (the interop law). The dogfood caught a real bug on the way: the check host renamed any code carrying a digit to `E_SUITE_DRIFT`, so the `E_A11Y_*` family never surfaced.
- [x] **G13 - the fleet drift meter (the golden case, PRD 16.10).** The steady-state job the proving cases are not: coreforge *prevents*, the meter *detects*. `govstruct doctor --suite --fleet --fleet-root <dir>` reads each member's live surfaces (engines floor, lockfile presence, pin style, repo version, workflow count) against its compliance block, and reports every drift on one page as a typed refusal (`E_FLEET_FLOOR_DRIFT`, `E_FLEET_LOCK_MISSING`, `E_FLEET_PIN_STYLE_DRIFT`, `E_FLEET_CI_SHAPE_DRIFT`, `E_FLEET_VERSION_DRIFT`). Offline by default; a member with no checkout is UNCHECKED, never a silent pass. The meter warns where the doctor refuses - a lagging repo is a state, not a crime.
- [x] **G12 - the roll-up address + cache contract** (PRD 5.1). `apps.json` is the canonical composed source; `registry.json` is one rendering of it, so one artifact has many readers and no divergent copies. The roll-up also emits at a versioned path (`registry.v1.json`) with an `ETag` keyed on the manifest checksum and a `max-age`, so a consumer caches and revalidates cheaply. The doctor refuses a stale ETag (`E_ROLLUP_ETAG_STALE`), a divergent rendering (`E_ROLLUP_NOT_CANONICAL`), and an unrenderable payload schema (`E_ADDRESS_VERSION_UNKNOWN`).
- [x] **`compliance.yml`** - `govstruct doctor --adopters` over every declared adopter at a pinned rev, refusing pin drift (`E_ADOPTER_MISSING`, `E_ADOPTER_PIN_STYLE_DRIFT`, `E_ADOPTER_VERSION_DRIFT`) and then emitting the roll-up and refusing a drifted rendering. The gate is `doctor --adopters`: it reads each declared adopter's `govstruct` pin against the version the suite serves, in an offline checkout (`--fleet-root`). A declared adopter with no checkout is UNCHECKED - a named state, never a silent pass. The **rule of three** is the claim, not the gate: the gate refuses drift from the first adopter, but withholds the *suite claim* until ≥2 verified adopters, reporting a pilot state instead of assuming the claim. govstruct declares zero adopters today (M2 has not happened), so its own run is an honest pilot, not a fabricated green.
- [x] **G15 - the ISO evidence orientation (PRD section 10).** An evidence map, not a certificate: `spec/iso-profile.json` holds 36 clauses (15 ISO 9001, 21 ISO 27001 Annex A) and 90 resolutions, each clause naming the govstruct surface that evidences it and the gate that proves it. `govstruct iso` prints the orientation; `iso --resolve <code>` turns a refusal into an ISO statement; `iso --statement` maps a whole run; `iso --coverage` refuses when a refusal has no resolution. The `iso-shapes` check pack keeps the map honest (a clause with no surface, a refusal with no resolution, or a member clause annotation outside the catalog refuses by name). Drop-in and on by default; a host may point `iso.profile` at its own file. The family's canonical rider is `labs/prd-govstruct-compliance.md`. Out-of-scope clauses (27001 themes 6 and 7) are named, never dropped.
- [x] **The surface stability contract (issue #23, ask #1, PRD section 5.2).** A consumer of the roll-up binds to field names and types, so the promise is data: `spec/surface-contract.json` marks every field of each surface (`registry`, `registry-member`, `member`, `apps`) promised, optional, or free-form. `govstruct surface` prints it; `surface --verify` refuses a dropped promised field (`E_SURFACE_FIELD_MISSING`) or a retyped one (`E_SURFACE_TYPE_DRIFT`) by name. The `surface-shapes` check pack runs the same checks under `govstruct check`; the doctor folds it in as the `surface-contract` check. An integrator pins a `schemaVersion` and upgrades consciously.
- [ ] **`web/` + `docs/`** - the coreforge landing shell and the Jekyll rig, adopted from a checkout per the house rule.

## Laws this repo carries

- Manifest frozen, refusal instant and nameable.
- Every refusal carries a registered code (G10).
- `labs/` is a receipt, not config: the rename doctor skips it.
- The doctor is offline by default: the default run never opens a socket.

## 2026-11-03 - the pin guard goes family-wide (packstruct#69 back-port)

- `scripts/check-action-pins.cjs` (the "pins, never floats" guard) was a packstruct-only artifact (it landed on packstruct's `fix/sha-pin-actions`). It is now copied byte-identical into every sibling: `crashtest`, `eyestruct`, `freestruct`, `gistory`, `govstruct`, `monoforge`, `poststruct`, `prestruct` (packstruct already had it).
- Wired as `npm run lint:pins` inside each repo's publish gate (`check` / `gate` / `prepublishOnly`) and CI, and the guard's own battery (`check-action-pins.test.*`) rides `npm test`.
- Each repo's workflows were already SHA-pinned, so the guard is now mechanical here too. Receipt: `ACTION PINS: PASS (18 ref(s), all SHA-pinned)`, pin battery 8/8, full battery green.

## 2026-11-03 - the rename lands (flowforge -> coreforge, PRD 16.5)

The first proving case, executed end to end: the member `flowforge` is now `coreforge`, and the roster records it as one governed change.

- **`members/coreforge.json`** - the one member edit. `id`/`name`/`url`/`repo`/`npm` are coreforge, `aliases: ["flowforge"]` keeps the old id resolving (a consumer that still knows `flowforge` reads "renamed", never a 404). The `pending` block narrows from `repo | npm | url` to **`npm` alone**: the repo (`dhaupin/coreforge`) and the domain (`coreforge.creadev.org`, live 200) have landed; the npm name is declared but not yet published, so the doctor still skips it as a named state instead of refusing a 404.
- **`names.reserved`** - `flowforge` stays reserved (a retired name is never free to re-claim), and `coreforge` was already reserved.
- **Surfaces regenerated** from the manifest: `apps.json`, `registry.json`, `registry.v1.json` (`node bin/cli.mjs registry --write`). The roll-up member row now reads repo + npm coreforge with the narrowed pending annotation.
- **Frozen receipts untouched:** `labs/prd-govstruct.md` sections 16.5/16.6 keep saying `flowforge` - the PRD is the design record of the rename, not config. The rename doctor skips `labs/` for exactly this reason.
- **Receipts:** `govstruct lint` 23 members clean; `govstruct doctor` offline all checks ok (surfaces in sync, contract honored); `npm test` 255 pass / 0 fail.
- **No version bump** (1.0.0 = 1.0.0); a roster edit, not a released surface.

---

### 2026-11-04 - session: the docs-lane consolidation (this repo now calls THE one lane)

The family carried four docs topologies - freestruct's `docs-lane.yml`, coreforge's forked `docs-build.yml`, govstruct's copy of that fork, and five inline hand-copies - and the two reusable lanes had already drifted (ruby 3.2 vs 3.4, pagefind `latest` scrape vs npm pin). Owner call: consolidate to ONE lane, `dhaupin/freestruct`'s `docs-lane.yml`, no drift.

- `.github/workflows/docs.yml` - now a THIN caller of `dhaupin/freestruct/.github/workflows/docs-lane.yml@22bb7e9b2634d6cdd966963d9e25c7f892577276`. The runbook (Jekyll, the hardened pagefind scrape, the pinned freestruct post-build layer, the optional crashtest dogfood campaign, the Pages upload, the main-gated deploy) lives once in the lane; this file keeps only the trigger, permissions, concurrency, and this repo's input pins.
- `.github/workflows/docs-build.yml` (the local copy of the fork) and `.github/workflows/docs-deploy.yml` are DELETED - this repo called its own copy of the fork; it now calls the one lane directly via `docs.yml`. No `package-lock.json` here, so the lane's lock-aware install takes the `npm install` path.
- **Receipts:** the caller parses; `uses:` resolves to the lane at the pinned SHA; no local `docs-build.yml` remains.
- **No version bump**; a workflow consolidation, not a released surface.


- **The pin guard now scans `action.yml` (2026-11-04 sweep).** The family pin guard (`scripts/check-action-pins.cjs`) scanned only `.github/workflows/`, so a floating `uses:` in a repo-root composite Action manifest went unseen. crashtest's `action.yml` (the gate other repos add) carried `actions/setup-node@v6` and `actions/upload-artifact@v6` plus a duplicated `default:` key; both are now pinned and the key is gone. The guard scans the manifest alongside the workflows, and its battery proves the new leg bites. Sweep finding; no version bump.


- **The docs lane went red on `main` - the config shape, not the links (2026-11-04 sweep).** govstruct and coreforge were the ONLY two repos whose generated `docs/freestruct.config.yml` baked the deploy path into `site.url` and omitted `basePath`; every other repo is origin-only + `basePath`. freestruct joins `site.url + basePath + slug` (engine/urls.js), so with no `basePath` the strict link checker resolved root-absolute `/govstruct/...` hrefs against the tree root and reported them missing: 75 false-positive broken links, build failed. Fix is one-source: `scripts/sync.mjs` emits `site.url = docs.host`, `basePath = docs.baseurl`, `linkCheck: true`; the generated file follows. Receipts: `npm test` 266/266, `npm run check` green. No version bump.
