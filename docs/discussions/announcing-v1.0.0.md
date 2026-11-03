---
permalink: discussions/announcing-v1.0.0
layout: default
title: Announcing v1.0.0
description: v1.0.0 ships the surface stability contract, starter pin floors, the pending annotation, refusals not warnings, and the family release ladder.
version: 1.0.0
---

# Announcing v1.0.0

govstruct is the controller layer for a family of repos: one manifest of members, one render surface per deployment shape, one doctor verb that verifies every adopter serves the same truth. v1.0.0 is the line where the controller layer becomes something a consumer can bind to, and where the release lane moves to the family ladder.

## Install

```shell
npm install --save-dev govstruct
```

## What ships

- **The surface stability contract (PRD section 5.1).** A consumer binds to an emitted surface with a declared stability class, so a shape change is a versioned event rather than a silent break. `govstruct surface --verify` proves the contract holds against the tree.
- **Starter pin floors (PRD section 10 S3).** An integrator declares the floors its adopters must meet, and the doctor refuses a member below a floor rather than warning into green.
- **The pending annotation.** A member may declare a surface as pending, so a not-yet-live surface reads as an honest absence and never as a silent hole.
- **Adopter enrollment.** The adopter gate and the compliance lane track declared adopters, and a gate that cannot reach a checkout reports the named UNCHECKED state rather than a silent pass.
- **Refusals, not warnings.** A doctor that warns into green is politeness theater. govstruct refuses nameably at author time, every code registered in one vocabulary.
- **The ISO evidence orientation (PRD section 10).** The ISO 9001 and 27001 evidence orientation gathers the committed ledgers into one readable map, so an audit question points at a file rather than a memory.
- **The family status page (family-status@1).** govstruct serves the shared status contract, generated from its own committed crash ledger and its pack banks on every web build, with each sibling fetched live and absence shown as absent.
- **The coreforge rig, adopted (PRD section 9).** The landing and docs ship the family shell verbatim with the identity swapped, and one `site.config.js` is the single identity file that fans out to every surface.
- **The family release ladder (eyestruct@4e2b552).** `publish.yml` is now the three-job ladder: `publish` refuses 0.x and any tag that does not equal the packaged version, then runs `npm publish --provenance` over OIDC; `release` extracts the release body from the changelog and attaches the served tarball; `verify` re-asserts the served tarball's sha512 against the registry integrity, the provenance, the pack ladder, and the release object.
- **The phone publish lane.** `scripts/ship-from-download.cjs` stages a zip-extracted tree, runs the repo's own `prepublishOnly` gate, and publishes with a one-line `.npmrc` that holds only the token expansion, never the raw token in a file, in argv, or in the log.

## What the tarball carries

`bin/`, `src/`, `spec/`, `packs/`, and `LICENSE` ship in the npm tarball. The ladder makes 0.x the manual path while `publish.yml` refuses 0.x at the gate, and 1.0.0 rides npm Trusted Publishing (`id-token: write`).

## Where to go next

- [Surface contract](/govstruct/surface/) - the stability contract a consumer binds to
- [Packs](/govstruct/packs/) - the pack lane over this controller
- The repo with the full CHANGELOG is [dhaupin/govstruct](https://github.com/dhaupin/govstruct)
