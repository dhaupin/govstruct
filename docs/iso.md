---
permalink: iso/
layout: default
title: ISO compliance
description: The govstruct ISO 9001 and 27001 evidence orientation - what each clause requires, which surface evidences it, which gate proves it, and what action clears each refusal code.
nav_order: 5
---

# ISO compliance

govstruct ships an ISO orientation: a drop-in map from the standards to the
surfaces and gates this suite already has. It answers two questions a company
(or a savvy hobbyist) asks before an audit.

- **What would an auditor ask for?** The clause catalog names, for each ISO
  9001:2015 clause and each ISO 27001:2022 Annex A control, the govstruct
  surface that can evidence it and the gate that proves it.
- **The suite refused. Now what?** Every refusal code maps to the clause it
  bears on and the action that clears it.

## The one law

This is an **evidence map, not a certificate**. govstruct certifies nothing. It
emits the records an auditor would ask for. A clause with no surface is named
**out of scope**, never faked. The people controls (Annex A theme 6) and the
physical controls (theme 7) are out of scope for a software tool, and the
profile says so rather than dropping them silently.

## The orientation

`govstruct iso` prints the clause catalog, grouped by standard and theme. Each
clause carries its requirement, its surface, and its gate.

```shell
govstruct iso                    # both standards
govstruct iso --standard 9001    # ISO 9001 only
govstruct iso --standard 27001   # ISO 27001 Annex A only
govstruct iso --json             # machine output
```

## The resolution

`govstruct iso --resolve <code>` turns a refusal into an ISO statement: the
clause it bears on, what that clause requires, and the action that clears it.

```shell
govstruct iso --resolve E_SUITE_DRIFT
```

```text
govstruct iso: E_SUITE_DRIFT
  clause:   9001-8.5.6 - Control of changes (9001)
  requires: review and authorize changes, and control them so the system stays conforming
  action:   a member disagrees with the suite truth; apply the change everywhere or refuse it
```

A run's refusals become one statement. Pass the codes inline or pipe them:

```shell
govstruct iso --statement E_SUITE_DRIFT,E_CHECKSUM_DRIFT
govstruct doctor --json | jq -r '.refusals[].code' | govstruct iso --statement
```

## The coverage gate

The orientation is only honest if it holds. `govstruct iso --coverage` checks
that every registered refusal code resolves to a catalogued clause with an
action. A gap exits non-zero. The `iso-shapes` check pack runs the same honesty
checks under `govstruct check`, so a clause with no surface, or a refusal with
no resolution, refuses by name in CI.

```shell
govstruct iso --coverage
govstruct check
```

## Standing it up

The profile ships with the tool and is on by default. Nothing to install:

1. `govstruct iso` - read the orientation.
2. `govstruct check` - the `iso-shapes` pack keeps the map honest.
3. `govstruct iso --resolve <code>` - when the suite refuses, read the action.
4. `govstruct audit verify` - the ledger is the retention evidence (clause
   7.5.3, control A.8.15).

A host may point `iso.profile` at its own file in `govstruct.config.json` to
add clauses or remap codes. Unset means the shipped profile is used.

## What it does not claim

- No certification. A certification body decides; govstruct emits evidence.
- No people or physical controls (ISO 27001 Annex A themes 6 and 7).
- No runtime enforcement. govstruct is author-time and build-time.
- No invented evidence. Every clause maps to a surface that exists or a
  milestone that will build it.
