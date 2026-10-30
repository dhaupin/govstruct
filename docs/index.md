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
