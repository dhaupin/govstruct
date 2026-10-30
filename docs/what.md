---
permalink: what/
layout: default
title: What govstruct is
description: One zero-dependency CLI - the manifest grammar, the render surfaces, the doctor, and the boundary between what govstruct owns and what it defers to the family.
nav_order: 5
---

# What govstruct is

govstruct is a zero-dependency CLI. It reads a manifest of members and emits
every governed surface from it, then verifies each adopter serves the same
truth. Node ESM, exit codes 0/1/2.

## The verbs

The manifest is data; the doctor is the teeth.

```bash
# the manifest grammar
govstruct lint

# emit every governed surface from the roster
govstruct render apps | react | partial | readme | registry

# prove each adopter against the same truth
govstruct doctor [--suite] [--fleet] [--network]

# the suite roll-up: env / pins / floors / versions
govstruct registry
```

Plus the lifecycle verbs: `lock` (archive + sha256 receipt), `names` (check a
candidate id), `migrate` (spec or field migration), `init` (scaffold a
one-member family), `stamp`, `retire`, and `impact` (the propagation path).

## What it owns, what it defers

govstruct governs identity and conformance: who a member is, how it links and
states itself, and whether it serves the same truth as its siblings. It
composes the family's other arms rather than re-implementing them - the spec
is [packstruct](https://github.com/dhaupin/packstruct)'s `/packs`, the loader
is attacked by [crashtest](https://github.com/dhaupin/crashtest), the rendered
pane is watched by [eyestruct](https://github.com/dhaupin/eyestruct), and what
shipped is audited by [poststruct](https://github.com/dhaupin/poststruct).

Transport and dispatch are not govstruct's concern: a composer like
[railyard](https://github.com/dhaupin/railyard) governs where a member's bytes
come from. They meet at `repo` + `role`.

## Where it sits

Surfaces are build-time artifacts, never runtime fetches - a bot reads a plain
anchor in the served HTML. The landing site is govstruct's own first adopter:
the apps menu is rendered from the manifest by `govstruct render react`.

<div class="crosslinks">
<p><strong>Next:</strong>
<a href="{{ '/about/' | relative_url }}">about the project</a> ·
<a href="{{ site.site_url }}">the landing site</a></p>
</div>
