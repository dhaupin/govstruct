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
  pack shape. A finding code survives to the report only if it matches
  `/^[A-Z][A-Z0-9_]*$/` (digits allowed - the `E_A11Y_*` family needs them);
  anything else is renamed to `E_SUITE_DRIFT`.
- The a11y/i18n floor (G8, PRD section 10 S5) is `packs/public/a11y-shapes`:
  the emitted pane must carry a named landmark, a real anchor per row, a
  `:focus-visible` rule, and keyed chrome strings with an explicit locale
  fallback. The deeper DOM/contrast leg stays poststruct's - govstruct
  invokes the sibling's CLI and re-implements nothing.
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
  byte-deterministic and never opens a socket. `--network` is its OWN mode
  (`doctor --network`), the only arm that opens a socket: it checks each
  member's url resolvability (refusing `E_URL_UNRESOLVABLE`, or
  `E_URL_INSECURE` when only the http twin answers) and each declared npm
  name's existence (`E_NPM_MISSING`). It cannot be combined with `--suite`,
  `--adopters`, or `--fleet`; the online probe is injectable so its tests never
  touch the network.

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
- The dependency graph (G3) is derived, never hand-maintained. `src/graph.mjs`
  reads `needs[]` into forward and reverse adjacency; the roll-up carries
  `graph[]` (`{ id, needs, neededBy }`), and `govstruct impact <id>` walks the
  reverse closure to every direct and transitive dependent - the propagation
  path a floor bump follows. An unknown id refuses `E_IMPACT_UNKNOWN_MEMBER`.
- The fleet meter (G13, PRD 16.10, the golden case) is the steady-state job
  the other cases are not: coreforge *prevents* (it stamps a new repo), the
  meter *detects* (a repo that left the pattern, and how). `src/fleet.mjs`
  reads each member's live surfaces - engines floor, lockfile presence, pin
  style, repo version, workflow count - against the compliance block, and
  reports every drift on one page as a typed refusal
  (`E_FLEET_FLOOR_DRIFT`, `E_FLEET_LOCK_MISSING`, `E_FLEET_PIN_STYLE_DRIFT`,
  `E_FLEET_CI_SHAPE_DRIFT`, `E_FLEET_VERSION_DRIFT`). Offline by default:
  `--fleet-root <dir>` points at a directory of `<member-id>/` checkouts; a
  member with no checkout is reported UNCHECKED, never a silent pass.
- The adopter gate (M2.5, the `compliance.yml` leg) is the low end of the
  fleet meter: the meter watches what a member SHIPS; the gate watches who
  CONSUMES govstruct, and how. `src/adopters.mjs` reads each declared adopter's
  `govstruct` pin (in a checkout named by `--fleet-root`) against the version
  the suite serves (the tool's own `package.json`) and refuses pin drift
  (`E_ADOPTER_MISSING`, `E_ADOPTER_PIN_STYLE_DRIFT`, `E_ADOPTER_VERSION_DRIFT`).
  A declared adopter with no checkout is UNCHECKED - a named state, never a
  silent pass. The **rule of three** gates the *claim*, not the gate: the gate
  refuses drift from the first adopter, but withholds the suite claim until >= 2
  verified adopters, reporting a pilot state instead of assuming the claim.
  Adopters are declared in `govstruct.config.json` as `adopters.list` (a bare id
  string, or `{ id, repo, rev }` where `compliance.yml` checks out `repo` at the
  pinned `rev`). govstruct declares none today, so its own run is an honest
  pilot, not a fabricated green.
- The roll-up has a stable address and a cache contract (G12, PRD 5.1).
  `apps.json` is the canonical composed source (members + compliance + meta);
  `registry.json` is ONE rendering of it, so one artifact has many readers and
  no divergent copies. The roll-up also emits at a versioned path
  (`registry.v1.json`) carrying an `ETag` keyed on the manifest checksum and a
  `max-age`. The doctor refuses a versioned copy whose ETag disagrees with a
  fresh render (`E_ROLLUP_ETAG_STALE`), a rendering that diverged from the
  manifest (`E_ROLLUP_NOT_CANONICAL`), and an unrenderable payload schema
  (`E_ADDRESS_VERSION_UNKNOWN`). The ETag is keyed on the checksum, not the
  rendered bytes, so it is not self-referential.
- The audit address canonicalizes RECURSIVELY (keys sorted at every depth).
  A shallow key sort drops nested keys from the hash, so a rewritten verdict
  row or actor id would not break the chain - tamper-evidence would be a lie.
  Any change to `entryAddress` re-addresses the committed ledger over
  unchanged bodies.

## The site rig (landing + docs)
- `site.config.js` is the ONE identity file (name, urls, repo, description,
  accent, paint schemes, the apps-menu surface). `web/src/site.js` re-exports
  it; `scripts/sync.mjs` fans it out to every surface that cannot import it
  (`web/ssr.config.js`, `docs/_config.yml`, `docs/freestruct.config.yml`,
  `web/public/robots.txt`, `web/public/site.webmanifest`). Edit the identity
  in `site.config.js`, then `npm run sync`; hand edits to a synced file are
  drift and fail `npm run sync:check`.
- `web/src/islands.js`, `web/src/hooks/usePageMeta.js`, and
  `web/scripts/{brand-mark.json,repair-404.cjs,og-image.mjs,adopt-icons.mjs}`
  are engine files - copy once, never edit.
- The landing's manifest pane is SERVER-RENDERED in `web/src/pages/Home.jsx`
  from the `render react` surface (`web/src/components/AppsMenu.jsx`), NOT an
  island: the doctrine (PRD 5) is that the pane exists in the served HTML as a
  plain anchor, so the product dogfoods its own output on the page that
  documents it. Regenerate the surface with `govstruct render react --write`.
- Identity lives once. The brand-census gate refuses any identity literal
  (`govstruct`, `creadev.org`, the repo url) outside `site.config.js`, and
  refuses a filename that carries the brand (`web/public/brand/logo.jpg`, not
  `govstruct-logo.jpg`).
- Gates: `npm run lint:docs` (frontmatter, links, style, fiction signatures,
  Jekyll filters) and `npm run check:rig` (birth gate, brand census, theme
  parity, sync drift). `test.yml` runs both. The birth gate refuses a floating
  `uses:` - every action is SHA-pinned with the human tag in a trailing
  comment.
- Docs deploy: `docs-build.yml` (reusable: Jekyll + pagefind + pinned
  freestruct) is called by `docs-deploy.yml`, whose deploy job is gated to
  `main`. Set the Pages custom domain to `docs.creadev.org` once in repo
  settings; `baseurl: /govstruct` serves the project path.

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
