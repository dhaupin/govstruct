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
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
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

export default {
  baseUrl: 'https://govstruct.local',
  routes: { lint: makeLintHandler() },
  // Adopt only OUR scenario pack: the packs/public tree also carries the
  // check-profile packs (floor-shapes and friends), which are govstruct's
  // compliance packs, not crashtest scenarios. Pointing at the one pack dir
  // keeps the two profiles from crossing.
  packs: [join(REPO_ROOT, 'packs', 'public', 'govstruct-manifest-shapes')],
  seed: 0xC0FFEE,
};
