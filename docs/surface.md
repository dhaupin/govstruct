---
permalink: surface/
layout: default
title: Surface contract
description: The govstruct surface stability contract - which fields of the roll-up a consumer may rely on, at what type, and how a broken promise refuses by name.
nav_order: 4
---

# Surface contract

govstruct emits a roll-up (`registry.v1.json`) that consumers read: creadev.org's
forge lane, vant's connector, railyard. Without a stated contract, an integrator
guesses which fields are safe to bind to, and a schema change breaks them
generically. The surface stability contract says, in data, which fields of each
emitted surface a consumer may rely on, and at what type.

## The law

The contract is a promise, and it must stay true. A field marked **promised** is
stable: its type is fixed, and removing or retyping it is a breaking change that
needs a `schemaVersion` bump. A field marked **optional** may be absent (a
conditional spread), but when present it carries the stated type. A field marked
**free-form** may change without notice, and a consumer must not depend on it.

When a promised field is dropped or retyped, the tool refuses by name:
`E_SURFACE_FIELD_MISSING` or `E_SURFACE_TYPE_DRIFT`. An integrator pins a
`schemaVersion` and upgrades consciously, rather than guessing and breaking
generically.

## Reading the contract

`govstruct surface` prints the contract, grouped by surface.

```shell
govstruct surface                  # every surface
govstruct surface --surface member # one surface
govstruct surface --json           # machine output
```

Each surface names a `schemaVersion` and a field map. The `member` surface is
the full member record an integrator binds to; `registry-member` is the narrower
summary projection that rides `registry.members[]`.

## Verifying the emitted surfaces

`govstruct surface --verify` checks the surfaces on disk against the contract. A
promised field that is absent, or carries the wrong type, exits non-zero.

```shell
govstruct surface --verify
```

The `surface-shapes` check pack runs the same honesty checks under
`govstruct check`, and the doctor folds it in as the `surface-contract` check, so
a broken promise refuses by name in CI.

```shell
govstruct check
govstruct doctor
```

## What it does not claim

- No behavioral contract. The contract fixes field names and types, not what a
  field means or how it changes.
- No free-form guarantee. A free-form field (for example `compliance`) is owned
  by its own contract; this surface promises nothing about it.
- No silent version bump. Removing or retyping a promised field without a
  `schemaVersion` bump is exactly what the verify refuses.
