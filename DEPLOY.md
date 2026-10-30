# DEPLOY.md - govstruct release runbook

govstruct is an npm tool. "Deploy" = publish. The model follows packstruct
exactly.

1. **0.9.x is manual.** While the major is 0.x, publishing is done by a human
   with `npm publish`. The publish workflow REFUSES 0.x versions.

## Release atomicity

- The CHANGELOG `[Unreleased]` section is staged content, not a release. At
  publish time it is flipped to the dated version header IN the same commit
  that carries the tag, so the git push and the npm release tell one story.
- Never mint a patch version for a docs-only change after a published
  release: prefer retagging the same commit over a version bump.
- A `[Unreleased]` section sitting untagged across two or more pushes is the
  misriff signal.

## Ladder to automated publishes

1. Bump `package.json` + `CHANGELOG.md` to 1.0.0 (Unreleased → Dated).
2. Run `npm test` + `npm pack --dry-run` locally. Tag `v1.0.0` and push.
3. `publish.yml`: `push: tags: ['v*']` + `workflow_dispatch`; tag-match
   + 0.x-refuse + idempotent already-published gates (`npm view
   govstruct@<version>`); `npm install` + `npm test`; publishes via
   OIDC trusted publishing (`id-token: write`, NO NPM_TOKEN secret).
4. Thereafter: change files, bump version, tag vX.Y.Z. Done.

## npm prep

- Registry name **govstruct** is namespace-checked in CI with `npm view`
  before publish - if it's taken, the release fails instead of clobbering.
  The name is free on npm as of the first build.
- **npm Trusted Publishing (OIDC), no NPM_TOKEN** - matching prestruct/
  crashtest/freestruct/packstruct: the repo stores no publish secret.
  One-time setup on npmjs.com is required BEFORE the first tag: govstruct ->
  Settings -> Trusted Publisher (repo `dhaupin/govstruct`, workflow
  `publish.yml`). The manual 0.9.0 bootstrap must run first to create the
  package, because OIDC cannot create a brand-new package (npm/cli#8544).

## The gate

`npm test` is the spine (the test suite + two-way fixtures). The dogfood is
`npx crashtest run` (the lint contract under a hostile corpus). CI runs both
on every push to `main` and `staging`; the publish job runs `npm test`
before it publishes, and the `github-release` job packs the npm tarball as
the release asset with a listing guardrail (shipped surfaces present,
repo-bound internals absent).

## Branches

- `staging` is the permanent integration branch. Work branches off it, PRs
  target it, and promotion to `main` is the only path out.
- Promote by FAST-FORWARD so drift cannot happen:
  `git push origin staging:main`.
