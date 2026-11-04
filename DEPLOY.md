# DEPLOY.md - govstruct release runbook

govstruct is an npm tool. "Deploy" = publish. The model follows packstruct exactly.

1. **0.9.x is manual.** While the major is 0.x, publishing is done by a human with `npm publish`. The publish workflow REFUSES 0.x versions.

## Release atomicity

- The CHANGELOG `[Unreleased]` section is staged content, not a release. At publish time it is flipped to the dated version header IN the same commit that carries the tag, so the git push and the npm release tell one story.
- Never mint a patch version for a docs-only change after a published release: prefer retagging the same commit over a version bump.
- A `[Unreleased]` section sitting untagged across two or more pushes is the misriff signal.

## Ladder to automated publishes

1. Bump `package.json` + `CHANGELOG.md` to 1.0.0 (Unreleased → Dated).
2. Run `npm test` + `npm pack --dry-run` locally. Tag `v1.0.0` and push.
3. `publish.yml` - the family release ladder (eyestruct@4e2b552), three jobs:
   - **publish** - the gate refuses 0.x and any tag that does not equal the packaged version, then `npm ci` + `npm publish --provenance` via OIDC trusted publishing (`id-token: write`, NO NPM_TOKEN secret; the `prepublishOnly` battery rides automatically).
   - **release** - `scripts/release-notes.cjs` extracts the release body from the changelog's own `[version]` section (refuses empty), cuts the GH release from the tag (idempotent), and attaches the served tarball (`npm pack govstruct@<version>`) so the GH release and npm serve the same bytes.
   - **verify** - `scripts/verify-release.cjs` re-asserts the truth after the cut: the served tarball's sha512 == registry integrity, provenance present, the full pack ladder, the release object's target commit, and the attached asset's sha512 == registry integrity.
   - Triggers: `push: tags: ['v*']` + a `workflow_dispatch` with a `verify-only` mode (re-runs the trust ladder against what is already served).
4. Thereafter: change files, bump version, tag vX.Y.Z. Done.

The pack ladder also runs offline on every push (`test/release-verify.test.mjs`).

## npm prep

- Registry name **govstruct** is namespace-checked in CI with `npm view` before publish - if it's taken, the release fails instead of clobbering. The name is free on npm as of the first build.
- **npm Trusted Publishing (OIDC), no NPM_TOKEN** - matching prestruct/ crashtest/freestruct/packstruct: the repo stores no publish secret. One-time setup on npmjs.com is required BEFORE the first tag: govstruct -> Settings -> Trusted Publisher (repo `dhaupin/govstruct`, workflow `publish.yml`). The manual 0.9.0 bootstrap already ran to create the package, because OIDC cannot create a brand-new package (npm/cli#8544).

## The gate

`npm test` is the spine (the test suite + two-way fixtures). The dogfood is `npx crashtest run` (the lint contract under a hostile corpus). CI runs both on every push to `main` and `staging`; the publish job runs the `prepublishOnly` battery before it publishes, the `release` job cuts the GH release with notes extracted from the changelog and attaches the served tarball as the release asset, and the `verify` job re-asserts the served tarball and the release object after the cut.

## Branches

- `staging` is the permanent integration branch. Work branches off it, PRs target it, and promotion to `main` is the only path out.
- Promote by FAST-FORWARD so drift cannot happen: `git push origin staging:main`.
