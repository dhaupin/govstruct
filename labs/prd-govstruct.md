# PRD: govstruct (the controller layer)

**Status:** draft v0.2, proposal for owner review · name locked pending stub (npm `govstruct` verified free, registry 404 on 2026-10-28; GitHub `dhaupin/govstruct` also unclaimed same day; re-verified free 2026-10-29)
**Author:** Buffy, 2026-10-28 (v0.2 compliance expansion 2026-10-29) · **Owner:** dhaupin · **Build site:** gistory (the ferry factory - staging tree + CI battery per the gistory-monorepo doctrine); source of truth upstream is the private `dhaupin/railway`
**Companion instances (the proven template sources):** the sibling PRDs prd-packs, prd-factory, and prd-poststruct live in the fleet repos; the copies formerly kept in this repo's horcrux/ were pruned 2026-10-28. Their receipts survive in labs/TASKS.md.
**Session context:** drafted after the creadev.org site walkthrough found the exact failure this layer prevents (see §2). v0.2 widens the mandate from mesh truth to fleet compliance, at owner request (see §14).

---

## 1. One-line pitch

**govstruct is the controller layer of the struct family: one manifest of family members, one render surface per deployment shape, one doctor verb that verifies every adopter serves the same truth.** The family's crosslink mesh - the apps menu, the README tables, the status registry - stops being hand-typed five times and becomes governed data with teeth. The apps menu is payload #1, not the product: governance over how the family links, states, and pins itself is the product.

## 2. Why it exists (the evidence, not the idea)

- **The parity failure has already happened, twice.** During the 2026-10-28 walkthrough of creadev.org: (a) three multi-source copies of project data drifted independently - the site carries its own projects.js while the same facts (status, description, links) live separately in nine GitHub READMEs and are rerendered nowhere; (b) the email-hiding law was broken by *inertia*, not malice: the Hello Traveler head comment shipped plaintext `hello@creadev.org` across 17 pages because one template beats 16 pages and no doctor watches prose law across repos. The menu parity problem the owner surfaced the same day ("keep this updated and in parity across repos") is the same class: **family truth with no single source and no doctor.**
- **The update ritual is currently a human diffing nine repos.** Adding or renaming one family member today = edit the site card, edit nine READMEs, edit (eventually) nine headers. govstruct makes that one manifest edit shipped with provenance.
- **The names are free and the seat is empty.** Verified 2026-10-28: `govstruct` free on npm and GitHub; runner-up `navstruct` also free; `weft` (the weave-metaphor candidate) TAKEN on npm and excluded. Owner ruling (2026-10-28): names the layer, not the widget - governance ships first as payload #1 (the apps menu), and the name holds the room the layer grows into.
- **The family's own doctrine demands it.** packstruct already proved the shape: "one manifest, one entry contract, one conformance verb" - but packstruct governs *packs inside a repo*. govstruct governs *the family level*: what the members ARE (manifest), what they SAY about each other (render artifacts), and WHAT SERVES AS PROOF (doctor). This is the layer every other arm assumed someone else owned.

## 3. The fifth arm - family division of roles

Owner framing (2026-10-28): govstruct is the fifth and **final** arm. The family reads, after this, as one coherent organism:

| Arm | Its verb | What it owns |
|---|---|---|
| **govstruct** | **govern** | the manifest of members; the render surfaces; the doctor over family truth; release pins |
| **packstruct** | **spec/contract** | the /packs contract; one manifest/entry/lifecycle shape; lint + audit-conformance |
| **crashtest** | **attack** | adversarial in-process QA; seeded campaigns; verdicts that refuse new exploits |
| **eyestruct** | **watch** | deterministic look/diff over rendered surface; committed memory in `labs/.eyes/` |
| **poststruct** | **audit** | the audit over **what actually shipped** - baked HTML, links, i18n, feeds against the head contract |

Construction arms (not arms of the five): **monoforge** stamps the fleet repos; **flowforge** rigs the sites; **freestruct/prestruct** dress the docs/landing. govstruct is the organism's central point - everything else is anatomy.

**Why five is final:** the family now covers write (spec), attack (test), watch (visual), audit (shipped-truth), and govern (control). Adding a sixth arm would overlap one of these five - the shape is closed, and the doctrine records it so scope creep get named and refused.

## 4. The v1 payload: the family manifest (`apps.json`)

One file, the whole family truth. Shape mirrors packstruct v1 discipline (fields draw from *actual served reality*, not speculation):

```
members/<name>.json        # one block file per member
apps.json                  # compose + order + meta (version, stamp)
```

Each block file:

| Field | Type | Rules |
|---|---|---|
| `id` | string | kebab-case, MUST match filename - mismatch is a load error, never silent |
| `name` | string | display name exactly as the family says it ("Prestruct", "Creadev.org") |
| `url` | string | https; unique; must resolve (doctor checks, never trusts) |
| `blurb` | string | one line, no marketing spin (docs-style gates will lint prose voice) |
| `icon` | string | token-referenced glyph id, renders everywhere; no bitmaps in v1 |
| `order` | integer | position in the menu / readme table; always explicit, never array-luck |
| `arm` | string (enum) | `construction` \| `arm` - needed so the docs and site can render the 5-arm chart without inventing a second truth source |
| `status` | string (enum) | `Live` \| `Beta` \| `In Development` \| `Backburner` \| `Archived` - single registry, one truth (solves the status-drift found in §2) |

**v1 members (the 10 the menu needs):** prestruct, freestruct, packstruct, crashtest, eyestruct, poststruct, monoforge, gistory, flowforge, creadev-org (the home site itself).

## 5. Render surfaces (governed output, statically emitted - never fetched)

The doctrine the whole layer rides: **the family mesh must exist in the served HTML.** No runtime fetch, no CDN-injected widget, no hydrate-only menu. Every surface below is *emitted at build/publish time* from the manifest, so a bot reads a plain anchor:

1. **`apps.react.jsx`** - for flowforge `web/` consumers: a component that renders the full pane server-side (initial HTML carries every `<a href>`); browser hydration only adds the open/close behavior, which reuses the existing mobile-menu state machine (button `aria-expanded`, Escape closes, focus returns) but as a **second burger, always, desktop included** - grid glyph (3×3 dot matrix) as the visual cue, same pane styles as the existing menu, named `apps-menu` in scope, no code or classes shared silently.
2. **`apps.partial.html`** - for Jekyll/docs consumers (flowforge docs rig): pure HTML+CSS, zero JS, dessert-styling only. Integrates as an include with its own stylesheet namespace; reuses token palette so light/dark just works.
3. **`readme.md`** - generated table snippet: name | url | blurb | status, ready to paste into the nine existing project READMEs (manual paste, generated content - parity by construction).
4. **`registry.json`** - machine-readable manifest export for anything that wants to consume the truth programmatically (auditors, CI, the site's own projects.js eventually).

Ordering: `order` field wins; equal orders refuse at author time (`doctor`), never silently rethrow.

## 6. The doctor (the load-bearing half)

Small, toothy, refusing - the same shape that made packstruct's linter the immediate payoff:

```
govstruct lint            # manifest fields, id==filename, https, unique urls, order collisions, copy voice
govstruct render <target> # emit react | partial | readme | registry from the manifest
govstruct doctor --pin <v># adopter-side: verify committed artifact checksum matches the pinned govstruct version
govstruct lock            # archive + sha256 receipt, monoforge-shaped
```

The doctor REFUSES, never warns-into-green: duplicate ids, URL/HTTPS breaks, menu order collisions, any artifact whose checksum moves without a version bump. Refusals are nameable at author time (the crashtest#16 lesson baked in from day one).

## 7. The four arms consume govstruct (the self-proof)

This is what makes govstruct the fifth arm rather than a fifth app: **the other four verify it, and it verifies them.**

- **packstruct:** govstruct's own `/packs` machinery adopts SPEC v1 (pack.json shapes, entry contract); the govstruct-lint grammar is a `check`-profile pack candidate - one contract, two consumers of it, no second dialect.
- **crashtest:** a `govstruct-manifest-shapes` scenario pack (in-process, no sockets) attacks the loader: duplicate ids, order collisions, non-https url, id≠filename, artifact checksum drift - each must verdict REFUSED honestly and FIXED honestly in the two-way fixture pattern the family already runs.
- **eyestruct:** the rendered apps pane across adopters gets `look` + `diff` per adopter; the apps-pane visual contract lives in `labs/.eyes/` and CI-gates on unexplained drift between adopters - "the menu looks like the sibling's menu" becomes a testable fact, not a wish.
- **poststruct:** every adopter's baked output gets audited for the mesh contract: crosslinks resolve, all ten anchors present, no plaintext emails (the §2 lesson encoded as law), hreflang/i18n basics intact. "Parity" stops being a claim and becomes the audit receipt.

The dogfood flywheel the family already runs (crashtest eating itself, eyestruct auditing packstruct's output, poststruct auditing freestruct-deployed docs) gains its last spoke: **the family audits its own government.**

## 8. Distribution and the update ritual

- **Pins, never floats** (the house rule): every adopter pins `govstruct@x.y.z` (flowforge vendors it for `web/` and docs templates; standalone repos depend directly). Outputs are committed artifacts, not runtime imports of the registry - a bot never fetches at request time.
- **The update ritual:** edit `apps.json` in govstruct → doctor green → publish (OIDC, provenance-attested like packstruct@1.0.0 - no stored token) → robot PRs the pin bump to every adopter (one PR per repo, dependabot-shaped, reviewable, no silent auto-merge). Adopter CI rejects any staged artifact whose checksum doesn't match its pin.
- **Build home:** gistory, in the factory - a `govstruct-staging/` tree in the gistory monorepo rides the same ferry the other three struct repos proved: gistory's CI battery (typecheck ×3, lint, real-crypto sync smoke, crashtest pack) gates move day, then the standalone repo `dhaupin/govstruct` receives it, monoforge-stamped from proven blocks. This matches the documented gistory doctrine ("this repo's CI is the battery each project must pass before move day") and gives govstruct one more proven proof than poststruct had at day one.

## 9. Site & docs (fleet pattern, no novel infrastructure)

- **Landing = govstruct.creadev.org** - Cloudflare Pages, wrangler.toml + functions `/api/health` canary, identical schema to the other four. Copy law: every number on the page is a receipt; "governance" claims must point at a doctor verb or a ruling.
- **Docs = docs.creadev.org/govstruct** - shared fleet docs host, Jekyll + Pagefind + Freestruct basePath-aware + poststruct auditing the output (the triple dogfood for its 5th seat - the fleet pattern exercised for real).
- **The apps menu dogfoods its own product on day one:** govstruct's landing ships the pane rendered from its own manifest - the product is its first adopter, and its own doctor runs in its own CI.

## 10. Honest limits (day one)

- **Status registry truth borrows from the site, it does not yet replace it.** The site's projects.js carries dev-local nuance (long descriptions, taglines, per-card images) that the manifest does not govern - v1 governs only the *mesh* truth (url, status, order, arm), not card prose. Unifying those is a later, evidenced move, not a day-one law.
- **One menu shape right now.** Variants (footer crosslinks, footer, logo-only compact) are unimplemented helpers; the first real second shape graduates the renderer from proposal to proven (rule of three applies to surfaces too).
- **README parity stays manual paste.** The generated snippet exists, the robot does not rewrite nine READMEs unattended in v1 - owners review, humans paste, receipts accumulate.
- **No incremental rollout gate yet.** The doctor checksums binaries but doesn't yet verify *every* adopter served the same one; the eyestruct look/diff adopter matrix (§7) is the closest proof and starts at 2 adopters minimum.

## 11. Non-goals

- **No runtime menu service, no CDN-injected widget, no fetch-on-mount.** The served HTML is the contract (backlink-first doctrine).
- **No governance of card prose, images, or marketing copy.** Only mesh truth (§10, first limit).
- **No auto-runbook rewrite of any adopter repo by the robot.** PRs only, reviewed merges only.
- **No new scouting of "gov" coverage.** Genuinely: the manifest, the render surfaces, the doctor, the four-arm dogfood - full list; anything else waits for the rule of three.

---

## 12. Milestones

- **M0 - proposal + name lock.** THIS doc; publish `govstruct@0.0.0-stage` placeholder stub to npm (the family's staged-publishing ritual, same crashtest/packstruct/eyestruct precedent) to hold the name; file the naming ruling (navstruct reserved, `weft` excluded as npm-taken).
- **M1 - manifest + doctor + surfaces.** `govstruct-staging/` in the gistory monorepo; `apps.json` v1 inked with the 10 members and their verifiable truths; `lint`/`render`/`doctor` verbs green; artifacts (react/partial/readme/registry) emit; crashtest shape pack and packstruct conformance pack both green. Stamp target 0.9.0 in gistory's battery.
- **M2 - move day + first adopters.** Standalone `dhaupin/govstruct` (monoforge-stamped), OIDC-release ladder per flowforge's release template; flowforge consumes the manifest (menu machinery lands for `web/` and docs rig); first adopters: creadev.org site header + the 9 family READMEs pasted from the generated snippet; provenance-attested `1.0.0` once the first real consumer is pinned.

## 13. Open questions for Rook

1. **Menu status dots:** show `Live/Beta/...` pills inside the pane, or keep the menu statusless? Lean: statusless - "menus should not have badges in them" reads cleaner, but if yes, the status field in §4 becomes rendered truth and eyestruct gets more to watch. Owner leaning asked.
2. **Icon surface:** dictionary-glyph (text reps and tokens only, v1) vs. per-member SVG mini-captures now? Lean: tokens in v1, SVG family crest later (eyestruct look/diff will police it anyway).
3. **Stub timing:** publish `govstruct@0.0.0-stage` now (locks name tonight) or at M1 with the manifest inked? Lean: now - cheaper than losing the shelf spot, matches the family precedent, and tonight's session also produced the eyestruct OIDC lesson so releasing in the same window keeps the ritual warm.
4. **Scope of the 10th member (`creadev-org`):** roots and index - should the home site's OWN header get the pane too (every page announcing the family), or only the nine tool sites carry it and the home site stays consumer-only? Lean: pane everywhere, including home; the mesh is stronger when the hub carries it too.

---

# PART II - the compliance expansion (v0.2, 2026-10-29)

Owner request, verbatim in intent: *"how it works with projects to do compliance, configs, env, (like min npm versions, etc?), or anything else that fits that struct bucket."* Part I governs the mesh (who the family is). Part II governs the conformance (what the family must satisfy). Both are the same disease in §2: **family truth with no single source and no doctor.**

## 14. Why this is a widening, stated honestly

Part I §11 non-goaled exactly this: *"No governance of card prose, images, or marketing copy. Only mesh truth."* Part II deliberately reverses that non-goal for a second class of truth, so it must pass the same bar every family addition passes:

- **Evidence first.** Each governed surface below cites drift that already exists in the fleet today, verified 2026-10-29, not imagined. No surface ships on a hunch (the rule of three, applied to governance).
- **A distinct bucket.** Mesh truth and conformance truth are both "what the family says about itself," but they have different owners (a member's *identity* vs a member's *build*) and different failure times (a wrong URL reads wrong to a human; a wrong floor breaks a consumer's install). Keeping them as two manifest blocks, not one, is the whole reason the widening is coherent rather than scope creep.
- **Still not prose.** Card copy, taglines, marketing voice stay out of scope. The conformance bucket is mechanical facts only.

## 15. The four governed surfaces (the compliance contract)

Each surface is a manifest block, a doctor rule, and a pack. All four are **receipt-backed**: the drift they name was measured in the fleet, not assumed.

### S1 - Runtime floors (`engines`)

The fleet's node floors have already drifted, with no registry holding them:

| member | `engines.node` | note |
|---|---|---|
| packstruct | `>=20` | battery floor (ESM conformance via `require(esm)`) |
| poststruct | `>=20` | |
| eyestruct | `>=18` | consumer floor |
| flowforge | `>=18` | |
| gistory | `>=18` | |
| crashtest | `>=18.17` | the odd patch floor - DEPLOY.md states it, nothing explains it |

Six members, three distinct floors, one of them a patch floor (`>=18.17`) nobody can explain from the outside. A consumer asking "can I use this on node 18?" today reads six READMEs and hopes. **govstruct holds the floor table as data** and the doctor refuses a member whose shipped `engines.node` disagrees with its manifest row. The distinction the family already draws (consumer runtime floor vs battery floor, packstruct's own docs) becomes a *field*, not a footnote: `floors: { consumer, battery }`.

### S2 - The env registry (the `EYESTRUCT_*` precedent, generalized)

eyestruct already proved the shape: `docs/env.md` is a frozen surface, and a battery leg derives the live inventory **from the source** so a key cannot appear in code unannounced (`tests/contract.test.js`). That is exactly right, and it exists in one repo. Part II lifts it to the fleet:

- Every member declares its env keys in the manifest (`env: [{ key, reads, default, notes }]`).
- The doctor runs each member's own inventory leg (via its public CLI, per the interop law §16) and refuses a manifest that has drifted from the code.
- The roll-up emits **one fleet env page** (docs.creadev.org/govstruct/env) so "what env does the family read?" is one address, not six.

No other `*STRUCT_*` name is read anywhere - a name absent from the registry is dead code by definition (eyestruct's rule, now the family's).

### S3 - The pin ledger

The family's pin discipline is real and scattered across five places:

| pin class | today it lives in | example |
|---|---|---|
| companion spec pin | `implements: packstruct@1` (SPEC §8 row 1) | eyestruct, poststruct |
| companion devDep | exact devDependency (SPEC §8 row 5) | `packstruct@1.0.0` |
| engine pins | MANIFEST.md prose | freestruct `dfb30aa498`, prestruct |
| action pins | `.github/workflows/*` (flowforge birth-gate check 5) | 40-hex `uses:` SHAs |
| capture pin | `labs/.eyes/manifest.yml` | `local-chrome@154.0.8037.57` |

Five classes, five homes, one concept: *what this member is bound to.* govstruct holds the pin ledger as data and the doctor refuses an unrecorded pin. It does NOT replace the per-repo surfaces (the SHA still lives in the workflow where it is enforced) - it **indexes** them, so "what is the fleet pinned to right now?" is answerable in one place and a bump is a reviewable diff. This is the same index-vs-own split the eyestruct-manifest case already uses.

### S4 - Version truth

flowforge's census leg (`tests/census.test.cjs`) already encodes the law: `package.json` is THE single version source, and `web/package.json` plus the README status line must match or the release commit fails. Part II generalizes it: any living surface in any member that names the current version (a second `package.json`, a README status, a docs frontmatter `version:`) is checked against the root. The lawful exceptions flowforge already classified (dated era rows, range pins `^1.0.0`, other packages' versions) carry over verbatim.

## 16. The mechanism: compliance rules ARE check-profile packs

This is the unification that keeps Part II from inventing a second grammar. The packstruct SPEC v1 `check` profile is: an ES module whose default export is `{ checks: [Check] }`, declarative pure-reading verifiers over files on disk, no transport, armed by being enumerated in the host config. That is *exactly* what a compliance rule is.

So every surface above ships as a pack:

```
packs/public/
  floor-shapes/pack.json     # S1: engines vs manifest row
  env-shapes/pack.json       # S2: declared keys vs source inventory
  pin-shapes/pack.json       # S3: pin ledger vs the surfaces that enforce it
  version-shapes/pack.json   # S4: root version vs every living claim
```

Consequences, all of them free:

- **packstruct lints govstruct's own packs** - the family's manifest grammar, reused, not re-dialected. govstruct is a `check`-profile host exactly like poststruct.
- **crashtest attacks the loader** - a `govstruct-manifest-shapes` scenario pack (Part I §7) now covers the compliance blocks too: a floor row that disagrees with `engines`, an env key present in code but absent from the registry, a pin recorded with no enforcing surface.
- **The interop law governs the crossing** (SPEC §8 row 4): govstruct never imports a sibling to check a sibling. It invokes the sibling's **public CLI**. Prose law is poststruct's (`--module language`); pack shape is packstruct's (`lint --deep`); adversarial shapes are crashtest's; pixels are eyestruct's. govstruct orchestrates verdicts; it re-implements none of them.

Where each check runs (three tiers, same pack):

| tier | who runs it | over what |
|---|---|---|
| author time | `govstruct check` (local) | the govstruct tree |
| adopter CI | `packstruct lint` + the pack | the adopter's own tree |
| fleet roll-up | `govstruct doctor --fleet` | every manifest row vs every member's real state |

## 17. How it works with the forges and the factory

Owner framing: *"would work with the forges (monoforge and flowforge) through a factory using those struct and forges (the new railway repo, or Gistory with its prototype). Railway is the source of truth tho."*

**The factory composes verification structs with construction forges.** Read that way, the roles already exist:

- **monoforge (construction: stamps repos).** Today its doctor verifies a stamp against `FORGE-TODO` truth slots, which are prose the author must fill. govstruct makes part of that slot set **verifiable**: the floor, the pins, and the env registry are read from the manifest, so a stamp is born with its conformance facts already checked, not promised. The stamp becomes the *first* compliance gate.
- **flowforge (construction: rigs sites).** govstruct's render surfaces (Part I §5: `apps.react.jsx`, `apps.partial.html`) are flowforge deliverables - they ship in the rig, and the rig's birth-gate gains the fleet floor as a second input. A new site birthed from the rig inherits the mesh pane and the floor check in one step.
- **gistory (the prototype factory).** The staging-mount + ferry doctrine is already the mechanism: `*-staging/` trees ride `monoforge-ferry.yml` (sha256-gated, converge-on-HEAD) into standalone repos. govstruct rides the identical ferry - no new infrastructure, the proven lane.
- **railway (the source of truth).** Designed role: the factory definition that composes the structs (verification) with the forges (construction), with gistory holding the working prototype. In that reading govstruct is a **compliance provider into railway**: railway asks "is this tree conformant?", govstruct answers with a doctor verdict. Honest caveat: `dhaupin/railway` is private and was not readable from this session (zero public hits for "railway" across every cloned member), so this paragraph is designed against the *stated* role, not a verified tree. Everything above it in Part II is grounded in readable repos; this bullet is the one that needs the owner to confirm the interface.

## 18. The full build-out (repo shape, CI, web, docs, packs)

Mirrors flowforge plus the struct siblings, so nothing is novel:

```
govstruct/
  bin/cli.mjs                 # zero-dep CLI, exit 0-1-2 (packstruct shape)
  src/                        # lint, render, doctor, check, registry, lock
  spec/                       # the compliance contract, versioned like SPEC.md
  members/<name>.json         # the mesh blocks (Part I §4)
  compliance/<name>.json      # the conformance blocks (Part II §15)
  apps.json                   # composed manifest (mesh + compliance + meta)
  packs/public/*/             # the four shape packs (Part II §16)
  web/                        # flowforge landing shell (prestruct-prerendered)
  docs/                       # flowforge Jekyll rig (Pagefind + freestruct)
  scripts/                    # the birth gate + docs gates, inherited
  .github/workflows/          # test.yml, crashtest.yml, docs.yml, publish.yml, compliance.yml
  labs/                       # work log, crashledger, .eyes
  horcrux/                    # stones, lock archives
  README.md AGENTS.md CHANGELOG.md DEPLOY.md MANIFEST.md LICENSE
```

**Verbs** (Part I §6 extended):

```
govstruct lint                  # mesh + compliance manifest grammar
govstruct render <target>       # react | partial | readme | registry
govstruct doctor [--fleet]      # adopter-side or fleet-wide truth battery
govstruct check                 # run the four shape packs over this tree
govstruct registry              # emit the fleet roll-up (env/pins/floors/versions)
govstruct lock                  # archive + sha256 receipt (monoforge-shaped)
```

**CI** (the flowforge battery, plus one new lane):

| workflow | gates |
|---|---|
| `test.yml` | `node --test` spine + the version-truth census + `npm run check` (docs gates + birth gate) |
| `crashtest.yml` | the `govstruct-manifest-shapes` scenario pack (in-process, no sockets) |
| `compliance.yml` (new) | `govstruct doctor --fleet` over every adopter at a pinned rev; refuses drift, emits the roll-up artifact |
| `docs.yml` | Jekyll + hardened pagefind scrape + pinned freestruct layer + Pages |
| `publish.yml` | OIDC trusted publishing, 0.x refused, tag == packaged version |

**web/ and docs/** are the flowforge rig verbatim (identity swapped), per the house rule "adopt explicitly, start from a checkout." **packs/** is the packstruct SPEC v1 slot, shipping the four shape packs.

**The birth gate is inherited as-is** (`scripts/check-birth-gate.cjs`): YAML-parse every workflow, declare mounts, serde-before-graphs, determinism proof, pins-never-float (SHA-pinned actions), reusable-workflow contract. A govstruct that fails the family's own birth gate never ships - which is Part I §7's "the family audits its own government," made literal.

## 19. Milestones (v0.2 additions)

- **M1.5 - compliance contract inked.** `spec/` v1 for the four surfaces; `compliance/<name>.json` populated for all 10 members from *measured* reality (the floor table §15 S1 is the first receipt); the four shape packs lint clean under packstruct.
- **M2.5 - the fleet roll-up is real.** `govstruct doctor --fleet` green over at least the 6 tool members; `registry` emits the env/pins/floors/versions pages; `compliance.yml` gates them in CI. Rule-of-three: this waits until at least two members have adopted the manifest before it claims "fleet."
- **M3 - railway integration.** Owner-confirmed interface: how railway consumes govstruct verdicts (a provider call? a manifest read? a CI gate?). Out of scope until the private repo's shape is stated, because it cannot be verified from outside.

## 20. Honest limits (v0.2)

- **Index, not replacement.** The pin ledger and env registry *index* facts that live (and are enforced) in the member repos. govstruct does not become the enforcement point - the workflow SHA and the source-derived inventory stay authoritative where they already are. Removing a per-repo surface is a later, evidenced move.
- **Railway is designed-to-role, not verified.** §17's railway bullet is the only part of Part II not grounded in a readable repo.
- **The floor table is a snapshot.** Floors move; the manifest row is only as true as the last doctor run. The roll-up is a receipt with a timestamp, never a live guarantee (the eyestruct-ledger honesty rule, applied to governance).
- **Four surfaces, not "everything."** A fifth surface waits for its own measured drift, per the rule of three. "Anything else that fits the bucket" is answered by the *contract* (how a surface is added), not by pre-emptively listing more.

## 21. Open questions (v0.2)

1. **One manifest or two?** Mesh blocks (`members/`) and compliance blocks (`compliance/`) as separate files composed into `apps.json`, or one file per member? Lean: separate - different owners, different change cadence, and the mesh blocks are the ones that render publicly.
2. **How loud is a floor mismatch?** Refuse the release, or warn into the roll-up? Lean: refuse at author time (`govstruct check`), warn in the fleet roll-up (a lagging adopter is a state, not a crime) - the same author-time-vs-run-time split packstruct already draws.
3. **Does the floor field carry the battery floor too?** packstruct's docs distinguish consumer floor from battery floor. Lean: yes, two fields (`consumer`, `battery`), because the distinction is already load-bearing in one member's docs and would otherwise be re-invented.
4. **railway interface.** The one blocker that is not a design question but an owner statement: how does railway want govstruct verdicts delivered?
