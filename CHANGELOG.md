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
  `packs/public/govstruct-manifest-shapes`: five attacks over a hostile
  member-block corpus through an in-process double. All REFUSED, zero
  exploited.

### Notes
- The reference roster (23 members) is data, not code: member 24 is a block
  file plus a doctor run, never a PRD edit.
