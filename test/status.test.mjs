// test/status.test.mjs - the family status dialect battery (family-status@1).
//
// The emitter's behavior is pinned with temp-dir fixtures, and the real
// tree's emitted counts are re-derived against the live ledger and pack banks
// so the dialect itself sits under CI the same way every other count here
// does. Behavior-only, temp dirs, no network.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from '../web/scripts/build-status.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const PASS_ROW = { id: 'governance/case-a', verdict: 'REFUSED', detail: 'x' }

function fixtureRepo({ findings, packs }) {
  const root = mkdtempSync(join(tmpdir(), 'govstruct-status-'))
  mkdirSync(join(root, 'labs'), { recursive: true })
  writeFileSync(join(root, 'labs', 'crashledger.json'), JSON.stringify({ schemaVersion: 1, findings }))
  for (const p of packs) {
    mkdirSync(join(root, 'packs', 'public', p.dir), { recursive: true })
    writeFileSync(join(root, 'packs', 'public', p.dir, 'pack.json'), JSON.stringify(p.manifest))
    writeFileSync(join(root, 'packs', 'public', p.dir, 'index.js'), p.bank)
  }
  return root
}

const CHECK_PACK = {
  dir: 'pack-x',
  manifest: { schemaVersion: 1, name: 'pack-x', version: '0.1.0', description: 'd', entry: 'index.js' },
  bank: 'export default { checks: [{ id: "a" }, { id: "b" }] }\n',
}

test('status: the dialect fields and leg rows derive from the committed ledger', async () => {
  const root = fixtureRepo({
    findings: [PASS_ROW, { id: 'auth/x', verdict: 'PASSED', detail: 'x' }],
    packs: [CHECK_PACK],
  })
  try {
    const s = await build(root)
    assert.equal(s.schema, 1)
    assert.equal(s.contract, 'family-status@1')
    assert.equal(s.repo, 'dhaupin/govstruct')
    assert.equal(s.site, 'https://govstruct.creadev.org/status')
    assert.ok(s.docs.startsWith('https://docs.creadev.org/govstruct'))
    assert.deepEqual(s.legs.find((l) => l.leg === 'crashtest'), {
      leg: 'crashtest', verdict: 'PASS', cases: 2, counts: { REFUSED: 1, PASSED: 1 }, ledger: 'labs/crashledger.json',
    })
    assert.deepEqual(s.packs, [{ name: 'pack-x', spec: 'packstruct@1', manifest: 'packs/public/pack-x/pack.json', cases: 2 }])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('status: any case verdict outside the pass set degrades the leg to RED (never a fake PASS)', async () => {
  const root = fixtureRepo({ findings: [PASS_ROW, { id: 'auth/x', verdict: 'EXPLOITED', detail: 'x' }], packs: [CHECK_PACK] })
  const root2 = fixtureRepo({ findings: [{ id: 'auth/x', verdict: 'MEANWHILE', detail: 'x' }], packs: [CHECK_PACK] })
  try {
    assert.equal((await build(root)).legs[0].verdict, 'RED')
    // An unknown verdict is the same refusal - the dialect degrades, not guesses
    assert.equal((await build(root2)).legs[0].verdict, 'RED')
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(root2, { recursive: true, force: true })
  }
})

test('status: the emitter refuses a pack that declares zero members loudly', async () => {
  const root = fixtureRepo({
    findings: [PASS_ROW],
    packs: [{ dir: 'pack-y', manifest: { name: 'pack-y', schemaVersion: 1, version: '0.1.0', description: 'd', entry: 'index.js' }, bank: 'export default { checks: [] }\n' }],
  })
  try {
    await assert.rejects(() => build(root), /pack-y.*zero members/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('status: the real tree emits the live ledger count and every pack carries members', async () => {
  const s = await build(REPO_ROOT)
  const findings = JSON.parse(readFileSync(join(REPO_ROOT, 'labs', 'crashledger.json'), 'utf8')).findings
  assert.equal(s.legs.find((l) => l.leg === 'crashtest').cases, findings.length)
  for (const leg of s.legs) assert.equal(leg.verdict, 'PASS')
  assert.ok(s.packs.length > 0, 'govstruct ships packs')
  for (const p of s.packs) assert.ok(p.cases > 0, `pack ${p.name} must declare members`)
})
