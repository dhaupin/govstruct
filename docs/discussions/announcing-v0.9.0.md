---
permalink: discussions/announcing-v0.9.0/
layout: default
title: Announcing v0.9.0
description: v0.9.0 ships the controller layer - one manifest of members, the render surfaces, the doctor gate, the check packs, and the suite roll-up, on npm as the manual bootstrap release.
version: 0.9.0
---

# Announcing v0.9.0

govstruct is the controller layer for a family of repos. One manifest of members, one render surface per deployment shape, one doctor verb that verifies every adopter serves the same truth. The crosslink mesh (the apps menu, the README tables, the status registry) stops being hand-typed N times and becomes governed data with teeth. v0.9.0 is the first release line, the manual bootstrap publish that put the controller layer on npm.

## Install

```shell
npm install --save-dev govstruct
```

Then the first pass:

```text
npx govstruct lint
npx govstruct render apps
npx govstruct doctor
npx govstruct registry
```

## What ships

- **The manifest grammar (lint).** A member block carries an id that matches its filename, https and unique urls, an explicit order, and the shared vocabulary. A malformed block refuses by name rather than rendering a half-truth.
- **The dependency graph.** `needs[]` edges, a topological sort, and a drift meter so a member that requires another is never rendered ahead of it.
- **The render surfaces.** `apps | react | partial | readme | registry`, emitted statically, so the apps menu is a build-time artifact and never a runtime fetch.
- **The doctor.** Offline by default: the default run is a deterministic read of the committed data, and an online leg is a separate opt-in mode.
- **The check host and the source-consistency packs.** packstruct SPEC v1 packs over the tree, each a pure-reading verifier, gated by a committed verdict ledger.
- **The registry roll-up.** Floors, env keys, pins, and versions gathered into one canonical `apps.json` and the rendered `registry.json`, with CI refusing drift.
- **The refusal vocabulary.** One registered code list, so a refusal is a named thing and never a bare string.
- **init / names / migrate.** `init` scaffolds a one-member project, `names` checks a candidate id against npm, GitHub, and the roster, and `migrate` moves the tree forward.

## The release ladder

0.x is the manual bootstrap ladder, landed by hand. The governed ladder begins at 1.0.0: tag v1.x.0 and `publish.yml` runs the three-job family release ladder over OIDC, refusing 0.x at the gate. The full runbook lives in DEPLOY.md in the repository.

## Where to go next

- [Surface contract](/govstruct/surface/) - the stability contract a consumer binds to
- [Packs](/govstruct/packs/) - the pack lane over this controller
- The repo with the full CHANGELOG is [dhaupin/govstruct](https://github.com/dhaupin/govstruct)
