# AGENTS.md - govstruct

## Identity
- **Name:** govstruct (the controller layer for a family of repos)
- **Repo:** dhaupin/govstruct
- **Core law:** manifest frozen, refusal instant and nameable
- One manifest of members, one render surface per shape, one doctor verb
  that verifies suite truth. It is NOT a re-implementation of the forges:
  a fix that belongs in coreforge/monoforge goes there, not here.
- The design lives in [`labs/prd-govstruct.md`](./labs/prd-govstruct.md);
  this file is the working contract for agents.

## Mechanical conventions (this repo)
- Zero runtime dependencies. Node ESM, exit codes 0/1/2 (the family ladder:
  0 all honored, 1 any refusal, 2 usage error).
- Every refusal carries a code registered in `spec/refusals.json` (G10).
  A code the vocabulary does not name is itself refused
  (`E_REFUSAL_UNREGISTERED`): the next tool must be able to read the refusal.
- `members/<id>.json` is the manifest; the filename MUST equal the `id`.
  The roster is data, never code: member 24 is a block file + a doctor run.
- The compliance blocks in `compliance/` are the governed surfaces (PRD
  section 10): runtime floors, env keys, pins, versions, clause maps. The
  registry roll-up renders them; it never re-derives them from source.
- Source-level consistency IS a pack (PRD section 11), not a fifth app:
  the rules live under `packs/public/*-shapes/` as packstruct SPEC v1
  check-profile packs. `check.mjs` hosts them; it never judges a sibling's
  pack shape.
- `npm test` before touching anything in `src/`. The spine is
  `node --test test/*.test.mjs`.
- Adding a validate rule = added cases both ways in `test/fixtures`: a clean
  family plus one broken family per refusal code. A rule that never fails
  proves nothing.
- Crashtest dogfood: `crashtest.config.js` + `packs/public/govstruct-manifest-shapes`
  attack the lint contract with hostile member-block corpora via an
  in-process double. `npx crashtest run` before merges that touch `src/` or
  the pack. Cross-repo pack doctrine: no imports from crashtest internals;
  verdict records inline.
- The packs tree holds BOTH profiles: govstruct's check-profile packs
  (`*-shapes`, exporting `checks`) and the crashtest scenario pack
  (`govstruct-manifest-shapes`, exporting `attacks`). `crashtest.config.js`
  points at the one scenario pack dir so the two profiles never cross;
  `check.mjs` passes over a pack that exports `attacks`.
- Generated files never travel: `node_modules/`, `web/dist/`,
  `web/.prestruct/`, `labs/run-meta.json` (the one churn-by-design stamp),
  and `packs/local/` (the WIP lane) are in `.gitignore`.
- All prose uses zero configured-voice words from poststruct's language pack.
- The doctor is OFFLINE by default (G11): the default run is
  byte-deterministic and never opens a socket. `--network` opts in.

## Companion pins & receipts
- Never pin to a line npm does not serve. `npm view <pkg> versions` before
  any bump - an `ETARGET` pin breaks the lane instead of fixing a bug.
  crashtest publishes 1.1.0; its 1.2.0 sits unreleased on `main`.
- The dogfood ledger (`labs/crashledger.json` + `labs/hardening.md`) is cut
  by whatever crashtest is installed - re-cut it with the pinned
  `crashtest@<version>` and cite that same tally.
- The audit ledger (`labs/audit-ledger.jsonl`) is append-only and
  tamper-evident: every entry carries `seq`, `prev`, and an `addr` over its
  own body. `govstruct audit verify` walks the chain offline. Never hand-edit
  it; a rewrite is a refusal, not a repair.
- The write path (G1) is `govstruct stamp <record.json>`, and it is
  append-mostly: a stamp validates with the hand-authored grammar, never
  overwrites an existing member file, and refuses a duplicate id. It writes
  the block plus one ledger row and NEVER commits or pushes - the caller
  opens the PR, and `doctor --suite` is the pre-merge check.
- A stamp cannot widen a wall (G5): every spend in `spends[]` must be covered
  by the member's `grants[]` (`E_GRANT_UNLISTED`), and `grants[]` is itself
  governed - a kind outside `GRANT_KINDS`, an empty scope, or a duplicate is
  a refusal.
- The verdict bus (G4) is the push side of the self-proof: a member's CI
  emits a status receipt (`govstruct verdict emit <receipt.json>`) into
  `labs/receipts.jsonl`, append-only and chained like the audit ledger. A
  receipt is portable only if its refusal codes are registered (G10);
  `verdict rollup` reads fresh receipts and polls the rest.
- The lifecycle (G7) is a forward-only ladder
  (`Live -> Beta -> In Development -> Backburner -> Archived -> Tombstoned`).
  `history[]` records the transitions and `status` must agree with the last
  one; a backward step, a malformed history, or a status mismatch refuses.
  `govstruct retire <id>` tombstones a member as a governed write: it keeps
  the row so an old id still resolves (never a 404), appends the Tombstoned
  transition, and logs one ledger row. Retirement is terminal - a second
  retire refuses. A tombstone with neither an alias nor its history is a lie
  about a member that never existed (`E_TOMBSTONE_EMPTY`).
- The audit address canonicalizes RECURSIVELY (keys sorted at every depth).
  A shallow key sort drops nested keys from the hash, so a rewritten verdict
  row or actor id would not break the chain - tamper-evidence would be a lie.
  Any change to `entryAddress` re-addresses the committed ledger over
  unchanged bodies.

## Branches
- `staging` is the permanent integration branch: work branches off it, PRs
  target it, and promotion to `main` is the only path out. Never delete it.
- CI covers `staging` as well as `main`. Any deploy job is gated
  `if: github.ref == 'refs/heads/main'`.
- Promote by FAST-FORWARD so drift cannot happen: `git push origin staging:main`.

## Release
- 0.9.0 is the manual bootstrap publish (the family convention: 0.x lands
  by hand). 1.0.0 and later ride the governed ladder: tag v1.x.0 →
  publish.yml runs (OIDC trusted publishing, refuses 0.x versions).
- CHANGELOG.md is Keep-a-Changelog; every PR adds an Unreleased item.
