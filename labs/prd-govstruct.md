# PRD: govstruct (the controller layer)

**Status:** draft v0.8 - rename + factory-delegation + vant handshake + stamp loop + fleet meter + audit ledger + source consistency designed; all fifteen ecosystem gaps folded into the normative sections · supersedes v0.3.1 (2026-10-29) · Owner: dhaupin
**Author:** Buffy (v0.1-v0.2, 2026-10-28/29) · OpenHands agent (v0.3-v0.8 rewrite, 2026-10-29)
**Name lock:** npm `govstruct` verified free (registry 404, 2026-10-29); GitHub `dhaupin/govstruct` claimed 2026-10-29.
**Companion PRDs:** `prd-factory` (monoforge), `prd-railyard` (the composer), `prd-creadev-mono`, `prd-gistory`, `prd-sync` live in the fleet repos / gistory `horcrux/prds/`.
**Build home:** gistory (the ferry factory - staging tree + CI battery per the gistory doctrine); the composer is `dhaupin/railyard`.

> **v0.4 note (read first).** Two governance events are now **decided**, and each
> is written up as a proving case: the member **flowforge is renamed coreforge**
> (`coreforge.creadev.org`, §16.5), and the **factory delegation gistory →
> railyard** is designed (§16.6). Both forced manifest fields (`aliases`, `home`)
> and a doctor rule (home-drift). §16.7 states the **OSS repo hygiene** law (the
> tool repo is clean of Creadev data; railyard runs the reference deployment),
> §16.8 adds the **vant case study** (verified against axolotl *code*, not the
> stale docs - vant already runs three of the five arms), §16.9 adds **vant
> stamping through railyard** (the write path), and §12.1 names the family
> **`/labs` convention**. §18 indexes the ecosystem gaps, **all fourteen now
> folded into the normative sections** (§4 fields, §5.1, §6.1-6.6, §7.2, §8,
> §10 S5/S6/S7, §16.4, §16.10, §16.11, §19) - not a wish list, a design.
>
> **v0.3.1 note.** Corrects the composer's name to **railyard** (v0.3 wrote
> "railway" from a stale note) and grounds it in the now-readable private repo:
> railyard is the parent product over the forges, and its `mounts/` registry is
> the operational twin of govstruct's manifest (§3.3).
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
  `weisync, vant, coreforge, monoforge, crashtest, eyestruct, poststruct,
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
| `forge` | stamps/rigs other members | monoforge (stamp), coreforge (site rig) |
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
in coreforge or monoforge.

**Verified, not asserted.** railyard is private but readable from this session
(2026-10-29). It ships:

- `factory.json` - the product identity (`name`, `species` "the forge yard",
  `siteDomain`, `version` 0.9.0). railyard is a **service, not an npm package**:
  the components (coreforge, monoforge, the engines) are the packages.
- `mounts/{public,private,local}` + `mounts/state.json` - the **mount registry**,
  a proto-spec with three tiers (public ships upstream, private is
  ecosystem-internal, local never pushes). It is the first real home of a spec
  that gistory (`mounts/`) testbeds; the parity ask rides to vant + packstruct so
  the models/mounts/packs rigs all speak `public/private/local` the same way.
  Today it registers **coreforge + monoforge** as the first two public mounts.
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

1. **Through the forges' arms** - monoforge's doctor and coreforge's birth-gate
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
| `home` | string\|null | the **ferry authority** - which composer/factory owns this member's staging tree and bytes (`railyard`, `gistory`, ...). Distinct from `repo` (where source lives) and `role` (what it does). A member claimed by two homes is a drift (§16.6) |
| `blurb` | string | one line, no marketing spin (docs-style gates lint prose voice) |
| `icon` | string | token-referenced glyph id, renders everywhere; no bitmaps in v1 |
| `order` | integer | position in the menu / README table; always explicit, never array-luck |
| `status` | enum | `Live` \| `Beta` \| `In Development` \| `Backburner` \| `Archived` \| `Tombstoned` (§G7 - a retired member still resolves via `aliases`) |
| `section` | enum | `open-source` \| `proprietary` \| `other` |
| `needs` | array | **G3** - edges to other members: `[{ id, floor }]`. The doctor topo-sorts the suite and refuses a cycle; this is how a bump propagates |
| `grants` | array | **G5** - the scoped credentials this member's stamps may spend (`[{ kind, scope }]`). A stamp cannot spend a credential absent from this list |
| `clause` | object | **ISO** - optional map of this member's checks to standard clauses (`{ "9001-8.5.2": "traveler audit" }`). Carried from day one; the full mapping ships as a profile pack |
| `history` | array | **G7** - optional lifecycle transitions `[{ status, at, note? }]`. Forward-only on the §6.6 ladder; `status` must agree with the last transition |

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
| coreforge | forge | Live | coreforge.creadev.org | `coreforge` (free, renamed from flowforge) |
| gistory | factory | Live | gistory.creadev.org | `gistory-sync` |
| railyard | composer | In Development | railyard.creadev.org | - (service, not a package) |
| prestruct | product | Live | prestruct.creadev.org | `prestruct` |
| freestruct | product | Live | freestruct.creadev.org | `freestruct` |
| vant | product | Live | vant.creadev.org | `vant-os` |
| migrare | product | Backburner | migrare.creadev.org | `migrare` (contested; work parked, rebrand deferred) |
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

1. **`apps.react.jsx`** - for React/coreforge `web/` consumers: renders the full
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

### 5.1 The roll-up's address and cache contract (G12)

`registry.json` is a build artifact, and consumers (creadev.org, vant's connector,
railyard) all need it - so it needs a **stable address and a cache policy**, or
every consumer re-derives it and the copies diverge. The contract:

- **`apps.json` is the canonical source;** `registry.json` is one rendering of it.
  One artifact, many readers, no divergent copies.
- **the roll-up serves at a versioned path** (so a consumer pins the shape it
  knows) with an `ETag` and a max-age, so a consumer caches cheaply and
  revalidates cheaply.
- **a checksum rides the surface** (`lock`, §6), so a consumer can prove the copy
  it read is the copy the suite emitted - the same tamper-refusal law the arms
  apply, one level up.

---

## 6. The doctor (the load-bearing half)

Small, toothy, refusing - the shape that made packstruct's linter the immediate
payoff:

```
govstruct lint              # manifest fields, id==filename, https, unique urls, order collisions, copy voice
govstruct render <target>   # emit react | partial | readme | registry from the manifest
govstruct doctor [--suite]  # adopter-side checksum gate, or suite-wide truth battery
govstruct check             # run the compliance shape packs over this tree
govstruct registry          # emit the suite roll-up (env / pins / floors / versions)
govstruct lock              # archive + sha256 receipt, monoforge-shaped
govstruct names <id>        # G2 - check a candidate id against npm, GitHub, and the roster
govstruct migrate           # G6 - --status / --dry-run a spec or field migration
govstruct init              # G9 - scaffold a one-member family (the stranger's first minute)
```

The doctor REFUSES, never warns-into-green: duplicate ids, URL/HTTPS breaks,
menu order collisions, any artifact whose checksum moves without a version bump.
Refusals are nameable at author time (the crashtest#16 lesson, baked in from day
one). **`--suite` refuses drift; a lagging adopter inside the roll-up is a state,
not a crime** (the author-time-vs-run-time split packstruct already draws).

### 6.1 Offline by default, online on request (G11)

The doctor checks URL resolvability (§4) - and that needs a socket, while every
other arm's law is **no sockets** (crashtest's invariant). The two must not blur,
or a CI gate becomes network-flaky. So the doctor is split explicitly:

| mode | what it checks | needs a socket? |
|---|---|---|
| **offline** (the default) | manifest grammar, pins, floors, checksums, the graph, the refusal vocabulary | **no** - deterministic, CI-safe, the same run everywhere |
| **online** (`--network`) | URL resolvability, npm existence, GitHub repo existence | yes - opt-in, never in the default gate |

The default run is byte-deterministic like crashtest's: same commit, same
verdicts. Network truth is a separate, explicit ask.

### 6.2 The naming authority (G2)

The rename (§16.5) was also a *collision fix*: `flowforge` was taken on npm, and
nothing checked before admitting it. `govstruct names <id>` extends the doctor's
"unique" rule outward - it checks a candidate against npm, GitHub, and the
roster, and the manifest carries a `names.reserved` block so a claim is
**recorded, not remembered**. The doctor refuses a member whose id collides with
a reserved name or a live registry entry.

### 6.3 The graph (G3)

With `needs[]` on the member block, the doctor **topo-sorts** the suite: it
orders its checks by dependency, refuses a cycle, and the roll-up renders the
graph. This is also the propagation path - a floor bump on a member is a diff the
doctor walks to every dependent.

**Implemented.** `src/graph.mjs` derives the adjacency from `needs[]` (forward
and reverse). The roll-up (`registry.json`) carries `graph[]` - one
`{ id, needs, neededBy }` row per member. `govstruct impact <id>` walks the
reverse closure and reports every direct and transitive dependent: the "who
does a bump here touch?" answer, derived from the manifest, never
hand-maintained. An unknown id refuses by name (`E_IMPACT_UNKNOWN_MEMBER`).

### 6.4 One refusal vocabulary (G10)

The family's core law is "refusal instant and nameable" - but each tool names its
own codes (`E_CARRIER_*`, `E_TRAVELER_*`, packstruct's loader errors). A refusal
the next tool cannot **recognize** is not portable. govstruct ships a **shared
refusal-code registry**: namespaced by tool (the pack-id pattern), so the doctor
can report "member X refused with `E_...`" and a consumer can act on it. This is
the deepest interop gap - it is what makes the arms one system instead of five
tools that share a repo. The registry is data (a JSON file), not a dialect; each
tool keeps its own codes and registers them.

### 6.5 The write path (G1)

§16.9 lets a **machine** write the manifest, and that is new: until now the
manifest was authored by hand. Two agents stamping at once is a race, and the
manifest is a committed file - last-write-wins silently loses a member. So the
write path is explicit:

- **a stamp opens a PR, never commits to `main`.** The same gate every human
  change passes. CI is the serializer; the manifest is append-mostly, and a
  member row is a small, mergeable unit.
- **the doctor is the pre-merge check.** A stamp PR that fails `doctor --suite`
  cannot merge - the machine's change is governed exactly like a human's.
- **a lock is the fallback** if the PR path proves too slow for a burst of
  stamps: a single writer holds a lease, and the lease is a ledger row. Lean:
  start with the PR, add the lock only when measured contention demands it.

This is the difference between a registry (last writer wins) and a governance
system (every write is a reviewable, refusable claim).

### 6.6 Lifecycle and revocation (G7)

A member is not just `Live` or not - it is **born, changed, and retired**, and
retirement must not break the links that point at it. The lifecycle:

```
Live -> Beta -> In Development -> Backburner -> Archived -> Tombstoned
```

`Tombstoned` is the new terminal state (§4's `status` enum). Its law: a retired
member **keeps its `aliases` forwarding** and its row, so an old id or url
resolves to a tombstone ("retired") - **never a 404**. The doctor refuses a
tombstone that points at nothing (a tombstone with no alias and no history is a
lie about a member that never existed). This is the same honesty rule as a
rename (§16.5): a consumer that knew the old name reads what happened, never a
silent void.

**Implemented (G7).** The transition is recorded in the member's `history[]`
(§4), and `status` must agree with the last transition - a member carries the
receipt of how it got here, so a tombstone is provable, not asserted. The
ladder is forward-only: a backward step (`E_HISTORY_BACKWARD`), a malformed
history (`E_HISTORY_INVALID`), and a status/history mismatch
(`E_HISTORY_MISMATCH`) are refusals. `govstruct retire <id>` is the governed
write - it keeps the member's row (so the id resolves), records the Tombstoned
transition, and appends one ledger row (G14). Retirement is terminal: a second
retire refuses (`E_RETIRE_ALREADY_TOMBSTONED`).

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

**These three are the natural arms of govstruct enforcement.** govstruct does not
re-implement attack, capture, or baked-artifact audit - it **delegates** each to
the arm that already owns it: crashtest attacks the loader, eyestruct watches the
rendered pane, poststruct audits what shipped, and all three consume the
`/packs` contract govstruct adopts from packstruct. Enforcement is a **composition
of the suite's existing arms**, not a new mechanism (§11).

**railyard adopts the same packages.** The composer runs the same arms - it does
not carry a private copy of any check. So the tool members and the deployment
share one enforcement surface: `packstruct` (the spec), `crashtest`,
`eyestruct`, `poststruct` (the three arms), and `govstruct` (the governor). The
rest of the family that does not yet carry these packages adopts them the same
way - through the four enforcement paths in §3.3, not by hand.

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

### 7.2 The verdict bus (G4)

The self-proof above is a **pull**: the suite polls every member at a pinned rev,
so the roll-up is only as fresh as the last cron, and a member that ships tells
nobody. `family-status@1` is *per-member* proof; there is no aggregate signal. So
the suite adds the other direction - a **push**:

- a member's CI **emits a signed status receipt** on green (the ledger pattern,
  one level up: the same append-only, tamper-refusing shape the arms already
  use);
- the receipt names the member, the rev, the verdicts, and the refusal codes
  (§6.4) - it is portable because the vocabulary is shared;
- the roll-up reads receipts when fresh and falls back to polling when not, so
  "the suite is green right now" is a fact, not a cache age.

No new protocol: the receipt is the status dialect the family already speaks,
with a suite-level reader added. This is what turns five members' green CI into
one suite signal.

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
- **The migration ritual (G6).** A rename (§16.5) and a factory move (§16.6) are
  two instances of one class: **a governed change that touches many repos.** A
  schema change (SPEC v2, a new required field) is the same class. So govstruct
  ships a `migrations/` convention and `govstruct migrate --status / --dry-run`:
  a spec bump lands with a named, resumable migration (vant's own migration
  shape, §16.8), each member's progress is a row, and the doctor refuses a member
  that skipped a required step. No more scrambling a fleet-wide edit by hand.
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
- **Older member sites will be refactored to the coreforge rig.** Several
  member sites predate the coreforge shell and will be re-cut to its template
  style so the suite looks like one family. govstruct's part: the roster already
  knows every member's `url`, so a refactor is a data change, not a hunt - and
  the render surfaces (§5) emit the same pane to every adopter regardless of
  which shell generation it runs. A member mid-refactor is a `status`, not an
  exception.

---

## 10. The compliance contract (the governed surfaces)

v0.2's Part II, kept - it is the strongest part of the draft. Each surface is a
manifest block, a doctor rule, and a pack. All six are **receipt-backed**: the
drift they name was measured in the suite, not assumed. S1-S4 are the original
contract; S5 (a11y/i18n, G8), S6 (credential delegation, G5), and S7
(source-level consistency, G15) are the additions the ecosystem gaps forced
(§18). S7 is the first surface with more than one pack - it is a **family** of
five checks, because "source consistency" is not one rule but five (§16.11).

### S1 - Runtime floors (`engines`)

The suite's node floors have drifted, with no registry holding them:

| member | `engines.node` | note |
|---|---|---|
| packstruct | `>=20` | battery floor (ESM conformance via `require(esm)`) |
| poststruct | `>=20` | |
| freestruct / prestruct | `>=20` | |
| eyestruct | `>=18` | consumer floor |
| coreforge | `>=18` | |
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

coreforge's census leg already encodes the law: `package.json` is THE single
version source, and `web/package.json` plus the README status line must match or
the release commit fails. Generalize: any living surface that names the current
version is checked against the root. The lawful exceptions coreforge already
classified (dated era rows, range pins `^1.0.0`, other packages' versions) carry
over verbatim.

### S5 - Accessibility and i18n (G8)

The menu and registry render on **every** member site, and poststruct audits
`hreflang` - but govstruct's own surfaces have no stated floor. A mesh that is
present but unusable is not governed. So a fifth surface:

- **a11y:** the rendered pane carries a landmark, a real anchor (never a `div`
  with a click handler), a keyboard order, and a visible focus ring; contrast
  meets WCAG AA. Checked by poststruct's existing leg (the interop law: govstruct
  invokes the sibling's public CLI, re-implements nothing).
- **i18n:** the pane's strings are keyed, `hreflang` is honest, and a missing
  locale falls back explicitly (never a blank). poststruct already audits the
  `hreflang` half; the keyed-strings half is a new pack row.

**Implemented (G8).** `packs/public/a11y-shapes` checks the structural floor
that travels with the emitted bytes: the pane carries a named landmark
(`<nav>` with `aria-label`), a real anchor per row (never a `div` with a click
handler), a `:focus-visible` rule, and keyed chrome strings
(`data-i18n` + `data-i18n-default`) with an explicit fallback. Each refusal is
nameable: `E_A11Y_NO_LANDMARK`, `E_A11Y_FAKE_ANCHOR`, `E_A11Y_NO_FOCUS`,
`E_I18N_UNKEYED`, `E_I18N_NO_FALLBACK`. The deeper DOM/contrast leg stays
poststruct's - govstruct invokes the sibling's public CLI and re-implements
nothing.

### S6 - Credential delegation (G5)

The scariest surface for an agent-minted world (§16.9). An agent stamping a repo
needs a GitHub token, an npm OIDC grant, a domain record. §10's env registry
governs *env vars*; it does not govern **who may spend a credential**. So:

- every member's `grants[]` (§4) lists the credential **kinds and scopes** its
  stamps may spend - a stamp cannot spend a credential absent from the list;
- a stamp runs under a **scoped, single-use grant** (vant's escrow pattern,
  §16.8, is the reference implementation), logged to the same append-only ledger
  as the mint;
- the doctor refuses a stamp whose grant exceeds its member's `grants[]` - **a
  stamp cannot widen a wall.**

This is the surface that makes §16.9 safe. Without it, an agent that can mint a
repo can also spend any credential the minting process holds; with it, the
credential is scoped to the member and the operation, and the spend is a ledger
row.

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
  a11y-shapes/pack.json      # S5: landmark, anchor, focus, i18n keys
  test-shapes/pack.json      # S7: a test exists for every living module
  hygiene-shapes/pack.json   # S7: no debugger, no stray log, no committed secret
  naming-shapes/pack.json    # S7: file names match ids, no cross-namespace imports
  style-shapes/pack.json     # S7: the family's style, as data
  comment-shapes/pack.json   # S7: public exports are documented (presence only)
```

The last five are the **source-level consistency** packs (§16.11) - the answer to
"many hands, one codebase." They are `check` packs, not a fifth app: the mechanism
is section 11's, the rules are data.

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
- **coreforge (rigs sites).** govstruct's render surfaces are coreforge
  deliverables - they ship in the rig, and the rig's birth-gate gains the suite
  floor as a second input. A new site birthed from the rig inherits the pane and
  the floor check in one step.
- **gistory (the prototype factory).** The staging-mount + ferry doctrine is
  already the mechanism: `*-staging/` trees ride `monoforge-ferry.yml`
  (sha256-gated, converge-on-HEAD) into standalone repos. govstruct rides the
  identical ferry - no new infrastructure.
- **railyard (the composer).** §3.3.

---

## 12.1 The `/labs` convention (family-wide)

The family's working artifacts live in a **`labs/`** directory at each repo's
root, not scattered: eyestruct's committed visual memory (`labs/.eyes/`),
crashtest's ledger (`labs/crashledger.json`) and `labs/hardening.md`, PRDs and
TASKS logs, and vant's `labs/` (WIRING, canonicalization roadmap, the PRD set).

govstruct adopts the convention and names it, because it is the natural home for
**govstruct's own working state**:

| artifact | home |
|---|---|
| the work log / TASKS | `labs/TASKS.md` |
| the crash ledger | `labs/crashledger.json` + `labs/hardening.md` |
| the eyes | `labs/.eyes/` |
| the PRD set | `labs/prd-*.md` |

Two laws fall out, both already true in the family:

- **`labs/` is a receipt, not config.** The rename doctor (§16.5) must **skip
  `labs/`** when scanning for living identity literals - a PRD or a TASK log that
  says `flowforge` is history, and rewriting it would be a lie. The census gate
  already skips it; govstruct's pack must too.
- **`labs/` is per-repo, never governed.** govstruct's manifest names *members*,
  not the files inside them. `labs/` is a member's private memory; the doctor
  reads a member's declared surfaces, not its work log.

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
  packs/public/*/             # the shape packs (§11)
  web/                        # coreforge landing shell (prestruct-prerendered)
  docs/                       # coreforge Jekyll rig (Pagefind + freestruct)
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

`web/` and `docs/` are the coreforge rig verbatim (identity swapped), per the
house rule "adopt explicitly, start from a checkout." The **birth gate is
inherited as-is** - a govstruct that fails the suite's own birth gate never
ships.

---

## 14. Non-goals

- **No runtime menu service, no CDN-injected widget, no fetch-on-mount.** The
  served HTML is the contract.
- **No governance of card prose, images, or marketing copy.** Only mechanical
  truth (mesh + compliance). **The source-level split follows the same line:**
  structure (a test exists, a name matches, a comment is present) is govstruct's
  (§16.11, S7); **voice** (tone, register, wording) is poststruct's - govstruct
  never judges a sentence, it invokes the sibling that owns that leg.
- **No auto-runbook rewrite of any adopter repo by the robot.** PRs only,
  reviewed merges only.
- **No new "gov" coverage beyond the contract.** The manifest, the render
  surfaces, the doctor, the four-arm dogfood, and the six compliance surfaces -
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
- **M0.5 - baselines (before any build).** The frozen references the build is
  measured against, so "the tool works" is a diff, not an opinion: the roster
  truth snapshot (every member's served url, npm name, engines floor, pins,
  captured as data); the **refusal-code inventory** (every `E_*` the arms already
  emit, so G10's registry starts from reality, not invention); the rendered-pane
  baseline (the eyestruct pin + the current menu's `look`); and the doctor's
  **expected verdict set** over the reference roster (what a green run must
  refuse, and what it must pass). Baselines land as fixtures under `test/`, the
  same two-way pattern packstruct uses. **No build step precedes this** - a
  baseline cut after the build measures the build, not the truth.
- **M1 - manifest + doctor + surfaces.** `govstruct-staging/` in gistory;
  `apps.json` v1 inked with the **full 23-member roster** and their verifiable
  truths; `lint`/`render`/`doctor` green; artifacts emit; crashtest shape pack
  and packstruct conformance pack both green. Stamp target 0.9.0.
- **M1.5 - compliance contract inked.** `spec/` v1 for the six surfaces (S1-S6);
  `compliance/<id>.json` populated for every member from *measured* reality (the
  floor table §10 S1 is the first receipt); the shape packs lint clean under
  packstruct. The `clause` field (§4) is carried from the start; the full ISO
  9001/27001 mapping ships later as a profile pack, not in the core.
- **M1.5b - the fleet meter + the audit ledger (G13, G14).** The golden case made
  real: `doctor --suite --fleet` reads the live fleet and reports every drift on
  one page (§16.10's table is the first receipt); the audit ledger (§19) records
  every governance action from the first one, chained and verifiable offline. The
  ledger ships **with** the meter, not after - a meter whose findings leave no
  record is half a tool.
- **M1.5c - the source packs (G15).** The five S7 check packs land and run at
  both tiers (stamp gate + fleet meter). Each pack ships with a fixture that
  breaks it, and the comment pack checks **presence only** - tone is poststruct's
  leg. This is where "many hands, one codebase" stops being a complaint.
- **M1.6 - the gate rules (G10, G3, then G1+G5).** The three gating gaps land in
  order: the shared refusal-code registry (§6.4), the dependency graph + topo-sort
  (§6.3), and the write path + grants pair (§6.5, §10 S6). Each ships with a
  fixture that breaks it. The remaining gaps (G2, G4, G6, G7, G8, G9, G11, G12)
  land as independent rules once these three hold (§18, "the build order").
- **M2 - move day + first adopters.** Standalone `dhaupin/govstruct`
  (monoforge-stamped), OIDC-release ladder per coreforge's template; coreforge
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
- **M3.5 - the four proving cases, executed.** (a) Rename **flowforge →
  coreforge** (§16.5): one manifest edit, the suite-wide census pack refuses any
  living literal left behind, receipts stay frozen. (b) Delegate **monoforge's
  factory gistory → railyard** (§16.6): land the payload, flip `home`, the
  home-drift rule refuses the double-claim until gistory's entry retires.
  (c) **vant handshake** (§16.8): ship the `vant` connector + adapter together
  (vant already runs packstruct/crashtest/eyestruct - only the governor is
  missing) and stand up the drift detector over a vant install's declared shape.
  (d) **the stamp loop** (§16.9): railyard's door verb mints a member, monoforge
  doctors it, govstruct records and re-verifies it. These are the concrete tests
  of the OSS claim - the tool survives a real rename, a real factory move, a real
  OS, and a machine writing its own roster.
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

### 16.4 The stranger's first minute (G9)

§16.7 says the repo is clean; §15 M4 says a second family proves it. Neither says
**how** a stranger starts - and "the OSS proof" stays a claim until they can.
So the onboarding path is part of the contract:

- **`govstruct init`** scaffolds a one-member family in under a minute: a
  `govstruct.config.json`, a `members/hello.json`, and a green `doctor`. The
  target from §0 - *a stranger runs it on their own family within a minute of
  cloning, no Creadev-shaped assumptions to unpick.*
- **`examples/`** carries one complete worked family (the tool's own), so the
  shape is copyable, not described.
- **the rule of three gates the *suite* claim, not the *tool* claim.** A stranger
  can govern one member on day one; "suite" waits for a second unrelated family
  (§15 M2.5). Onboarding is what earns the claim, so it ships before the claim is
  made.


---

## 16.5 Case study: renaming a member (flowforge -> coreforge)

**Decided 2026-10-29.** The member formerly called `flowforge` is renamed
**coreforge**, at `coreforge.creadev.org`. It is govstruct's first **proving
case**: the exact event the tool exists to make survivable. If govstruct cannot
make this a one-edit, doctor-checked operation, it has not earned its seat.

### The rename is also a fix

`flowforge` on npm is **owned by an unrelated party** (`kenkaiiii`), while the
repo's `package.json` declared `"name": "flowforge"` - a name it could not
publish under. `coreforge` is **free** on both npm (404) and GitHub (404). So the
rename resolved a latent collision, not just a preference. This is why the
manifest's `npm` field is separate from `id`: the published name and the member
name are already allowed to differ.

### What had to change (measured, 2026-10-29)

`flowforge` appeared in **255 places across 4 repos** - but the raw count is the
wrong metric. Only a **living reference** changes; a **frozen receipt** must not
(rewriting history is a lie).

| category | where | rename? |
|---|---|---|
| **Identity** (the one source + generated outputs) | `site.config.js`, `package.json`, `web/package.json`, `web/ssr.config.js`, `docs/_config.yml`, `docs/freestruct.config.yml`, `web/public/robots.txt`, `web/public/site.webmanifest` | **yes** - `site.config.js` first, then `npm run sync` regenerates the rest |
| **Living references** (structural surfaces that hardcode it) | `.github/workflows/*`, `lib/*`, `tests/*`, `web/scripts/*`, `AGENTS.md`, `README.md`, `DEPLOY.md`, `docs/index.md` | **yes** - tokenize or source from config |
| **Cross-repo living** | monoforge `templates/` (stamped into new repos), railyard `mounts/state.json` + `factory.json`, govstruct roster | **yes** - but only the live ones |
| **Frozen receipts** (history) | `CHANGELOG.md`, `MANIFEST.md`, `labs/TASKS.md`, `labs/prd-*.md`, code comments citing `flowforge#30` | **no** - never rewrite history |
| **Lockfiles** | `package-lock.json`, `web/package-lock.json` | regenerate, do not hand-edit |

### Why the fleet was already half-ready (and where it was not)

The mechanism exists: the **brand census gate**
(`lib/gates/check-brand-census.mjs`) refuses an identity literal that lives
anywhere but `site.config.js`, over 22 named structural surfaces - **content and
filenames** (the filename leg exists because a brand name in a path is invisible
to a content scan; it bit twice). `npm run sync` fans the non-JS surfaces out of
the one config. So the repo's *own* rename was close to one file.

Three gaps the census gate does **not** close, which is precisely govstruct's
job:

1. **Cross-repo literals.** The gate only scans the member's own `web/` + `docs/`.
   It cannot see railyard's `mounts/state.json`, monoforge's `templates/` (which
   get **stamped into brand-new repos** - a miss here ships the old name into
   every future member), or govstruct's roster. **No member can see the others'
   literals; only the composer can.**
2. **The npm name.** The gate polices the *site* brand, not the published
   package name.
3. **The ferry tree name.** railyard's registry points at `flowforge-staging/`;
   a rename moves the tree, so the registry entry moves with it.

### How govstruct makes it a governed operation

1. **One edit.** The member block `members/coreforge.json` (id, `name`, `url`,
   `npm`, `repo`, and `aliases: ["flowforge"]`). Everything downstream derives.
2. **The doctor refuses the half-done rename.** `govstruct doctor --suite` fails
   while *any* declared surface still carries the old literal - in the member, in
   monoforge's templates, in railyard's registry, in govstruct's roster. The
   refusal names the file, exactly as the family's gates do. This check did not
   exist before; it is the tool's reason to exist.
3. **Render surfaces re-emit.** The README table snippet, `registry.json`, and
   the menu pane regenerate from the new manifest - the mesh updates everywhere
   at once, not by hand.
4. **The ferry acts.** railyard's registry moves to the new tree/repo; the next
   cut stamps the new name into new repos.
5. **Receipts stay frozen.** CHANGELOGs, TASKS logs, and issue citations keep
   saying `flowforge` - correctly, because that is what happened. The doctor must
   tell a living surface from a receipt, or it would demand we falsify history.
   **This is the single hardest part of the design** and the reason the census
   gate strips comments and skips `labs/`.

### The design consequences govstruct inherits

- **A rename is a `status`-like state transition, not a delete+add.** The old id
  needs a tombstone (the `family-status@1` "not serving the dialect" honesty rule
  applied to identity): a consumer that still knows `flowforge` reads "renamed to
  coreforge," never a 404.
- **`aliases` field** (§4) - `aliases: ["flowforge"]` makes the rename reversible
  and old links resolve.
- **The census gate generalizes into a govstruct pack.** `check-brand-census`
  becomes a `check`-profile pack that runs *suite-wide*, not per-repo - the first
  concrete instance of §11's "compliance rules ARE packs."
- **The rename is the M3.5 proof.** The OSS claim ("a stranger can govern their
  own family") is only credible if the tool survives its own hardest operation.

---

## 16.6 Case study: delegating a factory (gistory -> railyard)

**The second proving case, and the harder one.** monoforge was prototyped inside
gistory and is now a standalone repo. Its staging tree, its ferry scripts, and
its `boot/` bytes still live in **gistory's** `mounts/` registry. The owner wants
them to live in **railyard** instead. So: *when the factory that owns a repo
changes, how does every other repo find out?*

### The state today (verified 2026-10-29)

**monoforge is registered in two registries at once** - the duplication that
makes this a governance problem, not a `git mv`:

| registry | monoforge entry | also registers |
|---|---|---|
| `dhaupin/gistory@main` `mounts/state.json` (2026-10-28) | `tier: public`, `tree: monoforge-staging/`, `repo: dhaupin/monoforge`, `boot.tars` + `boot.handoff` populated | poststruct |
| `dhaupin/railyard` `mounts/state.json` (2026-10-29) | `tier: public`, `tree: monoforge-staging/`, `repo: dhaupin/monoforge`, `boot: {}` (empty) | flowforge |

gistory still carries the trees the registry points at: `monoforge-staging/` and
`poststruct-staging/` are real directories in gistory's root. railyard's entries
are registered but **no payload has landed** (its boot objects are empty; its own
`boot/README.md` says "its move out of dhaupin/gistory is the next step").

### What "delegating the factory" actually means

This is **not** a rename: the member `monoforge` keeps its name. What moves is
the **ownership of its ferry** - which registry is authoritative for where its
bytes come from. So the delegation is a change to a member's **`home`**, a field
the manifest did not have. (The rename case, §16.5, changed the *id*; this changes
the *factory*.)

The clean model: **a member has exactly one authoritative registry.** govstruct's
manifest names it in a new `home` field; railyard's registry is the operational
record it points at. Two registries both claiming monoforge is a **drift** the
doctor refuses - the same class as two members claiming one npm name.

### The migration (what happens, step by step)

1. **Cut the payload in the old home.** gistory runs its ferry
   (`make-staging-tars.sh`) and produces `monoforge-staging-git-<date>.tar.gz`
   plus the lock archive - byte-deterministic, per the mounts contract.
2. **Land the payload in the new home.** railyard receives the tars into
   `mounts/public/monoforge/boot/tars/`, and its `state.json` `boot` object is
   populated to match gistory's (the bytes, not a claim about them).
3. **Flip the manifest.** govstruct's `members/monoforge.json` gets
   `home: "railyard"` (was `"gistory"`). One edit.
4. **The doctor refuses the overlap.** While *both* registries still list
   monoforge as authoritative, `govstruct doctor --suite` fails and names both
   files. The migration is not "done" until the old entry is retired.
5. **Retire the old entry.** gistory's `state.json` drops monoforge (and its
   `monoforge-staging/` tree moves out, or is archived as a receipt); poststruct's
   move follows the same path when its turn comes.
6. **Receipts stay frozen.** gistory's TASKS log keeps saying monoforge lived
   there first - that is history, and the doctor must not demand it change.

### Why this needs a `home` field and a home-drift rule

- **`home`** (enum, the composing factory: `railyard` | `gistory` | ...) - added
  to the manifest (§4). It is the member's **ferry authority**, distinct from
  `repo` (where the source lives) and `role` (what it does).
- **The home-drift rule.** The doctor cross-checks every member's `home` against
  the registries it can read, and refuses a member claimed by two homes or by
  none. This is the check that makes a factory delegation safe - without it, the
  switch is a hope, not a guarantee.
- **The registry is data, not law.** railyard's `mounts/state.json` is the
  operational record; govstruct's manifest is the governance record. They must
  agree, and the doctor is what proves they do. This is §3.3's "meet at
  `repo` + `tier`/`role`" extended to `home`.

### The lesson for the OSS tool

A stranger adopting govstruct will hit this exact class: a repo whose build
factory changes (a monorepo splits, a CI provider moves, a vendored tool is
extracted). The general shape - **a member names its home, the doctor refuses a
double-claim, receipts stay frozen** - is why this is a case study and not a
one-off chore. It is the second proof that the tool is general.

## 16.7 OSS repo hygiene: clean tool, real deployment

govstruct is **MIT and open source**. The repo is a **tool**, and it must read
that way to a stranger: no Creadev data in the tree. The reference deployment
lives in **railyard**, which runs govstruct against the real 23-member roster.

This is the §0 line, made a build law:

| the tool repo (`dhaupin/govstruct`) | the reference deployment (railyard) |
|---|---|
| `src/` - the general engine, zero deps | `members/*.json` - the real roster |
| `govstruct.config.json` **schema** + a tiny `examples/` family | `govstruct.config.json` - the Creadev config |
| the renderers, the doctor, the packs | the emitted `apps.json` + surfaces |
| a **fixture** suite (`test/fixtures/`) | the suite-wide CI that runs it for real |
| README/docs written for strangers | creadev.org docs, the real domain |

**The hygiene gate.** A check in the tool's own CI refuses a Creadev literal
(`dhaupin`, `creadev`, a real member name, a real domain) anywhere in `src/`,
`README.md`, `docs/`, or the config schema. The names are allowed **only** in
`examples/`, `test/fixtures/`, and this PRD's case studies. This is the same
shape as coreforge's brand census gate (§16.5), aimed inward at the tool: the
tool cannot smuggle the reference deployment into the general product.

**Why this matters for adoption.** A stranger evaluating govstruct must be able
to run `govstruct lint` on *their* family within a minute of cloning, with no
Creadev-shaped assumptions to unpick. Every "the roster" in this PRD means *the
reference roster*; the tool's roster is whatever the adopter's `members/` holds.
The rule of three still gates the "suite" claim (§15 M2): govstruct does not
call itself a suite tool until a second, unrelated family uses it.

**What stays in the tool repo, on purpose:** the case studies (§16.5, §16.6),
because they are the design record and they are *about* governance, not *the*
governance. They name real members to prove the tool survives a real rename and a
real factory move - the strongest possible evidence for a stranger that the tool
is not theoretical. Marked as case studies, they read as receipts, not config.

---


## 16.8 Case study: vant - governing an Agent OS that freeballs

**The third proving case, and the one that proves govstruct is general.**
[vant](https://github.com/dhaupin/vant) ("the Agent OS", v0.8.6) is a big,
real system: persistent memory in `models/`, an agent crew, a consensus ledger,
a governance module, a carrier system, a mesh, and **21 connectors**. It has
**no suite-level governance** - each agent freeballs its own schema - yet it has
**already adopted three of the five arms**: `packstruct@^1.0.0` (the pack
contract), `crashtest@^1.1.0` (the attack harness), and `eyestruct@^1.0.0` (the
visual memory in `labs/.eyes/`). So the question is exact: *vant is already half
in the family - how do vant and govstruct close the other half?*

> **Verified against the `axolotl` branch code, not the docs (2026-10-29).**
> Vant's docs are stale: the README and `packs/README.md` on `main` describe a
> six-pack, crashtest-only tree. The `axolotl` branch carries **21 packs**, a
> `packstruct` devDependency, a real `packstruct audit-conformance` gate, and
> the `eyestruct` visual memory. **The docs lag the code by a wide margin** - and
> that lag is itself the drift govstruct is built to name.

### The state today: vant on axolotl (verified 2026-10-29)

| surface | what vant actually ships | the gap |
|---|---|---|
| `/packs` | **21 packs** under `packs/public/` (`vant-brain`, `vant-carriers`, `vant-kernel`, `vant-spine`, `vant-relay`, `vant-teams`, `vant-stones`, ...), all crashtest attack packs | the `pack.json` shape (`schemaVersion/name/description/version/entry`) **already matches packstruct SPEC v1's shared field set**, and vant **already runs `packstruct@^1.0.0`'s `audit-conformance`** as a real gate (`scripts/audit-packs-gate.js`) with a host loader (`scripts/audit-host-loader.js`). The contract is **adopted** - what is missing is govstruct *reading* it |
| governance | `lib/governance.js` - an **ethics** module (transparency / consent / benefit / non-harm) with a durable decision log | governance here means *deciding well*, not *conforming to a contract*. Nothing holds a schema in place |
| consensus | `lib/consensus.js` - 51% agent voting, one vote per agent, audit trail | consensus says what agents **agree on**; nothing says what the system **is** |
| drift | `labs/prd-canonicalization.md`: "Vant has many well-built systems that don't talk to each other." `labs/WIRING.md` grades every subsystem **WIRED / OPT-IN / ORPHAN / GAP** | the ledger is **hand-maintained prose**; nothing refuses an orphan |
| ISO 9001 | clause **8.5.2** adopted in code (traveler: content-derived address, append-only ledger, pin ledger, tamper-refuse, `auditReport`) | adopted **inside one subsystem**, not as a suite property; ISO 27001 not framed at all |
| carriers | `lib/carriers.js` lanes `nsc9\|stone\|svg\|json\|qr`; `lib/traveler.js` mint→advance→verify→persist + append-only ledger | a rich, real system with no roster of what carriers/plans exist |
| adapters / connectors | `lib/adapters/{github-fragmenter,langchain,sidecar}`, `lib/connectors/` (**21**: github, gitlab, bitbucket, gitea, s3, pinecone, python, go, rust, node, julia, php, ruby, hermes, crewai, ...) | **the seam already exists** - this is where the two projects shake hands |

The freeball is the drift: an agent writes a schema for its own brain, its own
pack, its own connector, and nothing holds the shape. Vant's own WIRING ledger
names the symptom (`ORPHAN`, `GAP`) - but a prose ledger cannot *refuse* one.

### The two relationships (both are real, and they are different)

1. **vant as a member.** vant is one row in the reference roster - the Agent OS
   of the family. govstruct renders its card, its pin, its floor, like any
   member. (Already true in §4.1.)
2. **vant as a governed system.** This is the new one. A vant **install** is
   itself a family of surfaces - brains, packs, carriers, connectors, adapters,
   compliance - and *that* family can be governed by a manifest. govstruct does
   not govern vant the product; it governs **a vant install's declared shape**.
3. **vant as a railyard client.** Vant agents should be able to **stamp** - mint
   a repo from the forges and register it - through railyard. §16.9.

### The handshake: vant is already half in the family

The integration is **not a rewrite and not even a conformance pass** - vant
already runs the arms. What is missing is the **governor**:

| arm | vant's status (axolotl, verified in code) | what govstruct adds |
|---|---|---|
| **packstruct** | **adopted** - devDependency `^1.0.0`; `audit-conformance` gate + host loader in `scripts/` | govstruct reads vant's packs through the *same* contract; they become rows a suite doctor can see |
| **crashtest** | **adopted** - `^1.1.0`, 21 packs, `test:crashtest` inside `check:battery` | the suite roll-up consumes vant's verdicts (the verdicts stay vant's) |
| **eyestruct** | **adopted** - `^1.0.0`, `labs/.eyes/` visual memory | the pane govstruct renders is eyestruct-watchable, like any member's |
| **poststruct** | **partial** - `StructAudit` surfaces exist in `web/`; no `poststruct` devDependency yet | the shipped-artifact audit joins the suite battery |
| **govstruct** | **absent** - zero references | the member manifest + the doctor: the layer that ties the four together |

So the work is the **connector + adapter, shipped together** (owner decision
2026-10-29 - this is a serious integration, one of vant's first outside what it
built for itself):

- **A `vant` connector** (in vant's own `lib/connectors/` shape, extending
  `BaseConnector`): a vant install reads the family roster through govstruct, so
  a brain knows its siblings without hand-typing them. Direction: *vant speaks
  govstruct.*
- **A `vant` adapter** (in govstruct's reader shape, riding vant's
  `lib/adapters/sidecar.js` parity seam): the doctor reads a vant install's
  `models/`, `packs/`, and `state/` and verifies the declared shape. Direction:
  *govstruct speaks vant.*

Both directions ride interfaces vant **already built** (`connectors/base.js`,
`adapters/sidecar.js`, `connector.js`) - **vant provides the transport, govstruct
provides the contract.** Neither absorbs the other. That is "fwens," concretely.

### The drift answer: consensus is a vote, governance is a ledger

Vant has a consensus engine and a WIRING ledger; what it lacks is a **drift
detector** - something that compares what the system *says it is* against what it
*actually is*, and refuses the gap. That is exactly `govstruct doctor`:

| vant has | govstruct adds |
|---|---|
| `consensus.js` - agents vote on a decision | `doctor` - the system's declared state vs. its actual state |
| `WIRING.md` - a hand-graded prose ledger | a **machine-checked** ledger: an `ORPHAN`/`GAP` becomes a **refused** finding, not a note |
| `governance.js` - ethics for a decision | conformance for a **shape**: floors, env, pins, versions |
| per-subsystem ISO 9001 (8.5.2) | a **suite-wide** ISO record: the manifest + verdicts + lock receipts are the documented-information control |

So the "informational / consensual / drift" split resolves cleanly:
**consensus is per-decision (a vote), governance is per-state (a ledger), and
drift is the gap the doctor refuses.** Vant keeps its consensus; govstruct adds
the ledger of record.

### The ISO angle (9001 and 27001)

Vant already maps ISO 9001:2015 clause 8.5.2 in code. govstruct generalizes it
from *one subsystem* to *the whole install*:

- **ISO 9001 (quality / traceability).** Every govstruct check can **name its
  clause**, the way the traveler's `auditReport()` does. The manifest is the
  identification of outputs; the doctor verdicts are the traceability of
  processing; the `lock` receipt is the retention of documented information; a
  refused drift is nonconforming-output control. govstruct's `check` emits the
  clause-named record - so a suite becomes auditable, not just green.
- **ISO 27001 (security).** Maps onto §10's env registry + pin ledger + secret
  hygiene: the `EYESTRUCT_*`-style env contract, the pinned versions, and the
  "no plaintext secret" law are the Annex-A-shaped evidence. govstruct does not
  claim certification; it emits the **evidence a certification would need**.

This is the deepest form of the §16.7 hygiene rule: govstruct stays general, and
the compliance clauses it can evidence are a property of the tool, not of Creadev.

### The carrier system and the tier rig

Vant's carrier lanes (`nsc9|stone|svg|json|qr`) and its `models/{public,private,
local}` tier rig are **the origin of the family's tier spec** (the mounts/ packs/
models/ parity ask in gistory's mounts README). So vant is not just a member -
it is the **source** of the public/private/local idea govstruct's manifest and
railyard's registry both use. That makes the handshake a *reunion*, not a
negotiation: govstruct's `tier` field is vant's rig, named once.

### The lesson: an Agent OS is governable

A stranger running an agent OS hits this exact wall: N agents, N schemas, no
refusal. The general shape - **read the pack contract the OS already adopted,
meet at the adapter seam, add a drift detector, name the clause** - is why vant
is a case study and not a chore. It is the third proof (after a rename and a
factory move) that govstruct governs any family, including one that is itself an
OS.

---

## 16.9 Case study: vant stamps through railyard (agent-minted repos)

**The fourth proving case, and the one that connects vant to the composer.**
The owner wants vant agents to **stamp**: mint a repo from the forges and
register it, the way a human does at the railyard. This is the vant ↔ railyard
half of the family, and it is where govstruct's manifest stops being a read-only
roster and becomes the thing a machine **writes**.

### What a stamp is today (verified 2026-10-29)

monoforge's verb set is already the mechanism:

| monoforge verb | what it does |
|---|---|
| `monoforge new <dir>` | stamps template blocks + fills tokens (never the truth) |
| `monoforge doctor <dir>` | the truth battery - refuses `FORGE-TODO`, broken gates, dash law |
| `monoforge lock <dir>` | doctor must pass, then archive + checksum |
| `monoforge cut <family>` | release cuts from a living lib |

And railyard already composes monoforge + coreforge with the scope: **mint, cut,
create, update, push, track, download** (`labs/prd-railyard.md` §3). So a "stamp"
is `new` → `doctor` → `lock` → register in `mounts/state.json`, driven by
railyard.

### The gap: there is no agent face on the stamp

A vant agent can mint a *traveler* (a pointer artifact), but it cannot mint a
*repo*. The composer is human-driven. Closing that gap is the case study:

```
vant agent ──door verb──▶ railyard ──▶ monoforge new ──▶ coreforge rig
     ▲                         │              │
     │                         ▼              ▼
   reads roster          mounts/state.json   govstruct manifest
   (connector)           (the registry)      (the governance record)
```

The three pieces, each riding a seam that already exists:

1. **A railyard door verb** (`railyard_stamp` / `railyard_mint`) - railyard
   exposes its verbs over the same door pattern vant uses (typed refusals, honest
   absence). An agent calls it in-process; no socket is opened (§11's law).
2. **The vant connector** (§16.8) reads the *result*: the new member appears in
   the roster the brain already reads, so the agent sees what it minted.
3. **The govstruct manifest** records it: a stamp that mints a repo **adds a
   member row** (or the doctor refuses the orphan). This is the write path
   govstruct did not have.

### The law that makes it safe: a stamp is a claim, the doctor is the check

An agent minting a repo must not be able to lie about it. So the flow is:

1. **Mint** - railyard runs `monoforge new`; the tree is born with `FORGE-TODO`
   slots, which are **failures, not warnings** (monoforge's law).
2. **Doctor** - `monoforge doctor` refuses while any slot is unfilled. An agent
   cannot stamp a placeholder.
3. **Register** - on green, railyard writes the mount entry and govstruct's
   manifest gains the member row.
4. **Verify** - `govstruct doctor --suite` re-checks the new member like any
   other. **A stamp the suite refuses is not a member**, however green monoforge
   called it - two independent gates, the same "one truth per concern" law.

The honesty rule rides unchanged: a minted-but-unfilled repo is a **`status`**
(`In Development`), never a hidden row. The roster shows what exists, including
the half-born.

### Why this is the case that closes the ecosystem

Every other case study *reads* the manifest. This one **writes** it - and that is
the difference between a registry and a governance system. It also makes the
vant ↔ railyard relationship symmetric with the vant ↔ govstruct one:

| direction | who speaks | through |
|---|---|---|
| vant reads the family | vant → govstruct | the connector |
| govstruct reads a vant install | govstruct → vant | the adapter |
| vant mints a member | vant → railyard → monoforge | the door verb + the connector |
| the suite verifies the mint | govstruct → the new member | `doctor --suite` |

A vant agent that can read the family, mint into it, and have the suite verify
its work is an agent that is **governed**, not freeballing - which is the whole
point of §16.8. The OS and the composer become one loop.

### What railyard's PRD gains (updated as we go)

This case study forces railyard's stub PRD (`labs/prd-railyard.md`) to grow three
sections it does not have yet:

- **§5 the door**: the agent-facing verb family (the vant integration point).
- **§6 the stamp loop**: mint → doctor → lock → register, as one flow.
- **§7 the govstruct meeting**: railyard's `mounts/state.json` and govstruct's
  `apps.json` are the same roster from two sides (§3.3) - railyard is where the
  write lands, govstruct is where it is governed.

Railyard's `factory.json` and `mounts/state.json` are already machine-readable
(`scripts/check-railyard.cjs` validates both), so the door has something real to
write to. The rename in §16.5 (flowforge → coreforge) lands in that registry
first; this case study is what makes the registry a *target* rather than a list.

---

## 16.10 Case study: sanity running a fleet (the drift meter)

**The golden case - the one that is not a one-time event but an ongoing job.**
The four proving cases above are *events* (a rename, a move, a handshake, a
stamp). This one is the *steady state*: a living fleet that drifts unless
something holds it. The owner's words: the family uses a variety of themes, npm
versions, and a hodgepodge of CI everywhere; no patterns are enforced except by
hand. Coreforge (the rig) helps going forward, but it cannot fix the repos that
already exist, and it cannot stop them from drifting apart again. govstruct can.

### The fleet, measured (2026-10-29, live receipts)

Sampled every non-archived repo under `dhaupin` via the GitHub API plus the npm
registry. The drift is not a worry; it is a table:

| surface | what the fleet actually shows | the drift |
|---|---|---|
| **engines floors** | **23 of 35 repos declare no `engines.node` at all**; the 12 that do split across `>=20` (5), `>=18` (4), `>=18.0.0` (2), `>=18.17` (1) | four floors plus a null; the `>=18.17` patch floor is unexplained from outside (S1) |
| **arm adoption** | `packstruct` in 7 repos, `crashtest` in 7, `eyestruct` in 4, `poststruct` in **0** | four of five arms, unevenly; `poststruct` exists but no repo declares it |
| **pin style** | exact (`1.0.0`, `1.1.0`) in the tool repos, ranges (`^1.0.0`, `^1.1.0`) in creadev/eyestruct/vant | **two philosophies for the same pin**, in the same fleet |
| **CI shape** | 6 repos with **0** workflows, 18 with exactly **2**, 3 with 3, 3 with 4, 3 with 5, and **gistory with 22** | no enforced pattern; the range is 0 to 22 |
| **lockfiles** | 28 with `package-lock.json`, **7 with none** | a repo without a lock is a repo that can drift on install |
| **themes / rigs** | only 2 repos carry an `ssr.config.js`; the rest vary | the "fleet pattern" is aspirational, not measured |
| **published truth** | **every one of the six published tools is ahead of npm**: `packstruct` repo 1.1.0 vs npm 1.0.0, `crashtest` 1.2.0 vs 1.1.0, `eyestruct` 1.1.0 vs 1.0.0, `prestruct` 1.2.0 vs 1.1.0, `freestruct` 1.2.0 vs 1.1.0; `poststruct` repo 0.9.0 vs **404 on npm** | the served truth and the repo truth **disagree, fleet-wide** - exactly the class S4 governs, and the owner's "a couple repos have not pushed" is really **all of them** |

The 20-repo `creadev-*` component family is the sharpest example: all at `0.3.1`,
none with an engines floor, all with the same 2 workflows - **consistent by hand,
not by contract.** One hand-typed slip and the family diverges.

### Why coreforge cannot be the whole answer

Coreforge is the **rig**: it stamps a *new* repo with the pattern. That is
prevention, and it is the right tool for prevention. But:

- it does not reach the repos that already exist (35 of them);
- it does not detect when a repo **leaves** the pattern after the stamp (a hand
  edit, a dependency bump, a CI file deleted);
- it does not tell you **which** repos have drifted, or **how**, in one view.

Prevention and detection are different jobs. Coreforge prevents; **govstruct
meters.** The fleet needs both, and today only the prevention half exists.

### The sanity workflow (what the golden case looks like in practice)

The ongoing job, in four verbs:

1. **`govstruct doctor --suite`** over the fleet emits **one page**: every drift,
   by member, by surface. Not 35 CI runs to read - one roll-up. This is §5's
   registry surface, aimed at the operator.
2. **each drift is a refusal with a clause and a fix** - "`vant` floor `>=18`
   disagrees with its manifest row (S1); expected `>=20`." Nameable, not a
   shrug (§6).
3. **`govstruct migrate` (G6)** turns "35 repos need the floor bumped" into a
   **named, resumable migration** with a per-repo row: applied, pending, refused.
   The fleet-wide edit is a reviewed, resumable plan, not a scramble.
4. **the audit ledger (§19) records every step**, so "we tamed the fleet" is
   **provable**, not claimed. A stranger can verify the claim against the ledger.

The loop is the product: **meter the fleet, refuse the drift, migrate the fix,
record the receipt.** Coreforge births a repo correctly; govstruct keeps the
fleet correct, forever.

### The golden lesson

A one-time governance event (a rename) proves the tool *works*. An **ongoing**
governance job (a fleet that stays tamed) proves the tool is *worth running*. The
first four cases answer "can it?"; this one answers "why keep it?" - and the
answer is the measured table above, which is what happens to any fleet that has
only prevention and no meter.

---

## 16.11 Case study: many hands, one codebase (source-level consistency)

**The case the owner named: a variety of agents and platforms have built on
Creadev repos, so there is no consistency in testing, hygiene, style, naming,
namespaces, comments, or tone.** Every contributor (human or agent) brought their
own habits, and nothing at the source level enforces the family's. Coreforge
stamps a *new* repo with the pattern; it does not police the lines inside the 35
that exist.

### The ruling: this is section 11, not a fifth app

The honest worry is that source-level enforcement is a **fifth packs-based struct
app** - and the owner would rather it were not. The ruling is that **it is not an
app, because it invents no grammar.** Section 11 already settles the architecture:
a compliance rule *is* a packstruct SPEC v1 `check`-profile pack - a declarative,
pure-reading verifier over files on disk, armed by being enumerated in the host
config. That is exactly what a style check is.

So the whole substance of a hypothetical fifth app would be **a set of check
packs.** govstruct is already a `check`-profile host (§11, tier table). Shipping
those packs inside govstruct therefore adds a **pack**, not an **app**. A separate
`stylelint`-struct would duplicate the host - the manifest, the doctor, the
roll-up, the ledger - only to carry the same packs. That is the anti-pattern the
family already named: a second dialect for a first-class job.

The one-sentence test: **if the new thing needs its own manifest, its own doctor,
or its own roll-up, it is an app; if it only needs a new check, it is a pack.**
Source consistency needs a new check. It is a pack.

### What is mechanical, and what is not

Source consistency has two halves, and they have different owners. Getting this
split right is what keeps govstruct from claiming a voice it should not own:

| dimension | mechanical? | who checks it |
|---|---|---|
| testing (a test file exists, runs, covers the changed path) | yes | a `check` pack + crashtest for the adversarial shapes |
| hygiene (no debugger, no stray `console.log`, no committed secrets, no TODO debt above a threshold) | yes | a `check` pack |
| naming / namespaces (file names match ids, export names match the manifest, no cross-namespace imports) | yes | a `check` pack; reuses the id-equals-filename rule the loader already enforces |
| code style (tabs vs spaces, line length, import order, trailing whitespace) | yes | a `check` pack; the family's own prose laws are already machine-checked |
| comment **presence** (public exports are documented) | yes | a `check` pack |
| comment **tone** / voice / marketing copy | **no** | **poststruct** - its language pack owns voice (the interop law: govstruct never judges prose, it invokes poststruct's CLI) |

The last row is the boundary. govstruct enforces **structure** - is there a test,
is the name right, is the comment there. poststruct judges **voice** - is the
comment in the family's register. govstruct never reads a sentence for tone; it
calls the sibling that owns that leg. This is the same split as S5 (govstruct
checks the a11y *fact*, poststruct checks the *rendered* half).

### The two-tier model (the pattern the whole family already uses)

Source consistency is not a new mechanism; it is the suite's existing
author-time-vs-run-time split, aimed at source:

1. **Stamp time (prevention).** Coreforge stamps a new repo with the pattern, and
   the `check` packs run as part of the stamp gate. A repo is **born consistent.**
2. **Meter time (detection).** `govstruct doctor --suite --fleet` (G13) runs the
   same packs over the whole fleet and reports every repo that has **left** the
   pattern. A repo **stays consistent** only if something watches it.

The packs are the same at both tiers (§11's tier table). Prevention without
detection is a hope; detection without prevention is a nag. The family needs
both, and it already has both - the packs just need to exist.

### Why this is the golden case's other half

Section 16.10 metered the *manifest* surfaces (engines, pins, versions). This case
meters the *source* surfaces (tests, hygiene, style, naming). They are the same
job - **detect drift, refuse it nameably, migrate the fix, record the receipt** -
over two layers of the same fleet. A fleet can be manifest-consistent and
source-inconsistent at once, which is exactly the state the owner described.

### The anti-feature: govstruct does not own a style

The ruling has a hard edge. govstruct ships the **mechanism** to enforce a style
and the **family's** style as the reference packs. It does not declare its own
taste law. A fork points the packs at its own rules; the family's rules are data,
not doctrine. If govstruct ever hardcoded "tabs" or "no semicolons" into `src/`,
it would have become the fifth app it refused to be. **The packs are data; the
host is general.**

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
9. **~~The coreforge rename: `coreforge` or `rigforge`?~~** **Decided 2026-10-29:
`coreforge`**, at `coreforge.creadev.org` (§16.5). npm-free and repo-free.
10. **When does the rename ship?** Doing it by hand now (a `sed` across 4 repos,
    ~33 living files) is possible but proves nothing and risks missing the
    cross-repo literals; doing it through govstruct's doctor is the proof. Lean:
    after M1, so the rename is the tool's first real operation.
11. **The factory delegation: who cuts the first monoforge tar out of gistory?**
    §16.6 designs the migration but the first cut is an owner-driven step (gistory
    runs its ferry, railyard receives). Lean: the same session that lands the
    `home` field, so the double-claim window is hours, not weeks.
12. **Migrare: rebrand or keep?** Deferred - work is parked there, so govstruct
    keeps `migrare` as-is and marks it `Backburner` in the roster until the owner
    revives it. A parked member is a `status`, not a removal.
13. **~~vant: connector, adapter, or both?~~** **Decided 2026-10-29: both, shipped
    together.** This is a serious integration (one of vant's first outside what it
    built for itself), so the connector (*vant speaks govstruct*) and the adapter
    (*govstruct speaks vant*) land in the same pass (§16.8).
14. **~~ISO clause-naming in v1, or a later pack?~~** **Decided 2026-10-29: the
    `check` record carries a `clause` field from the start** (cheap), and the
    full ISO 9001/27001 mapping ships as a **profile pack**, not baked into the
    core (§16.8).

---

## 18. Gaps to close the ecosystem (resolved into the design)

The four case studies (§16.5-§16.9) prove the *core* works. This section was the
honest remainder: what the PRD did not answer. **Each gap is now folded into the
normative section it belongs to** - this section is the index and the rationale,
not a separate wish list. A gap is closed when its rule lives where a builder
will look for it, not when it is listed here.

| gap | resolved in | one line |
|---|---|---|
| **G1** write-path concurrency | §6.5 | a stamp opens a PR; CI is the serializer |
| **G2** naming authority | §6.2, §4 (`names.reserved`) | `govstruct names` checks npm + GitHub + roster |
| **G3** dependency graph | §6.3, §4 (`needs[]`) | topo-sort; refuse a cycle |
| **G4** verdict bus | §7.2 | members push a signed status receipt on green |
| **G5** credential delegation | §10 S6, §4 (`grants[]`) | a stamp runs under a scoped, single-use grant |
| **G6** migration ritual | §8, §6 (`migrate`) | `migrations/` + `govstruct migrate --dry-run` |
| **G7** revocation lifecycle | §6.6, §4 (`Tombstoned`) | a tombstone keeps aliases; never a 404 |
| **G8** a11y / i18n | §10 S5 | a fifth surface, checked by poststruct's leg |
| **G9** stranger onboarding | §16.4, §6 (`init`) | `govstruct init` + a worked example |
| **G10** shared refusal vocabulary | §6.4 | a namespaced refusal-code registry (data) |
| **G11** network posture | §6.1 | offline by default; online on `--network` |
| **G12** roll-up address + cache | §5.1 | versioned path + `ETag` + checksum |
| **G13** fleet drift meter | §16.10, §6 (`doctor --suite`) | meter the fleet, not just the manifest |
| **G14** audit ledger | §19 | one append-only, chained ledger of every action |
| **G15** source-level consistency | §16.11, §11 (S7 packs) | five check packs: tests, hygiene, naming, style, comment presence |

The rest of this section keeps each gap's original rationale, so the *why* is not
lost when the *where* moves.

### G1. The write path has no concurrency story (blocking §16.9)

§16.9 lets a machine write the manifest. Two agents stamping at once is a race:
the manifest is a committed file, and last-write-wins loses a member. **Lean:** a
stamp **opens a PR**, never commits to `main` - the same gate every human change
passes. CI is the serializer; the manifest is append-mostly, and a member row is
a small, mergeable unit. A lock is the fallback if the PR path proves too slow.

### G2. There is no naming authority (the rename proved it)

The rename (§16.5) was also a *collision fix*: `flowforge` was taken on npm. Today
nothing checks a name before it is admitted - the collision is found by hand,
late. **Lean:** a `govstruct names` verb that checks a candidate id against npm,
GitHub, and the roster (the doctor's "unique" rule, extended outward), and a
`names.reserved` block so a claim is recorded, not remembered.

### G3. No cross-member dependency graph

Members depend on members (govstruct → packstruct; coreforge → prestruct +
poststruct). The manifest carries **floors and pins** but no **edges**, so the
doctor cannot order its checks or detect a cycle. **Lean:** an optional `needs[]`
on the member block (id + floor); the doctor topo-sorts, refuses a cycle, and the
roll-up renders the graph. This is also how a bump propagates (§G6).

### G4. The verdict bus is missing (members do not tell the suite anything)

Today the suite **polls** every member at a pinned rev. A member that ships does
not notify anyone; the roll-up is only as fresh as the last cron. `family-status@1`
(§7.2) is per-member proof, not an aggregate signal. **Lean:** the doctor's
roll-up is the aggregate, and a member's CI **pushes a signed status receipt** on
green (the same ledger pattern, one level up). No new protocol - reuse the status
dialect, add a suite-level reader.

### G5. Credential delegation for a stamp is undefined

An agent minting a repo needs a GitHub token, an npm OIDC grant, a domain record.
§10 governs *env vars*; it does not govern **who may spend a credential**. This
is the scariest gap for an agent-minted world. **Lean:** a stamp runs under a
**scoped, single-use grant** (vant's escrow pattern - §16.8 - is the reference
implementation), logged to the same ledger as the mint. A stamp cannot widen a
wall.

### G6. No fleet migration ritual (the rename is one instance of a class)

§16.5 governs a *rename*; §16.6 a *factory move*. A **schema change** (SPEC v2, a
new required field) is the same class and has no playbook. **Lean:** a
`migrations/` convention + `govstruct migrate --status/--dry-run` (vant's own
migration shape, §16.8), so a spec bump ships with a named, resumable migration
instead of a scramble.

### G7. No lifecycle past `Archived` (revocation is unspecified)

`migrare` is `Backburner` (§4.1) - but what happens when a member is *retired*?
Its npm name, its domain, its rows, its inbound links? **Lean:** a lifecycle
`Live → Beta → In Development → Backburner → Archived → Tombstoned`, where a
tombstone **keeps the alias forwarding** (`aliases`, §4) and the doctor refuses a
row that points at nothing. A retired member resolves, never 404s - the same
honesty rule as a rename.

### G8. The surfaces have no accessibility or i18n contract

The menu/registry render on every member site, and poststruct audits `hreflang`.
But govstruct's **own** surfaces have no stated a11y floor (the pane is an
anchor, a button, a landmark) or i18n rule. **Lean:** a fifth compliance surface
(**S5 - a11y/i18n**) in §10, checked by poststruct's existing leg, so the mesh is
usable, not just present.

### G9. There is no onboarding path for a stranger (the OSS proof is a claim)

§16.7 says the repo is clean; §15 M4 says a second family proves it. Nothing says
**how** a stranger starts. **Lean:** `govstruct init` scaffolds a one-member
family in under a minute (the §0 test), plus a worked example under `examples/`.
The rule of three gates the *suite* claim; onboarding is what earns it.

### G10. The refusal vocabulary is not shared

The family's core law is "refusal instant and nameable" - but each tool names its
own codes (`E_CARRIER_*` in vant, `E_TRAVELER_*`, packstruct's loader errors).
A refusal that cannot be **recognized** by the next tool in the chain is not
portable. **Lean:** a shared refusal-code registry (namespaced by tool, the
pack-id pattern) so a doctor can say "member X refused with `E_...`" and a
consumer can act on it. This is the deepest gap - it is what makes the arms one
system instead of five tools that happen to share a repo.

### G11. The doctor's network posture is unstated

The doctor checks url resolvability (§4) - that needs a socket. crashtest's law
is **no sockets**. The two must not blur. **Lean:** split the doctor explicitly
into **offline** (manifest, pins, floors, checksums - the default, CI-safe) and
**online** (url resolvability, npm existence - opt-in, `--network`), so the
default run is deterministic and socket-free like every other arm.

### G12. The roll-up has no stable address or cache contract

`registry.json` is a build artifact. Consumers (creadev.org, vant's connector,
railyard) need a **stable URL + cache policy**, or every consumer re-derives it.
**Lean:** the roll-up is served at a versioned path with an `ETag`/max-age
contract, and `apps.json` is the canonical source it renders from - one artifact,
many readers, no divergent copies.

### G13. The fleet drifts and nothing meters it (the golden case)

§16.10 is the receipt: 23 of 35 repos declare no engines floor, four floors where
they do, `poststruct` declared by **no** repo, pin styles split two ways, CI
ranging from 0 to 22 workflows, 7 repos with no lockfile, and served versions that
disagree with the repos. Coreforge stamps the pattern into a *new* repo; nothing
watches the *existing* fleet or notices when a repo leaves the pattern. **Lean:**
the doctor grows a fleet mode - `govstruct doctor --suite --fleet` reads each
member's live surfaces (engines, pins, workflows, lockfile, published version) and
reports every drift as a typed refusal on one page. The meter is the product;
coreforge is prevention, govstruct is detection, and the fleet needs both.

### G14. Governance actions leave no auditable record

Every rule in this PRD - a refusal, a rename, a stamp, a grant spend, a migration
- produces an action, and today none of them is recorded in a way a stranger can
verify without trusting the operator. **Lean:** one append-only, content-addressed
**audit ledger** (§19), chained by hash, pointing at receipts the suite already
produces (locks, verdicts, stamp receipts, migration rows, grant spends). It
answers the four audit questions - what, who, on what evidence, within the rules -
and `govstruct audit verify` walks the chain offline. It is the concrete form of
"evidence, not certification" (§16.8) and the completion of "refusal instant and
nameable" (§19.6).

### G15. Many hands, one codebase, no source consistency

§16.11 is the receipt: a variety of agents and platforms have built on the repos,
so testing, hygiene, style, naming, namespaces, comments, and tone have no
enforced consistency. The owner's worry was that this is a fifth packs-based app.
**The ruling: it is a pack, not an app.** A compliance rule *is* a `check`-profile
pack (§11); source consistency needs five new checks, not a new host. **Lean:** an
S7 surface - five `check` packs (test-shapes, hygiene-shapes, naming-shapes,
style-shapes, comment-shapes) - run at stamp time (coreforge prevention) and at
meter time (`doctor --suite --fleet`, G13 detection). Tone is the one exception:
it is **poststruct's** (voice), never govstruct's (the interop law). The packs are
data; the host stays general.

### What the gaps say together

Three of them (G1, G5, G10) are the **agent-minted world** asking for governance:
concurrency, credentials, and a shared refusal language. Two (G2, G7) are the
**identity lifecycle**: claiming a name and retiring one. The rest are the
**furniture** of a real suite: a graph, a bus, migrations, a11y, onboarding, a
network split, a cache contract. None is speculative - each is a question the
case studies raised. **All fifteen are now folded into the design** (the index
above); what remains is to build them and prove each with a fixture.

### The build order the gaps imply

The gaps are not equal. Three gate the rest:

1. **G10 (refusal vocabulary)** first - every other rule refuses *through* it, so
   the shape must exist before the rules that use it.
2. **G3 (the graph)** second - the doctor cannot order its own checks without it,
   and §6.5's write path depends on knowing what a member needs.
3. **G1 + G5 (write path + grants)** third - they are the pair that makes §16.9
   safe, and neither is meaningful without the other.

The rest (G2, G4, G6, G7, G8, G9, G11, G12) are independent and can land in any
order once the three above hold. This ordering is the seed of the build plan
(§15) - baselines first, then the three gates, then the furniture.

---

## 19. Auditability: the ledger of record

**The question.** Every rule above - a refusal, a rename, a stamp, a grant spend,
a migration, a floor bump - must be **auditable**: a third party must be able to
verify *what happened, who authorized it, on what evidence, and whether it was
within the rules*, **without trusting the operator.** A governance system that
cannot be audited is just an opinion with good formatting.

**The proposal: one append-only, content-addressed ledger.** Every governance
action appends exactly one entry. Each entry is addressed by the sha256 of its
own body and **chains** to the previous entry's hash, so the ledger is
tamper-evident: you cannot rewrite or remove history without breaking the chain.
This is not a new mechanism - it is **vant's traveler pattern** (§16.8: a
content-derived address, an append-only ledger, a pin ledger, tamper-refuse,
`auditReport`) lifted from one subsystem to the whole suite. The family already
proved the shape and already maps ISO 9001 clause 8.5.2 onto it; govstruct makes
it the suite's record.

### 19.1 The entry shape

One JSON object per line (`labs/audit-ledger.jsonl`), append-only:

```
{
  "seq": 412,                         # monotonic; a gap is a refusal
  "prev": "sha256:9f2c...",           # the prior entry's address (the chain)
  "at": "2026-10-29T07:41:00Z",       # when
  "verb": "stamp",                    # what (the govstruct verb family, §6)
  "actor": { "kind": "agent",         # who: human | agent | ci
             "id": "vant/buffy-357",
             "grant": "grant:railyard_stamp/repo:govstruct-demo" },
  "subject": { "member": "vant", "rev": "c71b0d24" },   # what it acted on
  "evidence": [                        # the receipts it points at, never copies
    "lock:sha256:3b1a...",
    "verdict:doctor@suite/2026-10-29T07:40:58Z",
    "refusal:null"
  ],
  "clause": { "9001-7.5.3": "control of documented information" },
  "verdict": "PASS"                   # or a typed refusal code (§6.4)
}
```

### 19.2 What it composes (it does not duplicate)

The ledger is an **index with a chain**, not a second copy of anything. It points
at receipts the suite already produces:

| it records | the receipt it points at |
|---|---|
| a lock | `lock`'s sha256 archive receipt (§6) |
| a green member | the verdict-bus status receipt (§7.2) |
| a stamp | the railyard stamp receipt, including the spent grant (§16.9) |
| a migration step | the per-repo migration row (G6) |
| a grant spend | the escrow row (S6) |
| a rename / factory move | the frozen history refs (§16.5, §16.6) |

So there is **one** place to read "what has governance done," and the underlying
surfaces stay the members' own. This is the same "index, do not replace" law as
the pin ledger (S3).

### 19.3 Verification by a stranger

`govstruct audit verify` walks the chain from `seq: 1`:

- recompute each entry's sha256; a mismatch is a **tamper refusal**, naming the
  seq;
- check `prev` links form an unbroken chain; a gap is a **history refusal**;
- resolve every `evidence` reference; a dangling one is a **receipt refusal**;
- re-check each `grant` against the member's `grants[]` (S6); an unlisted spend is
  an **authority refusal**.

No secret, no operator trust, no network. A stranger with the repo can verify the
whole governance history offline - the same posture as the doctor (§6.1).

### 19.4 The four audit questions

The ledger answers, for any change, exactly the four questions an auditor asks:

| question | the field that answers it |
|---|---|
| **What** changed? | `verb` + `subject` |
| **Who** authorized it? | `actor` + `actor.grant` |
| **On what evidence?** | `evidence[]` (resolvable receipts) |
| **Within the rules?** | `verdict` (PASS or a typed refusal) + the `grant` check |

### 19.5 ISO: this is the documented-information control

The `clause` field makes the mapping explicit rather than implied:

- **ISO 9001:2015 clause 7.5** (control of documented information) - the ledger is
  the record: it is created, updated, controlled, retained, and its integrity is
  verified by the chain. The traveler already maps **8.5.2** (identification and
  traceability); the ledger generalizes it suite-wide.
- **ISO 27001 A.12.4** (logging and monitoring) - the ledger is the event log:
  who did what, when, under which authority, tamper-evident.

govstruct does not claim certification; it emits the **evidence a certification
audit would ask for**, and `audit verify` is how the auditor checks it. This is
the concrete form of §16.8's "evidence, not certification."

### 19.6 The ledger is the completion of the core law

The core law is "**manifest frozen, refusal instant and nameable**." Frozen means
there is a record of what the manifest was at every point (the chain). Nameable
means every refusal has a code (§6.4) and a row here. So the ledger is not an
add-on - it is the half of the law that makes the other half **provable**. A
refusal that leaves no record is a refusal nobody can audit; a manifest that
leaves no history is a manifest nobody can trust.

### 19.7 Where it lives

- `labs/audit-ledger.jsonl` - the chain, committed (git gives a first
  tamper-evidence layer; the hash chain adds the second).
- `horcrux/` - the periodic archive + checksum (monoforge's `lock` shape), so the
  ledger's own history is locked like any artifact.
- **per-repo, never global** - each repo carries its own ledger for the actions
  it took; the suite roll-up (§5) reads them into one view. This keeps the
  "`labs/` is per-repo, never governed" rule (§12.1) intact.
