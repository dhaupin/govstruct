# PRD rider: govstruct - the ISO 9001 / ISO 27001 compliance frame

**Status:** rider v0.1, 2026-10-29 · Owner: dhaupin
**Companion:** `prd-govstruct.md` (sections 10 and 15), `spec/iso-profile.json`,
`docs/iso.md`. This rider is the family's **canonical frame**: the other five
riders (eyestruct, packstruct, crashtest, poststruct, prestruct) point at it.
**The one law:** an evidence map, not a certificate. It names which ISO
9001:2015 clauses and ISO 27001:2022 Annex A controls govstruct's own surfaces
can **evidence**, and the gate that proves each one.

---

## 0. Why govstruct carries the frame

govstruct is the family's **governor**: it holds the suite manifest, refuses a
drifted rendering, records every governance action in an append-only ledger, and
meters the live fleet. That is the whole of ISO 9001 clause 9 (performance
evaluation) and clause 10 (improvement) as a running tool, plus the 27001
technological controls a software suite can hold. The other members carry local
frames; govstruct carries the frame the family is audited under.

govstruct is also the purest form of clause 7.5 (documented information): the
profile itself is **data** (`spec/iso-profile.json`), versioned, machine-checked,
and printed on demand. The map is not prose that can rot; it is a file the
`iso-shapes` pack keeps honest on every `govstruct check`.

The frame rides the govstruct vocabulary (`clause` field on a member, the shared
`spec/refusals.json`, the append-only ledger) so a family install is auditable
as one unit, not six.

---

## 1. The clause map

This is the shipped profile, verbatim. `govstruct iso` prints it;
`govstruct iso --coverage` proves it is complete.

### ISO 9001:2015 - quality management

| clause | what it requires | the govstruct surface that evidences it | the gate |
|---|---|---|---|
| 4.4 | processes and their interactions | the manifest: members, roles, `needs[]` edges, topo-sorted order | `govstruct lint && govstruct render registry` |
| 5.3 | roles, responsibilities and authorities | member `role` + `grants[]` (the governed credential kinds) | `govstruct lint` |
| 6.1 | actions to address risks and opportunities | the refusal registry: every known failure mode has a named code and a resolution | `govstruct iso --coverage` |
| 7.5.2 | creating and updating documented information | `compliance/<id>.json` blocks + the rendered surfaces (`apps.json`, `registry.json`) | `govstruct render --write && govstruct doctor` |
| 7.5.3 | control of documented information | the lock receipt (`horcrux/` + sha256) and the append-only audit ledger | `govstruct lock && govstruct audit verify` |
| 8.4 | control of externally provided processes | the pin ledger: companion spec floors, engine pins, and action SHAs | `govstruct doctor --suite` |
| 8.5.1 | control of production and service provision | the doctor: author-time refusal of a drifted rendering | `govstruct doctor` |
| 8.5.2 | identification and traceability | the traveler: content-derived address, append-only ledger, pin ledger, tamper-refuse | `govstruct audit verify && govstruct verdict verify` |
| 8.5.6 | control of changes | the source-consistency check: a change is applied everywhere or refused | `govstruct check` |
| 8.6 | release of products and services | the verdict bus: a member's status receipt, chained and verifiable offline | `govstruct verdict rollup` |
| 8.7 | control of nonconforming outputs | the shared refusal registry (`spec/refusals.json`), typed codes | `govstruct check` |
| 9.1 | monitoring, measurement, analysis and evaluation | the fleet meter (`doctor --suite --fleet`): one drift page over the live fleet | `govstruct doctor --suite --fleet` |
| 9.2 | internal audit | the adopter gate: every declared adopter at a pinned rev | `govstruct doctor --adopters` |
| 10.2 | nonconformity and corrective action | each drift is a typed refusal with a clause and a fix (the profile's resolutions map) | `govstruct iso --resolve <code>` |
| 10.3 | continual improvement | the audit ledger: an append-only record that only grows, never rewrites | `govstruct audit verify` |

### ISO 27001:2022 - Annex A, the technological controls

| control | what it requires | the govstruct surface that evidences it | the gate |
|---|---|---|---|
| A.5.1 | policies for information security | `govstruct.config.json` + the manifest: policy as versioned data | `govstruct lint` |
| A.5.23 | information security for use of cloud services | the pin ledger: every external dependency recorded at an exact version | `govstruct doctor --suite` |
| A.5.36 | compliance with policies, rules and standards | the suite truth battery: every member checked against its declared block | `govstruct doctor --suite` |
| A.5.37 | documented operating procedures | the CLI verbs + the docs tree (generated from `site.config.js`) | `npm run lint:docs` |
| A.8.2 | privileged access rights | `grants[]`: who may spend which credential kind, scoped | `govstruct lint && govstruct doctor` |
| A.8.4 | access to source code | the manifest's `grants` + the write path (`stamp`) | `govstruct stamp` |
| A.8.9 | configuration management | `govstruct.config.json` is the single config source; the manifest is the single roster | `govstruct doctor` |
| A.8.15 | logging | `labs/audit-ledger.jsonl`: append-only, chained, tamper-evident | `govstruct audit verify` |
| A.8.20 | networks security | the url contract: every declared url is absolute https (the doctor refuses http) | `govstruct lint && govstruct doctor --network` |
| A.8.16 | monitoring activities | the fleet meter + the verdict rollup: the live suite read and reported | `govstruct doctor --fleet && govstruct verdict rollup` |
| A.8.24 | use of cryptography | content-addressed ledger entries (sha256 chain) and the lock receipt | `govstruct lock && govstruct audit verify` |
| A.8.25 | secure development life cycle | the milestone ladder (PRD section 15) + the per-member lifecycle history | `govstruct lint` |
| A.8.26 | application security requirements | the `compliance/<id>.json` block: floors, env contract, pins, versions | `govstruct check` |
| A.8.28 | secure coding | the `hygiene-shapes` and `comment-shapes` check packs (no secret, no stray log) | `govstruct check` |
| A.8.29 | security testing in development and acceptance | crashtest: the adversarial battery over real handlers, recorded in `labs/crashledger.json` | `npx crashtest run` |
| A.8.31 | separation of development, test and production | the tier rig (public/private/local) and the in-memory test backends | `npm test` |
| A.8.32 | change management | the doctor + the audit ledger: a change is a reviewable diff and a recorded action | `govstruct doctor && govstruct audit verify` |
| A.8.33 | test information | fixtures under `test/fixtures`: synthetic, committed, never real data | `npm test` |
| A.8.34 | protection of information systems during audit testing | the audit ledger is read-only evidence; audits never mutate the system | `govstruct audit verify` |

The profile holds 36 clauses (15 under ISO 9001, 21 under ISO 27001) and 90
resolutions. `govstruct iso --coverage` reports `0` unmapped and `0` dangling.

---

## 2. The evidence surfaces (what an auditor reads)

| artifact | path | what it proves |
|---|---|---|
| the profile | `spec/iso-profile.json` | the clause catalog and the resolutions (7.5.2) |
| the reader | `src/iso.mjs` | the map is data, printed and checkable (6.1) |
| the honesty pack | `packs/public/iso-shapes/` | the map cannot rot silently (8.5.6) |
| the ledger | `labs/audit-ledger.jsonl` | every governance action, chained (7.5.3, A.8.15) |
| the roll-up | `apps.json` + `registry.json` + `registry.v1.json` | the composed suite truth (7.5.2) |
| the fleet meter | `govstruct doctor --suite --fleet` | the live drift page (9.1) |
| the changelog | `CHANGELOG.md` | Keep-a-Changelog; every PR adds an Unreleased item (7.5.2) |
| the dogfood | `crashtest.config.js` + `packs/public/govstruct-manifest-shapes` | the contracts attacked in-process (A.8.29) |

---

## 3. Steps to stand the frame up

1. **Read the orientation.** `govstruct iso` prints the clause catalog. Nothing
   to install: the profile ships with the tool and is on by default. Evidence
   for 4.4, 7.5.2.
2. **Keep the map honest.** `govstruct check` runs the `iso-shapes` pack: a
   clause with no surface, a refusal with no resolution, or a member clause
   annotation that names a clause outside the catalog refuses by name. Evidence
   for 6.1, 8.5.6.
3. **Resolve a refusal.** `govstruct iso --resolve <code>` turns a refusal into
   an ISO statement: the clause it bears on and the action that clears it.
   Evidence for 8.7, 10.2.
4. **Meter the fleet.** `govstruct doctor --suite --fleet` reads every member's
   live surfaces against its compliance block and reports every drift on one
   page. Evidence for 9.1, A.5.36.
5. **Keep the ledger.** `govstruct audit verify` walks the append-only chain.
   The ledger is the retention evidence. Evidence for 7.5.3, 10.3, A.8.15.
6. **Gate the adopters.** `govstruct doctor --adopters` reads each declared
   adopter's `govstruct` pin against the version the suite serves. Evidence for
   9.2.
7. **Attach the local frames.** Each member ships its own rider
   (`prd-<member>-compliance.md`) that points here for the shared vocabulary.

---

## 4. What this frame does not claim

- **No certification.** The frame emits evidence; a certification body decides.
  govstruct certifies nothing.
- **No people or physical controls.** ISO 27001 Annex A themes 6 and 7 are
  named **out of scope** in the profile, never dropped silently. A software tool
  cannot evidence them.
- **No runtime enforcement.** govstruct is author-time and build-time. It does
  not sit in a request path.
- **No invented evidence.** Every clause maps to a surface that exists today or
  a milestone that will build it (PRD section 15). A clause with no surface is
  out of scope, not a promise.
- **No over-claim.** A check the spec does not promise is a bug in the check,
  never shipped. The profile is held to the same rule: the `iso-shapes` pack
  flags an in-scope clause with no gate as a refusal, so the map cannot claim
  coverage it has not earned.
