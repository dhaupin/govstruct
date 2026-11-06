---
permalink: discussions/announcing-v1.1.0
layout: default
title: Announcing v1.1.0
description: v1.1.0 ports the concurrency lever into the online doctor, lands the coreforge rename in the manifest, and moves the docs lane to the family canon.
version: 1.1.0
---

# Announcing v1.1.0

govstruct is the controller layer for a family of repos: one manifest of members, one render surface per deployment shape, one doctor verb that verifies every adopter serves the same truth. v1.1.0 is the scan-speed round on top of the 1.0.0 stability line: the online doctor races its probes through one bounded pool, the `flowforge` -> `coreforge` rename lands in the manifest with an alias for old readers, and the docs lane moves to the family canon.

## Install

```shell
npm install --save-dev govstruct
```

## What ships

- **`doctor --network --concurrency N` (the crashtest#83 lever, ported).** The online leg probed each member serially - url resolvability plus npm existence, two round-trips per member - so a 23-member roster paid 46 serial round-trips end to end. The probes are independent, so the leg now races them through ONE bounded pool (`src/pool.mjs`, the family shape poststruct's external probe pool already carries): `--concurrency N` runs up to N members at once, default `1` (the old serial loop byte-for-byte). Results land at the member's ORIGINAL index, so the refusals and the check roll-up stay in roster order whatever order the probes complete in - a raced run is order-identical to the serial one. The offline doctor is untouched: it stays socket-free and byte-deterministic.
- **`doctor --network --per-member`.** An opt-in per-member accounting table (id | durationMs | urls | npm | pending) plus a run-level wall roll-up, the same shape crashtest's `--per-row` reads. Opt-in because wall timing is non-deterministic and must never ride a default run.
- **Flags ride the online leg.** `--concurrency` and `--per-member` are refused without `--network` (exit 2), and a non-integer or sub-1 concurrency is a usage error; both are screened by name, so a typo never silently changes mode.
- **The rename lands.** The member `flowforge` is now `coreforge`: `members/coreforge.json` carries the new id/name/url/repo/npm with `aliases: ["flowforge"]`, so a consumer that still knows the old id reads "renamed", never a 404. The `pending` annotation narrows to `npm` alone - the repo and domain are live, the npm name is declared but unpublished. `flowforge` stays in `names.reserved`.
- **The docs lane is the family canon.** `scripts/sync.mjs` now emits `site.url` as the ORIGIN plus a separate `basePath` carrying the deploy path, and `linkCheck: true` is explicit. That exposed a latent config bug: govstruct was one of two repos that baked the deploy path into `site.url` and omitted `basePath`, so the strict link check resolved every root-absolute `/govstruct/...` href against the output tree and reported 75 false-positive broken links. The canon shape clears them.
- **The docs lane folds into one workflow.** The local reusable `docs-build.yml` fork and its `docs-deploy.yml` caller are deleted; `docs.yml` calls the family's one reusable lane directly.
- **Pins, never floats.** Every GitHub Action `uses:` names a 40-hex commit SHA, guarded by `scripts/check-action-pins.cjs`, and the release ladder no longer parses `npm pack --dry-run --json` (the phone's npm answers that probe with empty stdout) - it derives the expected set from a real `npm pack`.

## Where to go next

- [Surface contract](/govstruct/surface/) - the stability contract a consumer binds to
- [Packs](/govstruct/packs/) - the pack lane over this controller
- The repo with the full CHANGELOG is [dhaupin/govstruct](https://github.com/dhaupin/govstruct)
