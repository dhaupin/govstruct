# Changelog

All notable changes to govstruct will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **The controller layer, first build.** One manifest of members
  (`members/<id>.json`), one render surface per deployment shape, one doctor
  verb that verifies every adopter serves the same truth. Zero runtime
  dependencies, Node ESM, exit codes 0/1/2.
- **The refusal vocabulary (G10).** `spec/refusals.json` holds 39 codes,
  namespaced by tool. Every refusal govstruct emits carries a registered
  code; an unregistered code is itself refused (`E_REFUSAL_UNREGISTERED`).
- **The manifest grammar (lint).** id==filename, https + unique urls, order
  collisions, role/status/section enums, alias and `needs`/`home` edges,
  tombstone discipline. Two-way fixtures: a clean family plus one broken
  family per refusal code.
- **The dependency graph (G3).** `needs[]` edges, a topological sort, and a
  cycle refusal - how a floor bump propagates.
- **The render surfaces.** `react | partial | readme | registry`, emitted
  statically from the manifest (no runtime fetch). `registry.json` carries
  the manifest checksum.
- **The doctor.** Offline by default (G11): the default run is
  byte-deterministic and never opens a socket; `--suite` reports the
  suite-wide truth battery.
- **The check host + the source-consistency packs.** Nine packstruct SPEC v1
  check-profile packs under `packs/public/*-shapes/` (comment, env, floor,
  hygiene, naming, pin, style, test, version) - PRD section 11, the ruling
  that source-level consistency is a pack, not a fifth app.
- **The registry roll-up.** Floors, env keys, pins, and versions gathered
  from the compliance blocks into one address with a checksum.
- **The audit ledger (G14).** `labs/audit-ledger.jsonl`, append-only and
  tamper-evident: every entry carries `seq`, `prev`, and an `addr` over its
  own body. `govstruct audit record` appends; `govstruct audit verify` walks
  the chain offline.
- **init / names / migrate (G9, G2, G6).** `init` scaffolds a one-member
  family that lints green; `names` checks a candidate id against the roster
  and the reserved block; `migrate --status/--dry-run` reports the migration
  ritual.
- **The crashtest dogfood.** `crashtest.config.js` +
  `packs/public/govstruct-manifest-shapes`: seven attacks over a hostile
  member-block corpus and the verdict chain through an in-process double.
  All REFUSED, zero exploited.
- **The verdict bus (G4).** The self-proof the arms provide is a pull; this
  adds the push. `govstruct verdict emit <receipt.json>` appends a member's
  status receipt to `labs/receipts.jsonl` - append-only, content-addressed,
  and chained, so it is tamper-evident and verifiable offline
  (`verdict verify`). A receipt is portable only if its refusal codes are in
  the shared vocabulary, so an unregistered code refuses
  (`E_RECEIPT_INVALID`). `verdict rollup` reads receipts when fresh and
  polls the manifest's declared state when not: "the suite is green right
  now" is a fact, not a cache age.
- **Tamper-evidence made deep.** The audit address was computed with a
  shallow key sort, so a rewritten nested field (a verdict row, an actor id)
  did not move the hash - tamper-evidence was a lie for exactly the fields
  that matter. `entryAddress` now canonicalizes recursively; the committed
  ledger is re-addressed over unchanged bodies.
- **Four new refusal codes** (49 total): `E_RECEIPT_INVALID`,
  `E_RECEIPT_UNKNOWN_MEMBER`, `E_RECEIPT_TAMPER`, `E_RECEIPT_CHAIN`.
- **The write path (G1) + credential grants (G5).** `govstruct stamp
  <record.json>` registers a machine-minted member as a reviewable,
  refusable claim: it validates with the same grammar a hand-authored block
  does, never overwrites an existing member file
  (`E_STAMP_TARGET_EXISTS`), and refuses a duplicate id
  (`E_STAMP_DUPLICATE`). A stamp that spends a credential must declare it in
  `spends[]`, and every spend must be covered by the member's `grants[]` -
  a stamp cannot widen a wall (`E_GRANT_UNLISTED`). `grants[]` is itself
  governed: a kind outside the vocabulary (`E_GRANT_UNKNOWN_KIND`), an empty
  scope (`E_GRANT_SCOPE_EMPTY`), or a duplicate (`E_GRANT_DUPLICATE`) is a
  refusal. The mint is a ledger row (G14), so it is auditable offline.
- **Six new refusal codes** (45 total): `E_STAMP_INVALID`,
  `E_STAMP_DUPLICATE`, `E_STAMP_TARGET_EXISTS`, `E_GRANT_SCOPE_EMPTY`,
  `E_GRANT_DUPLICATE`, `E_GRANT_UNKNOWN_KIND`.
- **The lifecycle + revocation (G7).** A member is born, changed, and
  retired. `history[]` records the transitions and `status` must agree with
  the last one, on a forward-only ladder
  (`Live -> Beta -> In Development -> Backburner -> Archived -> Tombstoned`).
  A backward step refuses (`E_HISTORY_BACKWARD`), a malformed history refuses
  (`E_HISTORY_INVALID`), and a status that disagrees with its last transition
  refuses (`E_HISTORY_MISMATCH`). `govstruct retire <id>` tombstones a member
  as a governed write: it keeps the member's row so an old id still resolves
  (never a 404), appends the Tombstoned transition to `history[]`, and logs
  one ledger row (G14). Retirement is terminal - a second retire refuses
  (`E_RETIRE_ALREADY_TOMBSTONED`), and an unknown member refuses
  (`E_RETIRE_UNKNOWN_MEMBER`). A tombstone with neither an alias nor the
  history that retired it is a lie about a member that never existed
  (`E_TOMBSTONE_EMPTY`).
- **Six new refusal codes** (55 total): `E_HISTORY_INVALID`,
  `E_HISTORY_BACKWARD`, `E_HISTORY_MISMATCH`, `E_RETIRE_UNKNOWN_MEMBER`,
  `E_RETIRE_ALREADY_TOMBSTONED`, `E_RETIRE_ALIAS_REQUIRED`.

### Notes
- The reference roster (23 members) is data, not code: member 24 is a block
  file plus a doctor run, never a PRD edit.
