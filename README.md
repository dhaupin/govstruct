# govstruct

**The controller layer for a family of repos.** One manifest of members, one
render surface per deployment shape, one doctor verb that verifies every adopter
serves the same truth.

The crosslink mesh — the apps menu, the README tables, the status registry —
stops being hand-typed N times and becomes governed data with teeth. The apps
menu is payload #1, not the product: governance over how members link, state,
and pin themselves is the product.

- **Zero dependencies.** Node ESM, exit codes 0/1/2.
- **General.** Nothing here knows your project's name. Point it at a directory of
  member blocks and a config; it governs your family.
- **Refusing, not warning.** A doctor that warns into green is politeness
  theater; govstruct refuses nameably at author time.
- **Statically emitted.** Surfaces are build-time artifacts, never runtime
  fetches — a bot reads a plain anchor.

```
govstruct lint              # manifest grammar
govstruct render <target>   # react | partial | readme | registry
govstruct doctor [--suite]  # adopter checksum gate, or suite-wide truth battery
govstruct check             # the compliance shape packs
govstruct registry          # the suite roll-up (env / pins / floors / versions)
govstruct lock              # archive + sha256 receipt
```

**Status:** pre-alpha. The design lives in [`labs/prd-govstruct.md`](./labs/prd-govstruct.md).

MIT.
