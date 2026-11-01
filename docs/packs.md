---
permalink: packs/
layout: default
title: Packs
description: The extension surface - ten SPEC v1 check-profile packs over the tree and one crashtest lane that attacks govstruct lint with a hostile member-block corpus, gated by a committed verdict ledger.
nav_order: 3
---

# Packs

This page documents govstruct's own pack lane: what the packs shipped under `packs/public/` verify, how the check host judges them, and how to write or adopt a pack. For the manifest grammar itself, see the family spec at [dhaupin/packstruct](https://github.com/dhaupin/packstruct), and for verbatim command behavior the [CLI reference](https://github.com/dhaupin/govstruct#readme).

A pack is a self-contained bundle that loads into a host's runner and proves the contract it claims to enforce. A collection of packs is a packdir, the unit CI audits. govstruct loads the same SPEC v1 grammar as every family member: `packs/public/<name>/pack.json` plus the entry it names.

## What ships today

govstruct ships ten check-profile packs plus one crashtest lane:

| Pack | What it verifies |
|---|---|
| `comment-shapes` | Comment hygiene across the tree, pure-reading, a violation named at file:line. |
| `env-shapes` | Environment-key declarations: every key a member claims is declared once, in the shared block. |
| `floor-shapes` | Engine floors: a floor bump propagates through the dependency graph, never drifts silently. |
| `hygiene-shapes` | Tree hygiene: no stray build product, lockfile, or repo-bound internal in a shipped surface. |
| `naming-shapes` | The naming contract: ids, aliases, and file names agree with the roster grammar. |
| `pin-shapes` | Pin style: pins, never floats, so every dependency and workflow `uses:` carries an exact rev. |
| `style-shapes` | The shared source-consistency rules, enforced as a pack rather than a fifth app. |
| `test-shapes` | The test floor: every member carries a real test suite, not a green stub. |
| `version-shapes` | Version truth: package.json is the single version source, and a living surface cannot hand-copy it. |
| `a11y-shapes` | The emitted pane's floor: a named landmark, a real anchor per row, a visible focus ring, keyed strings, and a locale fallback. |

The crashtest lane, `govstruct-manifest-shapes`, attacks `govstruct lint` with a hostile member-block corpus: malformed blocks refuse rather than crash, every refusal carries a registered code, and spec-allowed shapes are never over-strictly flagged. Its verdict ledger is `labs/crashledger.json`, one row per recorded scenario, pinned so an adopted row cannot silently change verdict later.

## Running the lane

```bash
npm run check       # run every check pack over the tree
npm run lint:packs  # manifest + entry grammar (packstruct)
npx crashtest run   # the dogfood: hostile member blocks over the CLI
```

The check host reads each pack's declared checks over the tree. The crashtest lane drives `govstruct lint` in-process over the corpus. The exit contract is `0` on green, `1` on findings.

## The verdict taxonomy

Every scenario lands in exactly one of four buckets:

| Verdict | Meaning |
|---|---|
| `REFUSED` | The surface said no, cleanly, with its named code. A regression here is loud. |
| `BOUNDED` | The damage was contained to a documented limit. Adopted bounds live in the ledger, not in prose. |
| `PASSED` | The safe path works end to end - checks, gates, roundtrips. |
| `EXPLOITED` | The attack landed. A new EXPLOITED or a regression of any previously recorded row fails CI. |

Adoption is explicit: a new verdict only enters the ledger through a reviewed commit. Nothing rebuilds the ledger silently.

## Writing a pack

A pack is a directory under `packs/public/<name>/` with a `pack.json` manifest (schemaVersion 1: kebab-case `name` matching the directory, `schemaVersion`, a dotted-semver `version` of the pack's own release cadence, `description`, a relative `entry` path, optional `armedByKey` plus host-owned keys). The entry is an ES module loaded by the runner regardless of where it lives: `packs/public/` is tracked and shipped, `packs/local/` is gitignored with identical loading semantics. The manifest grammar is validated once, at load, by the same rules `packstruct lint --deep` reports, so a pack that fails lint cannot quietly run.

A check-profile pack exports `{ checks: [...] }` - pure-reading verifiers over files on disk, no transport, ids namespaced by the pack slug. A scenario-profile pack returns structured findings the runner records and enforces.

## What the lane is for

The pack lane is the adversarial half of govstruct's CI battery, the same position crashtest holds in the family. It exists so the manifest grammar, the refusal vocabulary, and the emitted surfaces are attacked on every push, not audited annually.

## Roadmap

`packs/public/` grows when a failure class does. A pack lands when a second real instance of its bug appears, per the family rule of three.
