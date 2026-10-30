// packs/public/govstruct-manifest-shapes/index.js - the govstruct lint lane.
//
// The real component under attack: govstruct lint's contract (PRD section 6)
// - "refusal instant and nameable... never a deep stack trace, never silent
// success." The transport is an in-process double (crashtest.config.js) that
// materializes one hostile family root per request into a temp dir and runs
// `node bin/cli.mjs lint --json` as a subprocess - the same wire a user and
// CI consume.
//
// Cross-repo pack doctrine (packstruct-lint-shapes precedent): NO imports
// from crashtest internals. Plain verdict records, honest skips - a shape
// the run root cannot support is a REFUSED posture note, never a fake
// verdict.
//
// Four attacks, one contract each:
//
//   hostile-manifest-fuzz     every malformed member block answers
//                             in-bounds: JSON verdict body, refusals[] with
//                             {code,message}, exit 0 or 1 - never 5xx, never
//                             a throw, never a deep stack trace.
//   refusal-codes-registered  every refusal code the lint emits is a
//                             registered code (the G10 vocabulary) - a
//                             refusal the next tool cannot read is not
//                             portable.
//   over-strict-drift-canary  spec-ALLOWED shapes (null url/repo, extra
//                             keys, retired aliases) exit 0 with zero
//                             refusals - a lint that flags minimum-spec
//                             shapes is itself a regression.
//   clean-family-canary       the conforming family exits 0 with an empty
//                             refusals list - the happy wire holds.
const DEFAULT_ROUTE = 'lint';

const REGISTERED = /^(E_[A-Z0-9_]+|[a-z][a-z0-9-]*)$/;

const exhausted = (detail, extra = {}) => ({ verdict: 'EXPLOITED', detail, ...extra });
const refused = (detail, extra = {}) => ({ verdict: 'REFUSED', detail, ...extra });

function routeOf(ctx) { return (ctx && ctx.route) || DEFAULT_ROUTE; }

async function runLint(harness, route, shape) {
  const rec = await harness.run(route, { method: 'GET', url: `/lint?shape=${shape}` });
  if (rec.threw) return { threw: true, error: rec.error };
  let body = '';
  try { body = await rec.response.text(); } catch { /* empty */ }
  return { threw: false, status: rec.status, body };
}

function parseVerdict(body) {
  try {
    const r = JSON.parse(body);          // {exit, stdout, stderr}
    const out = JSON.parse(r.stdout);    // {schema, ok, refusals}
    if (!Array.isArray(out.refusals)) return null;
    return { exit: r.exit, stderr: r.stderr ?? '', refusals: out.refusals };
  } catch { return null; }
}

const isNameable = (v) => v && typeof v.code === 'string' && v.code.length > 0 &&
  typeof v.message === 'string' && v.message.length > 0;

const STACK_MARKERS = /(^|\n)\s*at .*\(|^\s*ReferenceError|^\s*TypeError|Uncaught/;

export default {
  name: 'govstruct-manifest-shapes',
  description: 'hostile-manifest wire truths for govstruct lint: in-bounds refusals under malformed member blocks (never crash, never silent success), registered refusal codes, minimum-spec tolerance (zero dependencies, zero sockets)',

  attacks: [
    {
      name: 'hostile-manifest-fuzz',
      description: 'every malformed family answers in-bounds: parseable verdict JSON, refusals carried with {code,message}, exit 0/1 - never 5xx, never a deep stack trace',
      async run(harness, ctx = {}) {
        const route = routeOf(ctx);
        const shapes = [
          'invalid-json', 'id-mismatch', 'id-duplicate', 'url-not-https',
          'url-duplicate', 'order-collision', 'role-unknown', 'status-unknown',
          'needs-cycle', 'needs-self', 'tombstone-empty', 'field-missing',
          'wrongtypes', 'grant-unknown-kind', 'grant-scope-empty', 'grant-duplicate',
          'history-backward', 'history-mismatch', 'history-invalid',
        ];
        const crashes = [];
        const bad = [];
        for (const shape of shapes) {
          const r = await runLint(harness, route, shape);
          if (r.threw) { crashes.push(`${shape}: harness throw`); continue; }
          if (r.status >= 500) { crashes.push(`${shape}: status ${r.status}`); continue; }
          const v = parseVerdict(r.body);
          if (!v) { crashes.push(`${shape}: body is not a parseable JSON verdict`); continue; }
          if (v.exit !== 0 && v.exit !== 1) crashes.push(`${shape}: exit ${v.exit}`);
          if (v.stderr && STACK_MARKERS.test(v.stderr)) crashes.push(`${shape}: deep stack trace in stderr`);
          if (v.refusals.length === 0) bad.push(`${shape}: refused shape produced zero refusals`);
          if (!v.refusals.every(isNameable)) bad.push(`${shape}: a refusal is not nameable`);
        }
        const fails = [...crashes, ...bad];
        if (fails.length) return exhausted(`lint contract broken under hostile family corpus: ${fails.join(' | ')}`);
        return refused(`${shapes.length} hostile family shapes held: in-bounds verdicts, nameable refusals, no crash, no deep stack (PRD section 6)`, { shapes: shapes.length });
      },
    },

    {
      name: 'oversize-in-bounds',
      description: 'a deep-nested extra key and a half-megabyte string are spec-ALLOWED: the lint must answer in-bounds (exit 0/1, parseable verdict) without crashing',
      async run(harness, ctx = {}) {
        const route = routeOf(ctx);
        const fails = [];
        for (const shape of ['deep-nest', 'huge-string']) {
          const r = await runLint(harness, route, shape);
          if (r.threw) { fails.push(`${shape}: harness throw`); continue; }
          if (r.status >= 500) { fails.push(`${shape}: status ${r.status}`); continue; }
          const v = parseVerdict(r.body);
          if (!v) { fails.push(`${shape}: unparseable verdict`); continue; }
          if (v.exit !== 0 && v.exit !== 1) fails.push(`${shape}: exit ${v.exit}`);
          if (v.stderr && STACK_MARKERS.test(v.stderr)) fails.push(`${shape}: deep stack trace`);
        }
        if (fails.length) return exhausted(`oversize shapes broke the lint: ${fails.join(' | ')}`);
        return refused('oversize but spec-allowed shapes (deep extra nesting, half-megabyte string) answered in-bounds');
      },
    },

    {
      name: 'refusal-codes-registered',
      description: 'every refusal code the lint emits is a registered code (the shared vocabulary, G10)',
      async run(harness, ctx = {}) {
        const route = routeOf(ctx);
        const unregistered = [];
        const shapes = ['id-mismatch', 'url-not-https', 'needs-cycle', 'field-missing', 'wrongtypes'];
        for (const shape of shapes) {
          const r = await runLint(harness, route, shape);
          if (r.threw) continue;
          const v = parseVerdict(r.body);
          if (!v) continue;
          for (const ref of v.refusals) {
            if (!REGISTERED.test(ref.code)) unregistered.push(`${shape}: unregistered code "${ref.code}"`);
          }
        }
        if (unregistered.length) return exhausted(`unregistered refusal codes: ${unregistered.join(' | ')}`);
        return refused('every emitted refusal code is registered (the G10 vocabulary holds)');
      },
    },

    {
      name: 'over-strict-drift-canary',
      description: 'spec-ALLOWED shapes (null url/repo, extra keys, retired aliases) exit 0 with zero refusals - over-strict linting of minimum-spec shapes is a lint-side regression',
      async run(harness, ctx = {}) {
        const route = routeOf(ctx);
        const overStrict = [];
        for (const shape of ['clean', 'null-url-repo', 'extra-keys', 'alias-retired', 'grant-valid', 'history-valid']) {
          const r = await runLint(harness, route, shape);
          if (r.threw) { overStrict.push(`${shape}: harness throw`); continue; }
          const v = parseVerdict(r.body);
          if (!v) { overStrict.push(`${shape}: unparseable verdict`); continue; }
          if (v.exit !== 0 || v.refusals.length > 0) {
            overStrict.push(`${shape}: exit ${v.exit}, ${v.refusals.length} refusal(s)`);
          }
        }
        if (overStrict.length) return exhausted(`spec tolerance broken: ${overStrict.join(' | ')}`);
        return refused('minimum-spec shapes held: null url/repo, extra keys, retired aliases, and valid grants all exit 0, zero refusals');
      },
    },

    {
      name: 'grant-wall-refuses',
      description: 'the credential wall (G5): an out-of-vocabulary grant kind, an empty scope, and a duplicate grant each refuse with their exact code - a stamp cannot widen a wall',
      async run(harness, ctx = {}) {
        const route = routeOf(ctx);
        const expect = {
          'grant-unknown-kind': 'E_GRANT_UNKNOWN_KIND',
          'grant-scope-empty': 'E_GRANT_SCOPE_EMPTY',
          'grant-duplicate': 'E_GRANT_DUPLICATE',
        };
        const fails = [];
        for (const [shape, code] of Object.entries(expect)) {
          const r = await runLint(harness, route, shape);
          if (r.threw) { fails.push(`${shape}: harness throw`); continue; }
          const v = parseVerdict(r.body);
          if (!v) { fails.push(`${shape}: unparseable verdict`); continue; }
          if (v.exit !== 1) fails.push(`${shape}: exit ${v.exit} (expected 1)`);
          const codes = v.refusals.map((x) => x.code);
          if (!codes.includes(code)) fails.push(`${shape}: expected ${code}, got [${codes.join(', ')}]`);
        }
        if (fails.length) return exhausted(`the credential wall leaked: ${fails.join(' | ')}`);
        return refused('the credential wall holds: unknown kind, empty scope, and duplicate grant each refuse by name (G5)');
      },
    },

    {
      name: 'verdict-chain-tamper-refuses',
      description: 'the verdict bus (G4): a fresh receipt verifies green, but a rewritten NESTED verdict row and a seq gap each break the chain - tamper-evidence is real, not shallow',
      async run(harness, ctx = {}) {
        const runVerdict = async (shape) => {
          const rec = await harness.run('verdict', { method: 'GET', url: `/verdict?shape=${shape}` });
          if (rec.threw) return { threw: true, error: rec.error };
          let body = '';
          try { body = await rec.response.text(); } catch { /* empty */ }
          return { threw: false, status: rec.status, body };
        };
        const parse = (body) => {
          try { const r = JSON.parse(body); return { exit: r.exit, stderr: r.stderr ?? '', stdout: r.stdout ?? '' }; } catch { return null; }
        };

        // A fresh receipt verifies green (exit 0).
        const ok = await runVerdict('receipt-fresh');
        if (ok.threw) return exhausted('verdict route crashed');
        const okv = parse(ok.body);
        if (!okv) return exhausted('verdict fresh: unparseable verdict body');
        if (okv.exit !== 0) return exhausted(`verdict fresh: exit ${okv.exit} - a clean chain was refused`);

        // A nested-field rewrite and a seq gap must both refuse (exit 1).
        const fails = [];
        for (const [shape, marker] of [['receipt-tamper-nested', 'E_RECEIPT_TAMPER'], ['receipt-seq-gap', 'E_RECEIPT_CHAIN']]) {
          const r = await runVerdict(shape);
          if (r.threw) { fails.push(`${shape}: harness throw`); continue; }
          const v = parse(r.body);
          if (!v) { fails.push(`${shape}: unparseable verdict body`); continue; }
          if (v.exit !== 1) { fails.push(`${shape}: exit ${v.exit} (expected 1 - the chain must refuse)`); continue; }
          if (!v.stdout.includes(marker)) fails.push(`${shape}: expected ${marker} in output, got ${JSON.stringify(v.stdout.slice(0, 120))}`);
        }
        if (fails.length) return exhausted(`the verdict chain is not tamper-evident: ${fails.join(' | ')}`);
        return refused('a fresh receipt verifies green; a nested verdict rewrite (E_RECEIPT_TAMPER) and a seq gap (E_RECEIPT_CHAIN) each break the chain by name (G4)');
      },
    },

    {
      name: 'lifecycle-retire-resolves',
      description: 'the lifecycle (G7): retiring a member tombstones it, keeps an alias so old links resolve (never a 404), lints green; a second retire and an unknown retire each refuse by name (retirement is terminal)',
      async run(harness, ctx = {}) {
        const route = routeOf(ctx);
        const runRetire = async (shape) => {
          const rec = await harness.run('retire', { method: 'GET', url: `/retire?shape=${shape}` });
          if (rec.threw) return { threw: true };
          let body = '';
          try { body = await rec.response.text(); } catch { /* empty */ }
          try { return { threw: false, ...JSON.parse(body) }; } catch { return { threw: false, parse: false }; }
        };
        const fails = [];

        const r = await runRetire('retire-plain');
        if (r.threw || r.parse === false) return exhausted('retire route crashed or returned an unparseable body');
        if (r.firstExit !== 0) fails.push(`retire: exit ${r.firstExit} (expected 0)`);
        if (!r.block) fails.push('retire: member file could not be read back');
        else {
          if (r.block.status !== 'Tombstoned') fails.push(`retire: status is ${r.block.status}, expected Tombstoned`);
          if (r.block.id !== 'hello') fails.push('retire: the row lost its id - an old link would 404');
          const hist = Array.isArray(r.block.history) ? r.block.history : [];
          if (!hist.length || hist.at(-1).status !== 'Tombstoned') fails.push('retire: history does not record the Tombstoned transition');
        }
        if (r.lintExit !== 0) fails.push(`retire: a tombstoned member failed lint (exit ${r.lintExit}) - it must resolve, never 404`);

        const twice = await runRetire('retire-twice');
        if (twice.threw || twice.parse === false) fails.push('retire-twice: unparseable body');
        else {
          if (twice.secondExit !== 1) fails.push(`retire-twice: exit ${twice.secondExit} (expected 1 - terminal)`);
          if (!String(twice.secondOut).includes('E_RETIRE_ALREADY_TOMBSTONED')) fails.push('retire-twice: expected E_RETIRE_ALREADY_TOMBSTONED');
        }

        const unknown = await runRetire('retire-unknown');
        if (unknown.threw || unknown.parse === false) fails.push('retire-unknown: unparseable body');
        else {
          if (unknown.secondExit !== 1) fails.push(`retire-unknown: exit ${unknown.secondExit} (expected 1)`);
          if (!String(unknown.secondOut).includes('E_RETIRE_UNKNOWN_MEMBER')) fails.push('retire-unknown: expected E_RETIRE_UNKNOWN_MEMBER');
        }

        if (fails.length) return exhausted(`the lifecycle leaked: ${fails.join(' | ')}`);
        return refused('retirement tombstones and keeps a forwarding alias (lint green), a second retire refuses E_RETIRE_ALREADY_TOMBSTONED, and an unknown member refuses E_RETIRE_UNKNOWN_MEMBER (G7)');
      },
    },

    {
      name: 'a11y-pane-refuses',
      description: 'the a11y/i18n surface (S5, G8): the emitted pane is clean, but a pane with no landmark, a click-handler row, no focus ring, and unkeyed chrome each refuses by name',
      async run(harness, ctx = {}) {
        const runCheck = async (shape) => {
          const rec = await harness.run('a11y', { method: 'GET', url: `/a11y?shape=${shape}` });
          if (rec.threw) return { threw: true };
          let body = '';
          try { body = await rec.response.text(); } catch { /* empty */ }
          try { return { threw: false, ...JSON.parse(body) }; } catch { return { threw: false, parse: false }; }
        };
        const parseCheck = (v) => {
          try { const r = JSON.parse(v.stdout); return { exit: v.exit, refusals: r.refusals ?? [] }; } catch { return null; }
        };

        // The emitted pane is clean: exit 0, zero refusals.
        const clean = await runCheck('pane-clean');
        if (clean.threw || clean.parse === false) return exhausted('a11y route crashed or returned an unparseable body');
        const c = parseCheck(clean);
        if (!c) return exhausted('a11y pane-clean: unparseable check body');
        if (c.exit !== 0 || c.refusals.length > 0) {
          return exhausted(`the emitted pane failed its own a11y/i18n check: exit ${c.exit}, ${JSON.stringify(c.refusals.slice(0, 4))}`);
        }

        // Each hostile pane must refuse with its exact code (exit 1).
        const expect = {
          'pane-no-landmark': 'E_A11Y_NO_LANDMARK',
          'pane-fake-anchor': 'E_A11Y_FAKE_ANCHOR',
          'pane-no-focus': 'E_A11Y_NO_FOCUS',
          'pane-unkeyed': 'E_I18N_UNKEYED',
        };
        const fails = [];
        for (const [shape, code] of Object.entries(expect)) {
          const r = await runCheck(shape);
          if (r.threw || r.parse === false) { fails.push(`${shape}: unparseable body`); continue; }
          const v = parseCheck(r);
          if (!v) { fails.push(`${shape}: unparseable check body`); continue; }
          if (v.exit !== 1) { fails.push(`${shape}: exit ${v.exit} (expected 1)`); continue; }
          if (!v.refusals.some((x) => x.code === code)) {
            fails.push(`${shape}: expected ${code}, got [${v.refusals.map((x) => x.code).join(', ')}]`);
          }
        }
        if (fails.length) return exhausted(`the a11y/i18n floor leaked: ${fails.join(' | ')}`);
        return refused('the emitted pane passes a11y/i18n; no landmark, a click-handler row, no focus ring, and unkeyed chrome each refuse by name (S5/G8)');
      },
    },

    {
      name: 'graph-propagation-walks',
      description: 'the dependency graph (G3): a bump on a leaf propagates to every transitive dependent by name, and an unknown id refuses E_IMPACT_UNKNOWN_MEMBER',
      async run(harness, ctx = {}) {
        const runImpact = async (shape) => {
          const rec = await harness.run('impact', { method: 'GET', url: `/impact?shape=${shape}` });
          if (rec.threw) return { threw: true };
          let body = '';
          try { body = await rec.response.text(); } catch { /* empty */ }
          try { return { threw: false, ...JSON.parse(body) }; } catch { return { threw: false, parse: false }; }
        };
        const fails = [];

        // leaf <- mid <- top: a bump on leaf must reach mid and top.
        const r = await runImpact('impact-chain');
        if (r.threw || r.parse === false) return exhausted('impact route crashed or returned an unparseable body');
        if (r.exit !== 0) fails.push(`impact-chain: exit ${r.exit} (expected 0)`);
        let v = null;
        try { v = JSON.parse(r.stdout); } catch { /* leave null */ }
        if (!v) fails.push('impact-chain: unparseable impact body');
        else {
          if (JSON.stringify(v.direct) !== JSON.stringify(['mid'])) fails.push(`impact-chain: direct ${JSON.stringify(v.direct)} (expected ["mid"])`);
          if (JSON.stringify(v.transitive) !== JSON.stringify(['mid', 'top'])) fails.push(`impact-chain: transitive ${JSON.stringify(v.transitive)} (expected ["mid","top"])`);
        }

        // An unknown id must refuse by name.
        const u = await runImpact('impact-unknown');
        if (u.threw || u.parse === false) fails.push('impact-unknown: unparseable body');
        else {
          if (u.exit !== 1) fails.push(`impact-unknown: exit ${u.exit} (expected 1)`);
          const blob = `${u.stdout}${u.stderr}`;
          if (!blob.includes('E_IMPACT_UNKNOWN_MEMBER')) fails.push('impact-unknown: expected E_IMPACT_UNKNOWN_MEMBER');
        }

        if (fails.length) return exhausted(`the propagation path leaked: ${fails.join(' | ')}`);
        return refused('a bump on a leaf walks to every transitive dependent by name (direct + transitive), and an unknown id refuses E_IMPACT_UNKNOWN_MEMBER (G3)');
      },
    },

    {
      name: 'fleet-meter-names-drift',
      description: 'the fleet drift meter (G13): a drifted member is named by its exact refusal on one page, a clean member passes, and a member with no checkout is unchecked - never a silent pass',
      async run(harness, ctx = {}) {
        const runFleet = async (shape) => {
          const rec = await harness.run('fleet', { method: 'GET', url: `/fleet?shape=${shape}` });
          if (rec.threw) return { threw: true };
          let body = '';
          try { body = await rec.response.text(); } catch { /* empty */ }
          try { return { threw: false, ...JSON.parse(body) }; } catch { return { threw: false, parse: false }; }
        };
        const reportOf = (r) => {
          try { return JSON.parse(r.stdout) } catch { return null }
        };
        const codes = (rep) => (rep?.refusals ?? []).map((x) => x.code);
        const fails = [];

        // Clean fleet: exit 0, no drifts.
        const c = await runFleet('fleet-clean');
        if (c.threw || c.parse === false) return exhausted('fleet route crashed or returned an unparseable body');
        if (c.exit !== 0) fails.push(`fleet-clean: exit ${c.exit} (expected 0)`);
        const cr = reportOf(c);
        if (!cr) fails.push('fleet-clean: unparseable report');
        else if (cr.report.drifts.length) fails.push(`fleet-clean: unexpected drifts ${JSON.stringify(cr.report.drifts)}`);
        else if (cr.report.read !== 2) fails.push(`fleet-clean: read ${cr.report.read} (expected 2)`);

        // Drifted fleet: beta names floor, lockfile, version, and pin-style drift.
        const d = await runFleet('fleet-drift');
        if (d.threw || d.parse === false) fails.push('fleet-drift: unparseable body');
        else {
          if (d.exit !== 1) fails.push(`fleet-drift: exit ${d.exit} (expected 1)`);
          const dr = reportOf(d);
          const got = codes(dr).sort();
          const want = ['E_FLEET_FLOOR_DRIFT', 'E_FLEET_LOCK_MISSING', 'E_FLEET_PIN_STYLE_DRIFT', 'E_FLEET_VERSION_DRIFT'];
          if (JSON.stringify(got) !== JSON.stringify(want)) fails.push(`fleet-drift: codes ${JSON.stringify(got)} (expected ${JSON.stringify(want)})`);
          if (dr && dr.report.drifts.some((x) => x.startsWith('alpha'))) fails.push('fleet-drift: alpha (clean) should contribute no drift');
        }

        // Unchecked fleet: no checkout read, but never a silent pass.
        const u = await runFleet('fleet-unchecked');
        if (u.threw || u.parse === false) fails.push('fleet-unchecked: unparseable body');
        else {
          const ur = reportOf(u);
          if (!ur) fails.push('fleet-unchecked: unparseable report');
          else if (ur.report.read !== 0) fails.push(`fleet-unchecked: read ${ur.report.read} (expected 0)`);
          else if (!/no local checkout to read/.test(ur.lines ? ur.lines.join('\n') : '')) {
            // lines may be absent in JSON mode; the note lives in report.unchecked.
            if (ur.report.unchecked !== 2) fails.push('fleet-unchecked: expected both members unchecked and named as such');
          }
        }

        if (fails.length) return exhausted(`the fleet meter leaked: ${fails.join(' | ')}`);
        return refused('a drifted member is named by its exact refusal (floor + lockfile + version + pin style) on one page, a clean member passes, and a member with no checkout is unchecked - never a silent pass');
      },
    },

    {
      name: 'clean-family-canary',
      description: 'the conforming family exits 0 with an empty refusals list - the happy wire holds',
      async run(harness, ctx = {}) {
        const route = routeOf(ctx);
        const r = await runLint(harness, route, 'clean');
        if (r.threw) return exhausted('clean family canary crashed the lint double');
        const v = parseVerdict(r.body);
        if (!v) return exhausted('clean family canary: unparseable verdict body');
        if (v.exit !== 0) return exhausted(`clean family canary: exit ${v.exit} - conforming family refused`);
        if (v.refusals.length > 0) return exhausted(`clean family canary flagged: ${JSON.stringify(v.refusals.slice(0, 4))}`);
        return refused('clean family exits 0 with an empty refusals list (the happy wire holds)');
      },
    },
  ],
};
