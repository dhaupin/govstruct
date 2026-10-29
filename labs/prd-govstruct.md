# PRD: govstruct (the controller layer)

**Status:** draft v0.3.1 - rewritten for the full suite roster and OSS release · supersedes v0.2 (2026-10-29) · Owner: dhaupin
**Author:** Buffy (v0.1-v0.2, 2026-10-28/29) · OpenHands agent (v0.3/v0.3.1 rewrite, 2026-10-29)
**Name lock:** npm `govstruct` verified free (registry 404, 2026-10-29); GitHub `dhaupin/govstruct` claimed 2026-10-29.
**Companion PRDs:** `prd-factory` (monoforge), `prd-railyard` (the composer), `prd-creadev-mono`, `prd-gistory`, `prd-sync` live in the fleet repos / gistory `horcrux/prds/`.
**Build home:** gistory (the ferry factory - staging tree + CI battery per the gistory doctrine); the composer is `dhaupin/railyard`.

> **v0.3.1 note.** Corrects the composer's name to **railyard** (v0.3 wrote
> "railway" from a stale note) and grounds it in the now-readable private repo:
> railyard is the parent product over the forges, and its `mounts/` registry is
> the operational twin of govstruct's manifest (§3.3). Adds §16.5, the
> **rename case study** (flowforge → coreforge/rigforge) as the tool's first
> proving operation, and the `aliases` field it forced.
>
> **v0.3 note (read first).** v0.2 governed a 10-member family and assumed every
> member was an npm tool. Both assumptions were wrong: the suite is **23 members
> and growing**, and several are sites, private repos, or unclaimed names. v0.3
> fixes the roster against served truth, **generalizes the tool for OSS** (anyone
> can govern any family with it - the dhaupin suite is the reference deployment,
> not the product), and repairs the one internal contradiction v0.2 carried (its
> §14 reversed its §11 non-goal without amending it). It also adds the member the
> v0.2 draft never had: **railyard**, the composer that actually enforces the
> suite's conformance.

---

## 0. What is general, what is the reference deployment

govstruct ships as a **general, MIT-licensed, zero-dependency tool for governing
a family of repos from one manifest**. Nothing in the tool knows the name
"dhaupin" or "creadev" - a family is a directory of member blocks plus a config,
and a third party points it at their own.

| Layer | General (ships to npm) | Reference deployment (this owner) |
|---|---|---|
| Manifest grammar (`members/*.json` → `apps.json`) | the tool | the 23-member suite roster |
| Render surfaces (react / partial / readme / registry) | the tool | the apps menu + README tables |
| The doctor (`lint` / `render` / `doctor` / `lock`) | the tool | run in every member's CI |
| Compliance surfaces (floors / env / pins / versions) | the tool | the four suite shape packs |
| The member roster, URLs, blurbs, statuses | config (data) | creadev's `projects.js` truth |
| `family-status@1` dialect, `/packs` SPEC, forges | consumed by the tool | the suite's own machinery |

**The one-sentence test for every section below:** *would a stranger with their
own five repos be able to use this?* If a section only makes sense inside the
dhaupin suite, it belongs in the reference deployment, not the tool.

---

## 1. One-line pitch

**govstruct is the controller layer for a family of repos: one manifest of
members, one render surface per deployment shape, one doctor verb that verifies
every adopter serves the same truth.** The crosslink mesh - the apps menu, the
README tables, the status registry - stops being hand-typed N times and becomes
governed data with teeth. The apps menu is payload #1, not the product:
governance over how members link, state, and pin themselves is the product.

---

## 2. Why it exists (the evidence, not the idea)

- **The parity failure has already happened, twice.** During the 2026-10-28
  creadev.org walkthrough: (a) three multi-source copies of project data drifted
  independently - the site carries its own `src/data/projects.js` while the same
  facts live separately in ~nine GitHub READMEs and are rerendered nowhere; (b)
  the email-hiding law was broken by *inertia*, not malice - the Hello Traveler
  head comment shipped plaintext `hello@creadev.org` across 17 pages because one
  template beats 16 pages and no doctor watches prose law across repos. The
  "keep this in parity across repos" ask is the same class: **family truth with
  no single source and no doctor.**
- **The update ritual is a human diffing N repos.** Adding or renaming one
  member today = edit the site card, edit N READMEs, edit (eventually) N
  headers. govstruct makes it one manifest edit shipped with provenance.
- **The roster is bigger than any hand-list.** The served truth (creadev
  `projects.js`, 2026-10-29) carries **20 entries**, not the 10 v0.2 assumed:
  `weisync, vant, flowforge, monoforge, crashtest, eyestruct, poststruct,
  prestruct, freestruct, gistory, stegoframe, audithole, migrare, threadforge,
  regarded, creadev-security, creadev-qos, packstruct, this, vibeflow` - plus
  **railyard** (private, the composer) and **govstruct** itself - **23 rows** in
  §4.1. A 10-row hand-table was already stale the day it was written; the
  manifest is the fix.
- **The family's own doctrine demands it.** packstruct proved the shape: "one
  manifest, one entry contract, one conformance verb" - but packstruct governs
  *packs inside a repo*. govstruct governs *the suite level*: what the members
  ARE (manifest), what they SAY about each other (render artifacts), and WHAT
  SERVES AS PROOF (doctor). It is the layer every other arm assumed someone else
  owned.

---

## 3. The suite model - roles, arms, forges, composer

govstruct governs a **suite**: a named set of **members**, each playing a
**role**. The role vocabulary is the tool's (general); the assignments are the
reference deployment's (data).

### 3.1 Roles

| role | means | examples (reference deployment) |
|---|---|---|
| `arm` | one of the five verification arms | govstruct, packstruct, crashtest, eyestruct, poststruct |
| `forge` | stamps/rigs other members | monoforge (stamp), flowforge (site rig) |
| `factory` | holds staging trees, ferries proven blocks to standalone repos | gistory |
| `composer` | declares the suite and enforces conformance across it | railyard |
| `product` | a shipped tool or site governed by the suite | vant, migrare, stegoframe, audithole, regarded, threadforge, weisync, this, vibeflow, creadev |
| `component` | a published library carved from a product | creadev-security, creadev-qos |

### 3.2 The five arms (v0.2's frame, kept - it is correct)

| Arm | Its verb | What it owns |
|---|---|---|
| **govstruct** | govern | the member manifest; the render surfaces; the doctor over suite truth; release pins |
| **packstruct** | spec | the `/packs` contract; one manifest/entry/lifecycle shape; lint + audit-conformance |
| **crashtest** | attack | adversarial in-process QA; seeded campaigns; verdicts that refuse new exploits |
| **eyestruct** | watch | deterministic look/diff over rendered surface; committed memory in `labs/.eyes/` |
| **poststruct** | audit | audit over **what actually shipped** - baked HTML, links, i18n, feeds |

**Why five arms is final:** the suite covers write (spec), attack (test), watch
(visual), audit (shipped-truth), and govern (control). A sixth *arm* would
overlap one of these five - so the arm shape is closed and scope creep is
nameable. (v0.2 read this as "the family is closed." That was wrong: the arms
are closed, the **membership** is open - the roster grows by adding `product`
rows, which is exactly what v0.3 does.)

### 3.3 The composer - railyard

The suite already had a hole where its **source of truth** should be. v0.3 names
it: **railyard is the composer.** It is the parent product over the forges -
"the forges do the work; railyard routes it" (its own AGENTS core law). railyard
declares the suite (which members exist, in what roles, at what pins) and
dispatches work across it. It does **not** reimplement the forges; a fix belongs
in flowforge or monoforge.

**Verified, not asserted.** railyard is private but readable from this session
(2026-10-29). It ships:

- `factory.json` - the product identity (`name`, `species` "the forge yard",
  `siteDomain`, `version` 0.9.0). railyard is a **service, not an npm package**:
  the components (flowforge, monoforge, the engines) are the packages.
- `mounts/{public,private,local}` + `mounts/state.json` - the **mount registry**,
  a proto-spec with three tiers (public ships upstream, private is
  ecosystem-internal, local never pushes). It is the first real home of a spec
  that gistory (`mounts/`) testbeds; the parity ask rides to vant + packstruct so
  the models/mounts/packs rigs all speak `public/private/local` the same way.
  Today it registers **flowforge + monoforge** as the first two public mounts.
- `scripts/check-railyard.cjs` + its self-test - the battery, with teeth (the
  family law: a check that never fails proves nothing).

**This is where govstruct plugs in.** The mounts registry and the govstruct
manifest are the **same shape seen from two sides**:

| | `mounts/state.json` (railyard) | `apps.json` (govstruct) |
|---|---|---|
| answers | where a member's bytes come from | who the member *is* |
| per-member keys | `tier`, `tree`, `repo`, `boot` | `role`, `url`, `repo`, `status`, `npm` |
| source of truth for | the ferry (staging tree → standalone repo) | the mesh (menu, README tables, status) |

They **meet at `repo` + `tier`/`role`**. The clean division: **govstruct governs
identity and conformance; railyard governs transport and dispatch.** A member is
*declared* in govstruct's manifest and *mounted* in railyard's registry; a rename
or a new member is one edit in govstruct that railyard's ferry then acts on.

railyard may enforce govstruct in four interchangeable ways - **the same model
for every member, not a special case:**

1. **Through the forges' arms** - monoforge's doctor and flowforge's birth-gate
   gain a govstruct conformance input, so a newly stamped/rigged repo is born
   with its suite facts already checked.
2. **Through govstruct itself** - railyard runs `govstruct doctor --suite` over
   the declared members at pinned revs and refuses drift.
3. **Through `/packs` in each member's own repo** - each member carries the four
   shape packs (`floor-shapes`, `env-shapes`, `pin-shapes`, `version-shapes`)
   and its own CI runs `packstruct lint` + `govstruct check` locally.
4. **Through the factory** - gistory's battery is where the compliance legs gate
   before move day, so a member cannot be ferried to a standalone repo red.

**Remaining honest limit:** railyard's own PRD is a stub (its §4 open questions
name the first end-to-end flow and its deploy target), so the *interface* by
which it consumes govstruct verdicts is still an owner call (§17 Q4). The
registry shape above is verified; the wiring is designed.


---

## 4. The payload: the suite manifest (`apps.json`)

One composed manifest, the whole suite truth. Shape mirrors packstruct v1
discipline: fields draw from *actual served reality*, never speculation.

```
members/<id>.json      # one block file per member
apps.json              # compose + order + meta (version, stamp, roles)
govstruct.config.json  # the tool's own config: member dir, surfaces, gates
```

Each block file (the **general** field set):

| Field | Type | Rules |
|---|---|---|
| `id` | string | kebab-case, MUST match filename - mismatch is a load error, never silent |
| `name` | string | display name exactly as the suite says it ("Prestruct", "Creadev.org") |
| `role` | enum | `arm` \| `forge` \| `factory` \| `composer` \| `product` \| `component` (§3.1) |
| `url` | string\|null | https, unique; `null` = not public yet (a state, not a failure); the doctor checks resolvability, never trusts |
| `repo` | string\|null | GitHub `owner/name`; `null` = private or N/A (the doctor does not assume every member is public) |
| `npm` | string\|null | published package name, or `null`. **May differ from `id`** (`vant` → `vant-os`, `gistory` → `gistory-sync`) |
| `aliases` | string[] | former ids/names, for renames (§16.5). A consumer that still knows the old id reads "renamed," never a 404 |
| `blurb` | string | one line, no marketing spin (docs-style gates lint prose voice) |
| `icon` | string | token-referenced glyph id, renders everywhere; no bitmaps in v1 |
| `order` | integer | position in the menu / README table; always explicit, never array-luck |
| `status` | enum | `Live` \| `Beta` \| `In Development` \| `Backburner` \| `Archived` |
| `section` | enum | `open-source` \| `proprietary` \| `other` |

Two fields are **declared-but-unknown-safe**: `url` and `repo` accept `null`
because the served truth already has nulls (private repos, unlaunched sites).
v0.2 would have refused them; that would be a check the served reality does not
promise.

### 4.1 The reference roster (grounded, 2026-10-29)

Sourced from creadev's served `src/data/projects.js` plus `railyard`. Statuses
are the served ones; `npm` reflects the owner's rulings (`vant-os`,
`gistory-sync`) and live registry checks (free = 404).

| id | role | status | url | npm |
|---|---|---|---|---|
| govstruct | arm | In Development | (pending) | `govstruct` (free) |
| packstruct | arm | Live | packstruct.creadev.org | `packstruct` |
| crashtest | arm | Live | crashtest.creadev.org | `crashtest` |
| eyestruct | arm | Live | eyestruct.creadev.org | `eyestruct` |
| poststruct | arm | Live | poststruct.creadev.org | `poststruct` |
| monoforge | forge | Live | monoforge.creadev.org | (repo only) |
| flowforge | forge | Live | flowforge.creadev.org | (name taken) |
| gistory | factory | Live | gistory.creadev.org | `gistory-sync` |
| railyard | composer | In Development | railyard.creadev.org | - (service, not a package) |
| prestruct | product | Live | prestruct.creadev.org | `prestruct` |
| freestruct | product | Live | freestruct.creadev.org | `freestruct` |
| vant | product | Live | vant.creadev.org | `vant-os` |
| migrare | product | Live | migrare.creadev.org | `migrare` (contested) |
| stegoframe | product | Live | stegoframe.creadev.org | (free) |
| audithole | product | Live | audithole.creadev.org | (free) |
| threadforge | product | Beta | threadforge.creadev.org | (private repo) |
| weisync | product | Live | weisync.com | (private repo) |
| regarded | product | Backburner | github.com/dhaupin/regarded | (free) |
| this | product | Live | github.com/dhaupin/this | (repo only) |
| vibeflow | product | Live | vibeflowfestival.com | (n/a) |
| creadev | product | Live | creadev.org | - (home site) |
| creadev-security | component | Live | npm @creadev.org/security | `@creadev.org/security` |
| creadev-qos | component | Live | npm @creadev.org/qos | `@creadev.org/qos` |

The roster is **data**, not code: adding member 24 is a block file + a doctor
run, never a PRD edit. (v0.2's "10 the menu needs" was the bug this fixes.)

---

## 5. Render surfaces (governed output, statically emitted - never fetched)

The doctrine the whole layer rides: **the suite mesh must exist in the served
HTML.** No runtime fetch, no CDN-injected widget, no hydrate-only menu. Every
surface is *emitted at build/publish time* from the manifest, so a bot reads a
plain anchor:

1. **`apps.react.jsx`** - for React/flowforge `web/` consumers: renders the full
   pane server-side (initial HTML carries every `<a href>`); hydration only adds
   open/close, reusing the existing mobile-menu state machine (button
   `aria-expanded`, Escape closes, focus returns) as a **second burger, always,
   desktop included** - grid glyph (3×3 dot matrix), same pane styles, named
   `apps-menu` in scope, no classes shared silently.
2. **`apps.partial.html`** - for Jekyll/docs consumers: pure HTML+CSS, zero JS,
   dessert-styling only. Integrates as an include with its own stylesheet
   namespace; reuses token palette so light/dark just works.
3. **`readme.md`** - generated table snippet (name | url | blurb | status), ready
   to paste into N READMEs (manual paste in v1 - generated content, parity by
   construction).
4. **`registry.json`** - machine-readable manifest export for programmatic
   consumers (auditors, CI, the site's own `projects.js` eventually).

Ordering: `order` wins; equal orders refuse at author time (`doctor`), never
silently rethrow.

---

## 6. The doctor (the load-bearing half)

Small, toothy, refusing - the shape that made packstruct's linter the immediate
payoff:

```
govstruct lint              # manifest fields, id==filename, https, unique urls, order collisions, copy voice
govstruct render <target>   # emit react | partial | readme | registry from the manifest
govstruct doctor [--suite]  # adopter-side checksum gate, or suite-wide truth battery
govstruct check             # run the four compliance shape packs over this tree
govstruct registry          # emit the suite roll-up (env / pins / floors / versions)
govstruct lock              # archive + sha256 receipt, monoforge-shaped
```

The doctor REFUSES, never warns-into-green: duplicate ids, URL/HTTPS breaks,
menu order collisions, any artifact whose checksum moves without a version bump.
Refusals are nameable at author time (the crashtest#16 lesson, baked in from day
one). **`--suite` refuses drift; a lagging adopter inside the roll-up is a state,
not a crime** (the author-time-vs-run-time split packstruct already draws).

---

## 7. The arms consume govstruct (the self-proof)

This is what makes govstruct the fifth arm rather than a fifth app: **the other
four verify it, and it verifies them.**

- **packstruct:** govstruct's `/packs` adopts SPEC v1; the compliance grammar
  ships as `check`-profile packs (§11) - one contract, two consumers, no second
  dialect.
- **crashtest:** a `govstruct-manifest-shapes` scenario pack (in-process, no
  sockets) attacks the loader: duplicate ids, order collisions, non-https url,
  id≠filename, artifact checksum drift - each must verdict REFUSED honestly and
  FIXED honestly in the two-way fixture pattern the suite already runs.
- **eyestruct:** the rendered pane across adopters gets `look` + `diff` per
  adopter; the pane visual contract lives in `labs/.eyes/` and CI-gates on
  unexplained drift - "the menu looks like the sibling's menu" becomes testable.
- **poststruct:** every adopter's baked output is audited for the mesh contract:
  crosslinks resolve, all anchors present, no plaintext emails (the §2 lesson as
  law), hreflang/i18n basics intact. "Parity" stops being a claim.

### 7.1 The existing dialect it must not duplicate

The suite **already ships** a crosslink contract: **`family-status@1`**
(packstruct#36). Each member serves `/status.json` generated from its own
committed ledgers, and every member's status page reads the others' files with
the same schema - honest-data rule: a sibling not serving the contract shows as
"not serving the dialect," never a guessed row.

govstruct must **compose with** it, not fork it:

- govstruct's `registry.json` **feeds** the members list the status island reads
  (today that list is hand-typed in `FamilyStatusIsland.jsx` - a govstruct
  manifest removes the hand-typing).
- The status dialect stays the members' own (their ledgers, their verdicts);
  govstruct governs **who the members are and how they link**, not what their
  ledgers say.
- One contract, two roles: `family-status@1` is *member-served proof*;
  govstruct is *suite-level governance*. They meet at the member roster.

---

## 8. Distribution and the update ritual

- **Pins, never floats** (the house rule): every adopter pins `govstruct@x.y.z`.
  Outputs are committed artifacts, not runtime imports of the registry - a bot
  never fetches at request time.
- **The update ritual:** edit the manifest in govstruct → doctor green → publish
  (OIDC, provenance-attested like packstruct@1.0.0 - no stored token) → a robot
  PRs the pin bump to every adopter (one PR per repo, dependabot-shaped,
  reviewable, no silent auto-merge). Adopter CI rejects any staged artifact whose
  checksum doesn't match its pin.
- **Build home:** gistory, in the factory - a `govstruct-staging/` tree rides the
  same ferry the other struct repos proved: gistory's CI battery gates move day,
  then standalone `dhaupin/govstruct` receives it, monoforge-stamped from proven
  blocks.
- **railyard enforces** (§3.3) - via the forges' arms, govstruct itself, per-repo
  `/packs`, or the factory; the same model for every member.

---

## 9. Site & docs (fleet pattern, no novel infrastructure)

- **Landing = govstruct.creadev.org** - Cloudflare Pages, wrangler.toml +
  functions `/api/health` canary, identical schema to the other members. Copy
  law: every number on the page is a receipt; "governance" claims must point at a
  doctor verb or a ruling.
- **Docs = docs.creadev.org/govstruct** - shared fleet docs host, Jekyll +
  Pagefind + Freestruct basePath-aware, poststruct auditing the output.
- **The apps menu dogfoods its own product on day one:** govstruct's landing
  ships the pane rendered from its own manifest - the product is its first
  adopter, and its own doctor runs in its own CI.
- **Older member sites will be refactored to the flowforge rig.** Several
  member sites predate the flowforge shell and will be re-cut to its template
  style so the suite looks like one family. govstruct's part: the roster already
  knows every member's `url`, so a refactor is a data change, not a hunt - and
  the render surfaces (§5) emit the same pane to every adopter regardless of
  which shell generation it runs. A member mid-refactor is a `status`, not an
  exception.

---

## 10. The compliance contract (the four governed surfaces)

v0.2's Part II, kept - it is the strongest part of the draft. Each surface is a
manifest block, a doctor rule, and a pack. All four are **receipt-backed**: the
drift they name was measured in the suite, not assumed.

### S1 - Runtime floors (`engines`)

The suite's node floors have drifted, with no registry holding them:

| member | `engines.node` | note |
|---|---|---|
| packstruct | `>=20` | battery floor (ESM conformance via `require(esm)`) |
| poststruct | `>=20` | |
| freestruct / prestruct | `>=20` | |
| eyestruct | `>=18` | consumer floor |
| flowforge | `>=18` | |
| gistory | `>=18` | |
| vant | `>=18` | |
| audithole / migrare | `>=18.0.0` | |
| crashtest | `>=18.17` | the odd patch floor - DEPLOY.md states it, nothing explains it |

Ten members, four distinct floors, one a patch floor nobody can explain from
outside. govstruct holds the floor table as data; the doctor refuses a member
whose shipped `engines.node` disagrees with its manifest row. The
consumer-vs-battery distinction packstruct's docs already draw becomes a
*field*: `floors: { consumer, battery }`.

### S2 - The env registry (the `EYESTRUCT_*` precedent, generalized)

eyestruct already proved the shape: `docs/env.md` is a frozen surface, and a
battery leg derives the live inventory **from the source** so a key cannot appear
in code unannounced. This lifts it to the suite: every member declares its env
keys (`env: [{ key, reads, default, notes }]`), the doctor runs each member's own
inventory leg (via its public CLI, per the interop law §11), and the roll-up
emits **one suite env page** so "what env does the family read?" is one address.
A `*STRUCT_*` name absent from the registry is dead code by definition.

### S3 - The pin ledger

The suite's pin discipline is real and scattered across five places:

| pin class | today it lives in | example |
|---|---|---|
| companion spec pin | `implements: packstruct@1` (SPEC §8 row 1) | eyestruct, poststruct |
| companion devDep | exact devDependency (SPEC §8 row 5) | `packstruct@1.0.0` |
| engine pins | MANIFEST.md prose | freestruct `dfb30aa498` |
| action pins | `.github/workflows/*` | 40-hex `uses:` SHAs |
| capture pin | `labs/.eyes/manifest.yml` | `local-chrome@154.0.8037.57` |

Five classes, five homes, one concept: *what this member is bound to.* govstruct
holds the ledger as data and refuses an unrecorded pin. It does NOT replace the
per-repo surfaces - it **indexes** them, so "what is the suite pinned to right
now?" is one address and a bump is a reviewable diff.

### S4 - Version truth

flowforge's census leg already encodes the law: `package.json` is THE single
version source, and `web/package.json` plus the README status line must match or
the release commit fails. Generalize: any living surface that names the current
version is checked against the root. The lawful exceptions flowforge already
classified (dated era rows, range pins `^1.0.0`, other packages' versions) carry
over verbatim.

---

## 11. The mechanism: compliance rules ARE check-profile packs

The unification that keeps this from inventing a second grammar. The packstruct
SPEC v1 `check` profile is an ES module whose default export is
`{ checks: [Check] }` - declarative pure-reading verifiers over files on disk, no
transport, armed by being enumerated in the host config. That is *exactly* what a
compliance rule is.

```
packs/public/
  floor-shapes/pack.json     # S1: engines vs manifest row
  env-shapes/pack.json       # S2: declared keys vs source inventory
  pin-shapes/pack.json       # S3: pin ledger vs the surfaces that enforce it
  version-shapes/pack.json   # S4: root version vs every living claim
```

Consequences, all free:

- **packstruct lints govstruct's own packs** - the suite's manifest grammar,
  reused, not re-dialected. govstruct is a `check`-profile host like poststruct.
- **crashtest attacks the loader** - a `govstruct-manifest-shapes` scenario pack
  covers the compliance blocks too.
- **The interop law governs the crossing** (SPEC §8 row 4): govstruct never
  imports a sibling to check a sibling - it invokes the sibling's **public CLI**.
  Prose law is poststruct's (`--module language`); pack shape is packstruct's
  (`lint --deep`); adversarial shapes are crashtest's; pixels are eyestruct's.
  govstruct orchestrates verdicts; it re-implements none.

Where each check runs (three tiers, same pack):

| tier | who runs it | over what |
|---|---|---|
| author time | `govstruct check` (local) | the govstruct tree |
| adopter CI | `packstruct lint` + the pack | the adopter's own tree |
| suite roll-up | `govstruct doctor --suite` | every manifest row vs every member's real state |

---

## 12. How it works with the forges and the factory

- **monoforge (stamps repos).** Today its doctor verifies a stamp against
  `FORGE-TODO` truth slots, which are prose the author must fill. govstruct makes
  part of that slot set **verifiable**: floor, pins, and env are read from the
  manifest, so a stamp is born with its conformance facts already checked. The
  stamp becomes the *first* compliance gate.
- **flowforge (rigs sites).** govstruct's render surfaces are flowforge
  deliverables - they ship in the rig, and the rig's birth-gate gains the suite
  floor as a second input. A new site birthed from the rig inherits the pane and
  the floor check in one step.
- **gistory (the prototype factory).** The staging-mount + ferry doctrine is
  already the mechanism: `*-staging/` trees ride `monoforge-ferry.yml`
  (sha256-gated, converge-on-HEAD) into standalone repos. govstruct rides the
  identical ferry - no new infrastructure.
- **railyard (the composer).** §3.3.

---

## 13. The full build-out (repo shape, CI, web, docs, packs)

```
govstruct/
  bin/cli.mjs                 # zero-dep CLI, exit 0-1-2 (packstruct shape)
  src/                        # lint, render, doctor, check, registry, lock
  spec/                       # the compliance contract, versioned like SPEC.md
  members/<id>.json           # the suite blocks (§4)
  compliance/<id>.json        # the conformance blocks (§10)
  apps.json                   # composed manifest (members + compliance + meta)
  govstruct.config.json       # the tool's own config (member dir, gates)
  packs/public/*/             # the four shape packs (§11)
  web/                        # flowforge landing shell (prestruct-prerendered)
  docs/                       # flowforge Jekyll rig (Pagefind + freestruct)
  scripts/                    # birth gate + docs gates, inherited
  .github/workflows/          # test.yml, crashtest.yml, docs.yml, publish.yml, compliance.yml
  labs/                       # work log, crashledger, .eyes
  horcrux/                    # stones, lock archives
  README.md AGENTS.md CHANGELOG.md DEPLOY.md MANIFEST.md LICENSE
```

**Verbs:** §6. **CI:**

| workflow | gates |
|---|---|
| `test.yml` | `node --test` spine + version-truth census + `npm run check` (docs gates + birth gate) |
| `crashtest.yml` | the `govstruct-manifest-shapes` scenario pack (in-process, no sockets) |
| `compliance.yml` | `govstruct doctor --suite` over every adopter at a pinned rev; refuses drift, emits the roll-up |
| `docs.yml` | Jekyll + hardened pagefind + pinned freestruct layer + Pages |
| `publish.yml` | OIDC trusted publishing, 0.x refused, tag == packaged version |

`web/` and `docs/` are the flowforge rig verbatim (identity swapped), per the
house rule "adopt explicitly, start from a checkout." The **birth gate is
inherited as-is** - a govstruct that fails the suite's own birth gate never
ships.

---

## 14. Non-goals

- **No runtime menu service, no CDN-injected widget, no fetch-on-mount.** The
  served HTML is the contract.
- **No governance of card prose, images, or marketing copy.** Only mechanical
  truth (mesh + compliance).
- **No auto-runbook rewrite of any adopter repo by the robot.** PRs only,
  reviewed merges only.
- **No new "gov" coverage beyond the contract.** The manifest, the render
  surfaces, the doctor, the four-arm dogfood, and the four compliance surfaces -
  full list; anything else waits for the rule of three.
- **No suite-specific names in the tool.** dhaupin/creadev is the reference
  deployment; the tool ships generic.

### 14.1 Amendment to v0.2 (the contradiction, repaired)

v0.2's Part II §14 deliberately reversed Part I §11's non-goal ("no governance of
prose/marketing") for a second class of truth, but left §11 standing. That is a
contradiction on the page. **This v0.3 amends §11's non-goal explicitly:** prose
and marketing copy remain out of scope; **mechanical conformance facts (floors,
env, pins, versions) are in scope** as a *distinct bucket* - different owners
(a member's identity vs its build) and different failure times (a wrong URL reads
wrong to a human; a wrong floor breaks a consumer's install). The non-goal now
reads "no governance of card prose or marketing voice," which is what v0.2's
Part II actually honored.

---

## 15. Milestones

- **M0 - proposal + name lock.** This doc; publish `govstruct@0.0.0-stage` to
  npm to hold the name (the suite's staged-publishing ritual, same
  crashtest/packstruct/eyestruct precedent); file the naming ruling (navstruct
  reserved, `weft` excluded as npm-taken).
- **M1 - manifest + doctor + surfaces.** `govstruct-staging/` in gistory;
  `apps.json` v1 inked with the **full 23-member roster** and their verifiable
  truths; `lint`/`render`/`doctor` green; artifacts emit; crashtest shape pack
  and packstruct conformance pack both green. Stamp target 0.9.0.
- **M1.5 - compliance contract inked.** `spec/` v1 for the four surfaces;
  `compliance/<id>.json` populated for every member from *measured* reality (the
  floor table §10 S1 is the first receipt); the four shape packs lint clean under
  packstruct.
- **M2 - move day + first adopters.** Standalone `dhaupin/govstruct`
  (monoforge-stamped), OIDC-release ladder per flowforge's template; flowforge
  consumes the manifest (menu lands for `web/` and docs rig); first adopters:
  creadev.org site header + the suite READMEs pasted from the generated snippet;
  provenance-attested `1.0.0` once the first real consumer is pinned.
- **M2.5 - the suite roll-up is real.** `govstruct doctor --suite` green over the
  tool members; `registry` emits the env/pins/floors/versions pages;
  `compliance.yml` gates them. Rule-of-three: waits until ≥2 members adopt before
  it claims "suite."
- **M3 - railyard integration.** Wire the composer: railyard's `mounts/state.json`
  and govstruct's `apps.json` meet at `repo` + `tier`/`role` (§3.3). Owner call on
  the interface (§17 Q4). The registry shape is verified; only the wiring is open.
- **M3.5 - the rename case study, executed.** Rename flowforge (`coreforge` or
  `rigforge`) as govstruct's first proving operation (§16.5): one manifest edit,
  the suite-wide census pack refuses any living literal left behind, receipts
  stay frozen. This is the concrete test of the OSS claim.
- **M4 - OSS release.** The general tool publishes (README for strangers, config
  schema documented, a second family proves it - the rule of three applied to the
  tool itself).

---

## 16. OSS adoption (what a stranger needs)

Because this is general, the repo must read as a tool, not a memoir:

- **`govstruct.config.json`** is the only required input: where the member blocks
  live, where surfaces emit, which gates run. The dhaupin suite's config is an
  example, shipped in `examples/`.
- **No hardcoded names.** `railyard`, `creadev`, `dhaupin` appear only in
  `examples/` and the reference deployment's own config, never in `src/`.
- **The reference roster is data**, committed as `members/*.json` - a fork points
  the tool at its own `members/` and gets its own suite.
- **The compliance surfaces are optional packs** - a stranger with no npm tools
  uses the mesh half alone.


---

## 16.5 Case study: renaming a member (flowforge → coreforge or rigforge)

The owner plans to rename **flowforge** soon (candidates: `coreforge`,
`rigforge`). This is not a cosmetic edit - it is the exact event govstruct exists
to make survivable, so it is written here as the tool's first **proving case**.
If govstruct cannot make this rename a one-edit, doctor-checked operation, it has
not earned its seat.

### The rename is also a fix

`flowforge` on npm is **owned by an unrelated party** (`kenkaiiii`), and the
repo's `package.json` declares `"name": "flowforge"` anyway - a name it cannot
publish under. Both candidates are **free**: `coreforge` (npm 404, repo 404) and
`rigforge` (npm 404, repo 404). So the rename resolves a latent collision, not
just a preference. (This is why the manifest's `npm` field is separate from
`id` - the published name and the member name are already allowed to differ.)

### What actually has to change (measured, 2026-10-29)

`flowforge` appears in **255 places across 4 repos** - but the raw count is the
wrong metric. The rename only matters where the string is a **living reference**;
**frozen receipts** must NOT change (rewriting them would be a lie about history).

| category | where | count | rename? |
|---|---|---|---|
| **Identity** (the one source + generated outputs) | `site.config.js`, `package.json`, `web/package.json`, `web/ssr.config.js`, `docs/_config.yml`, `docs/freestruct.config.yml`, `web/public/robots.txt`, `web/public/site.webmanifest` | 9 files | **yes** - `site.config.js` first, then `npm run sync` regenerates the rest |
| **Living references** (structural surfaces that hardcode it) | `.github/workflows/*`, `lib/*`, `tests/*`, `web/scripts/*`, `AGENTS.md`, `README.md`, `DEPLOY.md`, `docs/index.md` | ~24 files | **yes** - tokenize or source from config |
| **Cross-repo living** | monoforge `templates/` (stamped into new repos), railyard `mounts/state.json` + `factory.json`, govstruct roster | 3 repos | **yes** - but only the live ones |
| **Frozen receipts** (history) | `CHANGELOG.md`, `MANIFEST.md`, `labs/TASKS.md`, `labs/prd-*.md`, code comments citing `flowforge#30` | many | **no** - never rewrite history |
| **Lockfiles** | `package-lock.json`, `web/package-lock.json` | 2 | regenerate, do not hand-edit |

### Why the fleet is already half-ready (and where it is not)

The mechanism exists: flowforge's **brand census gate**
(`lib/gates/check-brand-census.mjs`) refuses an identity literal that lives
anywhere but `site.config.js`, over 22 named structural surfaces - **content
and filenames** (the filename leg exists because a brand name in a path is
invisible to a content scan; it bit twice). `npm run sync` fans the non-JS
surfaces out of the one config. So for flowforge's *own* repo, the rename is
close to one file.

Three gaps the census gate does **not** close, which is precisely govstruct's
job:

1. **Cross-repo literals.** The gate only scans flowforge's own `web/` + `docs/`.
   It cannot see railyard's `mounts/state.json` (`"flowforge"`, `"tree":
   "flowforge-staging/"`, `"repo": "dhaupin/flowforge"`), monoforge's
   `templates/` (which get **stamped into brand-new repos** - a rename that
   misses here ships the old name into every future member), or govstruct's own
   roster. **No member can see the others' literals; only the composer can.**
2. **The npm name.** The gate polices the *site* brand, not the published
   package name. A rename that changes `site.config.js` but not `package.json`
   leaves the collision.
3. **The ferry tree name.** railyard's registry points at `flowforge-staging/`.
   A rename moves the tree too, so the registry entry and the gitignored
   `boot/` paths move with it.

### How govstruct makes it a governed operation

This is the flow the tool must support (and the reason §3.3's mount↔manifest
meeting point matters):

1. **One edit.** Change the member block `members/flowforge.json` → the renamed
   id, with `name`, `url`, `npm`, and `repo` updated. Everything downstream is
   derived.
2. **The doctor refuses the half-done rename.** `govstruct doctor --suite` fails
   while *any* declared surface still carries the old literal - in flowforge, in
   monoforge's templates, in railyard's registry, in govstruct's roster. The
   refusal names the file, exactly as the family's gates do. This is the check
   that does not exist today.
3. **Render surfaces re-emit.** The README table snippet, `registry.json`, and
   the menu pane are regenerated from the new manifest - so the mesh updates
   everywhere at once, not by hand.
4. **The ferry acts.** railyard's registry is updated to the new tree/repo; the
   next cut stamps the new name into new repos.
5. **Receipts stay frozen.** CHANGELOGs, TASKS logs, and issue citations keep
   saying `flowforge` - correctly, because that is what happened. The doctor
   must know the difference between a living surface and a receipt, or it would
   demand we falsify history. **This is the single hardest part of the design**
   and the reason the census gate strips comments and skips `labs/`.

### The design consequences govstruct inherits

- **A rename is a `status`-like state transition, not a delete+add.** The old id
  needs a tombstone (the `family-status@1` "not serving the dialect" honesty
  rule applied to identity): a consumer that still knows `flowforge` should read
  "renamed to X," never a 404.
- **`aliases` field.** The manifest needs `aliases: ["flowforge"]` so a rename
  is reversible and old links resolve. (New field, §4 - the rename proves it.)
- **The census gate generalizes into a govstruct pack.** `check-brand-census`
  becomes a `check`-profile pack that runs *suite-wide*, not per-repo - the
  first concrete example of §11's "compliance rules ARE packs," and the reason
  the tool earns its keep.
- **Rename is the M4 proof.** The PRD's OSS claim ("a stranger can govern their
  own family") is only credible if the tool survives its own hardest operation.
  Renaming flowforge is that test.


---

## 17. Open questions

1. **One manifest or two?** Mesh blocks (`members/`) and compliance blocks
   (`compliance/`) separate, composed into `apps.json`, or one file per member?
   Lean: separate - different owners, different cadence; mesh blocks render
   publicly.
2. **How loud is a floor mismatch?** Refuse the release, or warn into the
   roll-up? Lean: refuse at author time (`govstruct check`), warn in the suite
   roll-up (a lagging adopter is a state, not a crime).
3. **Does the floor field carry the battery floor too?** Lean: yes, two fields
   (`consumer`, `battery`) - the distinction is already load-bearing in one
   member's docs.
4. **railyard interface.** How does railyard want govstruct verdicts delivered -
   a provider call, a manifest read, or a CI gate? The registry shape is verified
   (§3.3); only the wiring is an owner statement.
5. **Menu status dots:** show `Live/Beta/...` pills inside the pane, or keep the
   menu statusless? Lean: statusless - "menus should not have badges in them."
6. **Icon surface:** dictionary-glyph tokens (v1) vs. per-member SVG
   mini-captures now? Lean: tokens in v1, SVG crest later.
7. **Stub timing:** publish `govstruct@0.0.0-stage` now (locks name tonight) or
   at M1? Lean: now - cheaper than losing the shelf spot.
8. **Member scope (v0.2 Q4, now generalized):** with a 23-member roster, does
   every member carry the pane, or only the tool sites? Lean: every member, hub
   included; the mesh is stronger when the hub carries it too.
9. **The flowforge rename: `coreforge` or `rigforge`?** Both npm-free and
   repo-free. `coreforge` reads as "the core shell"; `rigforge` reads as "the rig
   you build sites from." Owner call. Either way it is govstruct's M3.5 proving
   case (§16.5).
10. **Does the rename ship before or after govstruct exists?** Doing it by hand
    now (a `sed` across 4 repos, ~33 living files) is possible but proves nothing
    and risks missing the cross-repo literals; doing it through govstruct's
    doctor is the proof. Lean: after M1, so the rename is the tool's first
    real operation rather than a pre-tool scramble.
