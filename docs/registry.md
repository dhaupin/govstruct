---
permalink: registry/
layout: default
title: The registry contract
description: Which fields of registry.v1.json are frozen contract and which are free-form, the address/cache/checksum seam an integrator pins, and the refusal vocabulary a surface consumer reads.
nav_order: 4
---

# The registry contract

`registry.v1.json` is the suite roll-up every outside consumer reads. This
page states what an integrator may pin and what stays free-form, so a lane can
consume govstruct's governed output and refuse nameably instead of guessing
(`dhaupin/govstruct#23`, the inferops filing).

## The shape contract

The payload carries a `schemaVersion` (currently `1`). The **address** is
versioned: the roll-up serves at `registry.v<schemaVersion>.json`
(`src/address.mjs`). A consumer pins the `schemaVersion` it knows; a payload
whose version the tool cannot render refuses `E_ADDRESS_VERSION_UNKNOWN` rather
than serving a shape nobody expected.

### Frozen contract fields

These are stable within `schemaVersion: 1`. A change to any of them is a
schema-version bump, not a silent edit.

| field | type | meaning |
| --- | --- | --- |
| `schemaVersion` | integer | the payload shape version; pin this |
| `address` | object | the versioned path, ETag, cache policy, and checksum (below) |
| `generated` | object | `{ by, surface, manifest }` - the producer, the surface name, and the manifest checksum the copy proves |
| `family` | string | the family id |
| `memberCount` | integer | the number of members in the roster |
| `order` | string[] | member ids in roster order |
| `members` | object[] | the member projections (below) |
| `graph` | object[] | `{ id, needs, neededBy }` per member - the dependency edges |
| `byRole` / `byStatus` | object | count maps keyed by role / status |

Each `members[]` entry carries the **frozen projection**:

| key | type | notes |
| --- | --- | --- |
| `id` | string | kebab-case, unique |
| `name` | string | display name |
| `role` | string | one of the governed role vocabulary |
| `url` | string \| null | the live surface, or `null` |
| `blurb` | string | the one-line description |
| `status` | string | the lifecycle status |
| `npm` | string | **present only when declared** |
| `repo` | string | **present only when declared** |

`npm` and `repo` are conditional: a consumer must treat their **absence** as
"not declared", never as an error. Every other key is always present.

### Free-form fields

Anything not named above is **not** contract. A consumer must not depend on
keys the table omits; the producer may add fields in a minor release without a
schema bump. The rule for a consumer is: read only the frozen fields, ignore
the rest.

## The address seam (what a lane pins)

`address` is the caching and proof contract (`src/address.mjs`, PRD 5.1/G12):

| key | meaning |
| --- | --- |
| `schemaVersion` | the version the address renders |
| `path` / `url` | the versioned location (`registry.v1.json`) |
| `etag` | a strong ETag keyed on the manifest checksum - revalidate cheaply |
| `maxAge` / `cacheControl` | the cache policy (`public, max-age=300, must-revalidate`) |
| `checksum` | the manifest checksum the copy proves against |

An integrator pins the **commit** and the **`schemaVersion`**, then proves the
copy with the checksum. The ETag is keyed on the manifest checksum, not the
rendered bytes, so the roll-up is a pure function of the manifest and an etag
inside the body is never self-referential.

## The refusal vocabulary

govstruct refuses to emit a code it has not registered. The registry lives at
[`spec/refusals.json`](https://github.com/dhaupin/govstruct/blob/main/spec/refusals.json),
namespaced by tool. The codes a surface consumer most needs to read:

| code | meaning |
| --- | --- |
| `E_ADDRESS_VERSION_UNKNOWN` | the roll-up addresses a `schemaVersion` the tool cannot render |
| `E_NPM_MISSING` | a member declares an npm name absent from the registry (online mode only) |
| `E_URL_UNRESOLVABLE` / `E_URL_INSECURE` | a member's declared url does not resolve, or resolves over http but not https |
| `E_ID_*`, `E_FIELD_*`, `E_NEEDS_*` | manifest grammar refusals (duplicate id, missing field, dangling/cyclic dependency) |

## Record hygiene

A member record may declare a `repo` or `npm` that does not exist yet. The
offline doctor does not probe the network by default; `govstruct doctor
--network` is the explicit ask that surfaces a phantom record by name (the
`E_NPM_MISSING` / `E_URL_UNRESOLVABLE` rows above). An integrator whose lane
depends on a member's `repo` or `npm` should run the online doctor, or pin the
member's declared values and refuse on drift in its own lane.

## The live surface

The roll-up serves over the suite's own surface. Where a member's declared
`url` does not resolve from a given network (a sandbox, a pre-DNS state), the
pinned-commit read over `raw.githubusercontent.com` is the interim transport -
the payload is a pure function of the manifest, so a pinned read is
byte-identical to the served one.
