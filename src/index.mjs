// src/index.mjs - the govstruct library surface.
//
// The CLI is the primary interface; this module is the programmatic one, so
// a composer (railyard) or a member's CI can consume the same verdicts the
// CLI emits without shelling out.
export { loadConfig, DEFAULTS, CONFIG_NAME } from './config.mjs'
export {
  loadManifest, loadMemberBlocks, validateBlock, composeManifest, topoSort,
  ROLES, STATUSES, SECTIONS,
} from './manifest.mjs'
export { lint, formatRefusals } from './lint.mjs'
export { doctor, doctorSuite } from './doctor.mjs'
export { runChecks, loadCheckPacks } from './check.mjs'
export { suiteRegistry } from './registry.mjs'
export { lock, sha256File } from './lock.mjs'
export { names } from './names.mjs'
export { migrateStatus, migrateDryRun } from './migrate.mjs'
export { init } from './init.mjs'
export { stamp, validateStamp } from './stamp.mjs'
export { coversGrant, checkSpends } from './grants.mjs'
export { appendEntry, auditVerify, readLedger, entryAddress, LEDGER_PATH } from './audit.mjs'
export {
  SURFACES, renderReact, renderPartial, renderReadme, renderRegistry,
  manifestChecksum, publicMembers,
} from './render.mjs'
export { renderSurface, writeSurfaces, surfaceDrift } from './surfaces.mjs'
export { Refusal, RefusalBag, loadRegistry, isRegistered, meaningOf } from './refusals.mjs'
