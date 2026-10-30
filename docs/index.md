---
permalink: /
layout: default
title: govstruct docs
description: The controller layer for a family of repos - one manifest of members, one render surface per shape, one doctor verb that verifies every adopter serves the same truth.
nav_order: 1
---

# govstruct docs

**The controller layer for a family of repos.** The crosslink mesh - the apps
menu, the README tables, the status registry - stops being hand-typed N times
and becomes governed data with teeth. The apps menu is payload #1, not the
product: governance over how members link, state, and pin themselves is the
product.

Every page here carries the four required frontmatter fields (`permalink`,
`layout`, `title`, `description`); the docs gates refuse a page that omits one.

## The core law

**Manifest frozen, refusal instant and nameable.** Every refusal carries a code
registered in `spec/refusals.json`; a code the vocabulary does not name is
itself refused. A doctor that warns into green is politeness theater - govstruct
refuses nameably at author time.

```bash
# the doctor is offline by default and byte-deterministic
npx govstruct doctor
# exit 0 honored, 1 any refusal, 2 usage - never a warning into green
```

## The doctor is the load-bearing half

The manifest is data; the doctor is the teeth. `govstruct doctor` reads the
member roster and verifies the suite truth against it:

- **Offline by default** - the default run never opens a socket. `--network`
  is its own mode and the only arm that does.
- **`--suite`** reports the suite-wide truth battery; **`--fleet`** reads each
  member's live surfaces against its compliance block; **`--adopters`** watches
  who consumes govstruct, and how.

## Adopters, pinned by mode

An adopter consumes the roll-up and pins govstruct so drift is caught. The gate
accepts two governed pin **modes**:

- **`npm`** (the default) - an exact `devDependency`, `govstruct@x.y.z`. The
  gate refuses a range (`E_ADOPTER_PIN_STYLE_DRIFT`) or a stale version
  (`E_ADOPTER_VERSION_DRIFT`).
- **`commit`** - a full 40-hex git sha in a `pinFile` (default
  `govstruct.lock`). This is the interim transport while govstruct is not
  npm-published: an integrator reads the roll-up from `raw.githubusercontent`
  at a pinned commit. An unknown mode refuses `E_ADOPTER_MODE_UNKNOWN`; an
  absent or short sha refuses `E_ADOPTER_SHA_INVALID`.

A declared adopter with no reachable checkout is **UNCHECKED** - a named state,
never a silent pass. The **rule of three** is the claim, not the gate: drift
refuses from the first adopter, but the *suite claim* waits for ≥2 verified
adopters.

## A declared-but-not-live resource is pending, never a phantom

A member may promise a resource (`repo`, `npm`, `url`) that is not live yet. The
member record carries a governed `pending` block (`{ resources, interim?, note? }`)
naming the state and the interim home. `doctor --network` skips a
declared-pending resource by name (counted, not failed), and the annotation
rides the roll-up so a consumer reads a named state instead of a phantom. A
pending flag on a resource the member does not declare, or one outside the
governed list, refuses `E_PENDING_UNKNOWN`; a malformed annotation refuses
`E_PENDING_INVALID`.

## Refusals, not warnings

Every gate above refuses drift by name rather than warning and passing. A
drifted pin, an unknown mode, an invalid sha, a pending flag on an undeclared
resource, or a broken surface promise is a `refusals[]` entry with a registered
code - a machine-readable verdict a consumer may act on, never a line it may
ignore.

## Highlighting works out of the box

```js
const member = 'packstruct'   // strings go green via the shared token block
if (member) { // keywords go accent
  console.log(`governed: ${member}`)
}
```

## The suite, rendered from the manifest

The apps menu on the landing site is not hand-typed: it is govstruct's own
`render react` surface over its own roster, so the product is its first adopter.
One manifest, one rendering per deployment shape, and a bot reads a plain anchor
in the served HTML.
