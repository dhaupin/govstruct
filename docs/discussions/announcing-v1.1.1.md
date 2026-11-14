---
permalink: discussions/announcing-v1.1.1/
layout: default
title: Announcing govstruct v1.1.1
description: govstruct v1.1.1 - the roster admits the two newest family members, the docs lane triggers on site.config.js, the battery carries the eyestruct arm, and the family floors move.
version: 1.1.1
---

# Announcing govstruct v1.1.1

govstruct is the governance layer of the struct family: it holds the roster, the roles, the floors, and the compliance blocks that keep the suite honest about itself. v1.1.1 is a patch on the 1.1.0 line - the CLI verbs, the registry schema, and the emitted surfaces are unchanged. This cut admits the two newest members to the roster and moves the family floors. This post ships with the v1.1.1 tag: npm has the tarball by the time you read it.

```bash
npm i -g govstruct
```

## What landed

**The roster admits the two newest members.** `members/` was missing `memstruct` and `gamestruct` - the two newest shipped members, and the same two the family status islands could not see. Role and order are ruled from the PRD, not assumed: both are `product` (section 3.1, "a shipped tool or site governed by the suite"; the five `arm` slots stay closed), `order` 24/25 following the add-a-member precedent (a block file plus a doctor run). Both gain their `compliance/*.json` blocks (floors `>=22`/`>=18` from each `engines.node`; `version.repo` 0.9.0/1.2.1), the emitted surfaces re-render, and both ids join `names.reserved`. The two pinned test counts move 23 -> 25; `doctor` is green at 25 members.

**The docs lane triggers on `site.config.js` (issue #49).** `docs.yml`'s path filter named only `docs/**`, but the docs identity (`docs/_config.yml`, `docs/freestruct.config.yml`) is generated from `site.config.js` by `scripts/sync.mjs` - so an identity-only edit (name/description/url) was a real docs change the filter never saw unless the regenerated files rode the same push. The filter now names `site.config.js`.

**The battery carries the eyestruct arm (issue #35).** `test.yml` gains an arm-gated row (pinned `eyestruct@1.1.0`, gated on `labs/.eyes/manifest.yml` existing) that runs the browserless, read-only `eyestruct gate` - exit 1 on unexplained visual drift. Canon stays CI-cut in eyestruct's own ratify lane; this battery only refuses drift, and an unseeded repo stays parked instead of fake-red.

**The family floors move.** The `prestruct` declaration floor is `^1.3.0` (the SSRF-guard security round), refused below by `scripts/check-prestruct-pins.cjs`, and the family devDependency pins advance to the current cuts (`crashtest` `1.1.0 -> 1.3.0`, `packstruct` `1.0.0 -> 1.1.0`, both exact).

## Also in this round

The `.gitignore` docs block carries the in-tree Jekyll and pagefind products, so a local docs build leaves no untracked noise. The site follows the family shell: the island lists every member, the mobile nav fits the viewport, and the light default lands.

## Links

- Repo and docs: https://github.com/dhaupin/govstruct / https://docs.creadev.org/govstruct
- Release posts: https://docs.creadev.org/govstruct/discussions/
- Changelog: https://github.com/dhaupin/govstruct/blob/main/CHANGELOG.md
- Issues: https://github.com/dhaupin/govstruct/issues
