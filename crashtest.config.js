// crashtest.config.js - govstruct's crashtest run root (dogfood).
//
// The component under attack is govstruct lint's OWN contract (SPEC section
// 6, PRD section 6): refusal instant and nameable, never a deep stack trace,
// never silent success. The transport is an in-process double that
// materializes one family root per request into a per-request temp dir and
// shells the CLI exactly the way a user and CI do
// (`node bin/cli.mjs lint <dir> --json`). Nothing in the repo is written
// during a run.
//
// Run:
//   npx crashtest run            (from the govstruct repo root)
//
// In CI the crashtest lane runs after `npm test`.
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));

// Hard-named CLI of the tool under test (the honest wire).
const CLI = join(REPO_ROOT, 'bin', 'cli.mjs');
const CLI_SPEC = ['lint', '--json'];

const CONFIG = JSON.stringify({
  schemaVersion: 1, family: { name: 'corpus' },
  members: { dir: 'members' }, compliance: { dir: 'compliance' },
});

function goodMember(id, over = {}) {
  return JSON.stringify({
    id, name: id, role: 'product', url: `https://${id}.example.com`,
    repo: null, npm: null, aliases: [], home: null, blurb: 'corpus member.',
    icon: id, order: 1, status: 'Live', section: 'open-source', needs: [], grants: [],
    ...over,
  });
}

// Every shape writes a family root; the member file name is the id unless a
// shape deliberately misaligns them.
function writeFamily(root, files) {
  mkdirSync(join(root, 'members'), { recursive: true });
  mkdirSync(join(root, 'compliance'), { recursive: true });
  writeFileSync(join(root, 'govstruct.config.json'), CONFIG);
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(root, 'members', name), body);
  }
}

// Hostile shapes: the lint MUST refuse each with a nameable code.
const HOSTILE = {
  'invalid-json': { 'a.json': '{ not valid json' },
  'id-mismatch': { 'a.json': goodMember('omega') },
  'id-duplicate': { 'a.json': goodMember('a'), 'b.json': goodMember('a') },
  'url-not-https': { 'a.json': goodMember('a', { url: 'http://a.example.com' }) },
  'url-duplicate': { 'a.json': goodMember('a'), 'b.json': goodMember('b', { url: 'https://a.example.com' }) },
  'order-collision': { 'a.json': goodMember('a'), 'b.json': goodMember('b') },
  'role-unknown': { 'a.json': goodMember('a', { role: 'widget' }) },
  'status-unknown': { 'a.json': goodMember('a', { status: 'Zombie' }) },
  'needs-cycle': {
    'a.json': goodMember('a', { needs: [{ id: 'b' }] }),
    'b.json': goodMember('b', { needs: [{ id: 'a' }] }),
  },
  'needs-self': { 'a.json': goodMember('a', { needs: [{ id: 'a' }] }) },
  'tombstone-empty': { 'a.json': goodMember('a', { status: 'Tombstoned', aliases: [] }) },
  'field-missing': { 'a.json': JSON.stringify({ id: 'a', name: 'A', role: 'product' }) },
  'wrongtypes': {
    'a.json': JSON.stringify({ id: 42, name: [], role: {}, url: 7, order: 'first', status: null, section: {} }),
  },
  'deep-nest': {
    'a.json': goodMember('a', { extra: (function deep(n) { return n ? [deep(n - 1)] : 'leaf'; })(256) }),
  },
  'huge-string': { 'a.json': goodMember('a', { blurb: 'y'.repeat(1024 * 512) }) },
  // G5: a stamp cannot widen a wall. An out-of-vocabulary grant kind, an
  // empty scope, or a duplicate grant is a refusal, not a warning.
  'grant-unknown-kind': { 'a.json': goodMember('a', { grants: [{ kind: 'telepathy', scope: '*' }] }) },
  'grant-scope-empty': { 'a.json': goodMember('a', { grants: [{ kind: 'npm', scope: '' }] }) },
  'grant-duplicate': {
    'a.json': goodMember('a', { grants: [{ kind: 'npm', scope: 'pkg:a' }, { kind: 'npm', scope: 'pkg:a' }] }),
  },
  // G7: the lifecycle is forward-only and status must agree with the last
  // transition. A backward step or a status that disagrees is a refusal.
  'history-backward': {
    'a.json': goodMember('a', {
      status: 'Beta',
      history: [{ status: 'Live', at: '2026-01-01T00:00:00Z' }, { status: 'Archived', at: '2026-02-01T00:00:00Z' }, { status: 'Beta', at: '2026-03-01T00:00:00Z' }],
    }),
  },
  'history-mismatch': {
    'a.json': goodMember('a', {
      status: 'Archived',
      history: [{ status: 'Live', at: '2026-01-01T00:00:00Z' }, { status: 'Beta', at: '2026-02-01T00:00:00Z' }],
    }),
  },
  'history-invalid': { 'a.json': goodMember('a', { status: 'Live', history: 'not-an-array' }) },
};

// Spec-ALLOWED shapes: the lint MUST NOT flag these (tolerance canary).
const TOLERANT = {
  'clean': { 'a.json': goodMember('a') },
  'null-url-repo': { 'a.json': goodMember('a', { url: null, repo: null }) },
  'extra-keys': { 'a.json': goodMember('a', { houseRule: 'advisory' }) },
  'alias-retired': { 'a.json': goodMember('a', { aliases: ['old-a'] }) },
  'grant-valid': {
    'a.json': goodMember('a', { grants: [{ kind: 'github', scope: 'repo:a/a' }, { kind: 'npm', scope: '*' }] }),
  },
  // G7: a forward-only history that agrees with status is spec-ALLOWED.
  'history-valid': {
    'a.json': goodMember('a', {
      status: 'Backburner',
      history: [
        { status: 'Live', at: '2026-01-01T00:00:00Z' },
        { status: 'Beta', at: '2026-02-01T00:00:00Z' },
        { status: 'In Development', at: '2026-03-01T00:00:00Z' },
        { status: 'Backburner', at: '2026-04-01T00:00:00Z' },
      ],
    }),
  },
};

async function lintOne(shape) {
  const root = mkdtempSync(join(tmpdir(), 'govstruct-ct-'));
  try {
    if (shape in HOSTILE) writeFamily(root, HOSTILE[shape]);
    else if (shape in TOLERANT) writeFamily(root, TOLERANT[shape]);
    else return { status: 404, body: JSON.stringify({ error: `unknown shape ${shape}` }) };

    // The CLI is run with cwd = the temp root (so '.' resolves to the family
    // root); the CLI path is resolved from the repo.
    const rec = spawnSync(process.execPath, [CLI, ...CLI_SPEC], { cwd: root, encoding: 'utf8', timeout: 30_000 });
    return {
      status: 200,
      body: JSON.stringify({ exit: rec.status ?? 2, stdout: rec.stdout ?? '', stderr: rec.stderr ?? '' }),
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function makeLintHandler() {
  return async ({ request }) => {
    let shape;
    try { shape = new URL(request.url).searchParams.get('shape'); } catch { shape = null; }
    if (!shape) return new Response(JSON.stringify({ error: 'shape param required' }), { status: 400 });
    const r = await lintOne(shape);
    return new Response(r.body, { status: r.status, headers: { 'content-type': 'application/json' } });
  };
}

// The verdict bus (G4): a member's CI pushes a receipt; the chain is
// tamper-evident offline. This route materializes a one-member family,
// emits one receipt through the CLI, optionally tampers with it, then runs
// `verdict verify` - the same wire a member's CI and a roll-up consumer use.
const RECEIPT = JSON.stringify({
  member: 'corpus', rev: 'deadbee', verdicts: [{ name: 'lint', verdict: 'REFUSED' }], refusals: [],
});

async function verdictOne(shape) {
  const root = mkdtempSync(join(tmpdir(), 'govstruct-ct-v-'));
  try {
    // init scaffolds the family (member id "hello"); rename to "corpus".
    const init = spawnSync(process.execPath, [CLI, 'init', root], { encoding: 'utf8', timeout: 30_000 });
    if (init.status !== 0) return { status: 200, body: JSON.stringify({ exit: 9, stdout: '', stderr: init.stderr ?? 'init failed' }) };
    const member = JSON.parse(readFileSync(join(root, 'members', 'hello.json'), 'utf8'));
    member.id = 'corpus';
    writeFileSync(join(root, 'members', 'corpus.json'), JSON.stringify(member));
    rmSync(join(root, 'members', 'hello.json'));

    writeFileSync(join(root, 'receipt.json'), RECEIPT);
    const emit = spawnSync(process.execPath, [CLI, 'verdict', 'emit', 'receipt.json'], { cwd: root, encoding: 'utf8', timeout: 30_000 });
    if (emit.status !== 0) return { status: 200, body: JSON.stringify({ exit: emit.status ?? 2, stdout: emit.stdout ?? '', stderr: emit.stderr ?? '' }) };

    if (shape === 'receipt-tamper-nested') {
      const p = join(root, 'labs', 'receipts.jsonl');
      const e = JSON.parse(readFileSync(p, 'utf8').trim());
      e.verdicts[0].verdict = 'EXPLOITED'; // rewrite a nested verdict row
      writeFileSync(p, JSON.stringify(e) + '\n');
    } else if (shape === 'receipt-seq-gap') {
      const p = join(root, 'labs', 'receipts.jsonl');
      writeFileSync(p, readFileSync(p, 'utf8') + readFileSync(p, 'utf8')); // duplicate -> seq gap
    }

    const rec = spawnSync(process.execPath, [CLI, 'verdict', 'verify'], { cwd: root, encoding: 'utf8', timeout: 30_000 });
    return { status: 200, body: JSON.stringify({ exit: rec.status ?? 2, stdout: rec.stdout ?? '', stderr: rec.stderr ?? '' }) };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function makeVerdictHandler() {
  return async ({ request }) => {
    let shape;
    try { shape = new URL(request.url).searchParams.get('shape'); } catch { shape = null; }
    if (!shape) return new Response(JSON.stringify({ error: 'shape param required' }), { status: 400 });
    const r = await verdictOne(shape);
    return new Response(r.body, { status: r.status, headers: { 'content-type': 'application/json' } });
  };
}

// The lifecycle (G7): a member is born, changed, and retired. This route
// materializes a one-member family, runs `retire` through the CLI, then
// lints the result and reads back the member block - the wire a retirement
// actually travels. A retired member must resolve (keep an alias), and a
// second retirement must refuse (terminal).
async function retireOne(shape) {
  const root = mkdtempSync(join(tmpdir(), 'govstruct-ct-r-'));
  try {
    const init = spawnSync(process.execPath, [CLI, 'init', root], { encoding: 'utf8', timeout: 30_000 });
    if (init.status !== 0) return { status: 200, body: JSON.stringify({ exit: 9, stdout: '', stderr: init.stderr ?? 'init failed' }) };

    const first = spawnSync(process.execPath, [CLI, 'retire', 'hello', '--json'], { cwd: root, encoding: 'utf8', timeout: 30_000 });
    let block = null;
    try { block = JSON.parse(readFileSync(join(root, 'members', 'hello.json'), 'utf8')); } catch { /* leave null */ }
    const lint = spawnSync(process.execPath, [CLI, 'lint'], { cwd: root, encoding: 'utf8', timeout: 30_000 });

    let second = null;
    if (shape === 'retire-twice') {
      second = spawnSync(process.execPath, [CLI, 'retire', 'hello', '--json'], { cwd: root, encoding: 'utf8', timeout: 30_000 });
    }
    if (shape === 'retire-unknown') {
      second = spawnSync(process.execPath, [CLI, 'retire', 'ghost', '--json'], { cwd: root, encoding: 'utf8', timeout: 30_000 });
    }

    return {
      status: 200,
      body: JSON.stringify({
        firstExit: first.status ?? 2,
        secondExit: second ? (second.status ?? 2) : null,
        secondOut: second ? (second.stdout ?? '') : '',
        lintExit: lint.status ?? 2,
        block,
      }),
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function makeRetireHandler() {
  return async ({ request }) => {
    let shape;
    try { shape = new URL(request.url).searchParams.get('shape'); } catch { shape = null; }
    if (!shape) return new Response(JSON.stringify({ error: 'shape param required' }), { status: 400 });
    const r = await retireOne(shape);
    return new Response(r.body, { status: r.status, headers: { 'content-type': 'application/json' } });
  };
}

// The a11y/i18n surface (S5, G8): the rendered pane must carry a named
// landmark, real anchors, a visible focus ring, and keyed chrome strings
// with an explicit locale fallback. This route materializes a family whose
// pane is a chosen shape, symlinks the repo's check packs into it, and runs
// `govstruct check --json` - the wire an adopter's CI consumes.
async function a11yOne(shape) {
  const root = mkdtempSync(join(tmpdir(), 'govstruct-ct-a11y-'));
  try {
    writeFamily(root, { 'a.json': goodMember('a') });
    mkdirSync(join(root, 'web', 'public'), { recursive: true });
    // The check host loads packs from the target root; point it at ours.
    try { symlinkSync(join(REPO_ROOT, 'packs'), join(root, 'packs'), 'dir'); } catch { /* best effort */ }

    let pane;
    if (shape === 'pane-clean') {
      const r = spawnSync(process.execPath, [CLI, 'render', 'partial'], { cwd: REPO_ROOT, encoding: 'utf8', timeout: 30_000 });
      pane = r.stdout ?? '';
    } else {
      pane = PANES[shape];
    }
    if (pane === undefined) return { status: 404, body: JSON.stringify({ error: `unknown shape ${shape}` }) };
    writeFileSync(join(root, 'web', 'public', 'apps-menu.html'), pane);

    const rec = spawnSync(process.execPath, [CLI, 'check', '--json'], { cwd: root, encoding: 'utf8', timeout: 30_000 });
    return { status: 200, body: JSON.stringify({ exit: rec.status ?? 2, stdout: rec.stdout ?? '', stderr: rec.stderr ?? '' }) };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// Hostile panes: each MUST refuse with its exact a11y/i18n code.
const PANES = {
  'pane-no-landmark': '<div class="apps-menu"><ul></ul></div>',
  'pane-fake-anchor': '<nav aria-label="Suite apps" data-i18n="apps.menu.label" data-i18n-default="en"><style>.x:focus-visible{outline:2px solid}</style><ul><li class="apps-menu__item" onclick="go()">x</li></ul></nav>',
  'pane-no-focus': '<nav aria-label="Suite apps" data-i18n="apps.menu.label" data-i18n-default="en"><ul></ul></nav>',
  'pane-unkeyed': '<nav aria-label="Suite apps"><style>.x:focus-visible{outline:2px solid}</style><ul></ul></nav>',
};

function makeA11yHandler() {
  return async ({ request }) => {
    let shape;
    try { shape = new URL(request.url).searchParams.get('shape'); } catch { shape = null; }
    if (!shape) return new Response(JSON.stringify({ error: 'shape param required' }), { status: 400 });
    const r = await a11yOne(shape);
    return new Response(r.body, { status: r.status, headers: { 'content-type': 'application/json' } });
  };
}

// The graph (G3): a bump on a member propagates to every dependent. This
// route materializes a three-member chain (leaf <- mid <- top) and runs
// `govstruct impact <id> --json` - the wire a maintainer's "who does this
// touch?" actually travels. An unknown id must refuse by name.
async function impactOne(shape) {
  const root = mkdtempSync(join(tmpdir(), 'govstruct-ct-i-'));
  try {
    writeFamily(root, {
      'leaf.json': goodMember('leaf', { order: 1 }),
      'mid.json': goodMember('mid', { order: 2, needs: [{ id: 'leaf' }] }),
      'top.json': goodMember('top', { order: 3, needs: [{ id: 'mid' }] }),
    });
    const id = shape === 'impact-unknown' ? 'ghost' : 'leaf';
    const rec = spawnSync(process.execPath, [CLI, 'impact', id, '--json'], { cwd: root, encoding: 'utf8', timeout: 30_000 });
    return { status: 200, body: JSON.stringify({ exit: rec.status ?? 2, stdout: rec.stdout ?? '', stderr: rec.stderr ?? '' }) };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function makeImpactHandler() {
  return async ({ request }) => {
    let shape;
    try { shape = new URL(request.url).searchParams.get('shape'); } catch { shape = null; }
    if (!shape) return new Response(JSON.stringify({ error: 'shape param required' }), { status: 400 });
    const r = await impactOne(shape);
    return new Response(r.body, { status: r.status, headers: { 'content-type': 'application/json' } });
  };
}

// The fleet meter (G13, PRD 16.10 - the golden case): an ongoing job, not a
// one-time event. This route materializes a two-member fleet with real
// checkout trees and runs `govstruct doctor --suite --fleet --fleet-root
// repos --json` - the one page an operator reads. A drifted member must be
// named by its exact refusal; a member with no checkout must be UNCHECKED,
// never a silent pass.
function fleetComp(id) {
  return JSON.stringify({
    id, floors: { consumer: '>=20', battery: '>=20' },
    version: { repo: '1.0.0' },
    pins: [{ kind: 'companion', name: 'packstruct', style: 'exact' }],
    env: [], clause: {},
  });
}

function writeRepo(base, id, pkg, { lock = false } = {}) {
  const dir = join(base, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
  if (lock) writeFileSync(join(dir, 'package-lock.json'), '{}');
}

async function fleetOne(shape) {
  const root = mkdtempSync(join(tmpdir(), 'govstruct-ct-fleet-'));
  try {
    writeFamily(root, { 'alpha.json': goodMember('alpha'), 'beta.json': goodMember('beta', { order: 2 }) });
    writeFileSync(join(root, 'compliance', 'alpha.json'), fleetComp('alpha'));
    writeFileSync(join(root, 'compliance', 'beta.json'), fleetComp('beta'));
    const base = join(root, 'repos');

    if (shape === 'fleet-clean') {
      writeRepo(base, 'alpha', { name: 'alpha', version: '1.0.0', engines: { node: '>=20' }, devDependencies: { packstruct: '1.1.0' } }, { lock: true });
      writeRepo(base, 'beta', { name: 'beta', version: '1.0.0', engines: { node: '>=20' }, devDependencies: { packstruct: '1.1.0' } }, { lock: true });
    } else if (shape === 'fleet-drift') {
      // beta: floor >=18, range pin, no lockfile, version 0.9.0.
      writeRepo(base, 'alpha', { name: 'alpha', version: '1.0.0', engines: { node: '>=20' }, devDependencies: { packstruct: '1.1.0' } }, { lock: true });
      writeRepo(base, 'beta', { name: 'beta', version: '0.9.0', engines: { node: '>=18' }, devDependencies: { packstruct: '^1.1.0' } });
    } else if (shape === 'fleet-unchecked') {
      // No repos/ tree at all: every member is unchecked, never a silent pass.
    } else {
      return { status: 404, body: JSON.stringify({ error: `unknown shape ${shape}` }) };
    }

    const rec = spawnSync(process.execPath, [CLI, 'doctor', '--suite', '--fleet', '--fleet-root', 'repos', '--json'], { cwd: root, encoding: 'utf8', timeout: 30_000 });
    return { status: 200, body: JSON.stringify({ exit: rec.status ?? 2, stdout: rec.stdout ?? '', stderr: rec.stderr ?? '' }) };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function makeFleetHandler() {
  return async ({ request }) => {
    let shape;
    try { shape = new URL(request.url).searchParams.get('shape'); } catch { shape = null; }
    if (!shape) return new Response(JSON.stringify({ error: 'shape param required' }), { status: 400 });
    const r = await fleetOne(shape);
    return new Response(r.body, { status: r.status, headers: { 'content-type': 'application/json' } });
  };
}

// The roll-up address + cache contract (G12, PRD 5.1): apps.json is the
// canonical source, registry.json is one rendering, and the versioned copy at
// its stable address carries an ETag that must match a fresh render. This
// route materializes a family, writes the roll-up, tampers with it per shape,
// and runs `govstruct doctor --json`. A roll-up that moved without a version
// bump - or whose ETag lies about the manifest it serves - must refuse.
async function rollupOne(shape) {
  const root = mkdtempSync(join(tmpdir(), 'govstruct-ct-rollup-'));
  try {
    writeFamily(root, { 'a.json': goodMember('a') });
    writeFileSync(join(root, 'compliance', 'a.json'), fleetComp('a'));
    const w = spawnSync(process.execPath, [CLI, 'registry', '--write'], { cwd: root, encoding: 'utf8', timeout: 30_000 });
    if (w.status !== 0) return { status: 500, body: JSON.stringify({ error: 'registry --write failed', stdout: w.stdout, stderr: w.stderr }) };

    if (shape === 'rollup-stale-etag') {
      const p = join(root, 'registry.v1.json');
      const doc = JSON.parse(readFileSync(p, 'utf8'));
      doc.address.etag = '"sha256:' + '0'.repeat(64) + '"';
      writeFileSync(p, JSON.stringify(doc, null, 2) + '\n');
    } else if (shape === 'rollup-divergent') {
      // The plain rendering moved without the manifest moving: a divergent copy.
      const p = join(root, 'registry.json');
      writeFileSync(p, readFileSync(p, 'utf8').replace('"memberCount": 1', '"memberCount": 2'));
    } else if (shape !== 'rollup-clean') {
      return { status: 404, body: JSON.stringify({ error: `unknown shape ${shape}` }) };
    }

    const rec = spawnSync(process.execPath, [CLI, 'doctor', '--json'], { cwd: root, encoding: 'utf8', timeout: 30_000 });
    return { status: 200, body: JSON.stringify({ exit: rec.status ?? 2, stdout: rec.stdout ?? '', stderr: rec.stderr ?? '' }) };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function makeRollupHandler() {
  return async ({ request }) => {
    let shape;
    try { shape = new URL(request.url).searchParams.get('shape'); } catch { shape = null; }
    if (!shape) return new Response(JSON.stringify({ error: 'shape param required' }), { status: 400 });
    const r = await rollupOne(shape);
    return new Response(r.body, { status: r.status, headers: { 'content-type': 'application/json' } });
  };
}

export default {
  baseUrl: 'https://govstruct.local',
  routes: { lint: makeLintHandler(), verdict: makeVerdictHandler(), retire: makeRetireHandler(), a11y: makeA11yHandler(), impact: makeImpactHandler(), fleet: makeFleetHandler(), rollup: makeRollupHandler() },
  // Adopt only OUR scenario pack: the packs/public tree also carries the
  // check-profile packs (floor-shapes and friends), which are govstruct's
  // compliance packs, not crashtest scenarios. Pointing at the one pack dir
  // keeps the two profiles from crossing.
  packs: [join(REPO_ROOT, 'packs', 'public', 'govstruct-manifest-shapes')],
  seed: 0xC0FFEE,
};
