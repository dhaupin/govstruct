// test/templates.test.mjs - the starter pin floors (PRD section 10 S3, issue #23).
//
// A starter template declares the dependency floors an integrator may rely on
// (react >= 18, vite >= 5, react-router >= 6). Both ways: a pin at or above the
// floor is honored, and a pin below it refuses by name (E_TEMPLATE_FLOOR_DRIFT).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { versionParts, compareParts, honorsFloor, checkTemplateFloors } from '../src/templates.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')

test('versionParts reads the leading numeric run', () => {
  assert.deepEqual(versionParts('^18.3.1'), [18, 3, 1])
  assert.deepEqual(versionParts('>=5'), [5])
  assert.deepEqual(versionParts('v6.23.1-beta.1'), [6, 23, 1])
  assert.deepEqual(versionParts('no digits'), [])
})

test('compareParts orders by digit, missing parts read as zero', () => {
  assert.equal(compareParts([18, 3, 1], [18]), 1)
  assert.equal(compareParts([5], [5, 0, 0]), 0)
  assert.equal(compareParts([4, 9], [5]), -1)
})

test('honorsFloor is true at or above the floor, false below', () => {
  assert.equal(honorsFloor('^18.3.1', '>=18'), true)
  assert.equal(honorsFloor('^17.0.0', '>=18'), false)
  assert.equal(honorsFloor('^5.4.0', '>=5'), true)
  assert.equal(honorsFloor('^4.9.0', '>=5'), false)
  assert.equal(honorsFloor('^6.23.1', '>=6'), true)
})

test('an unparseable spec or floor is a state, not a refusal', () => {
  assert.equal(honorsFloor('latest', '>=18'), true)
  assert.equal(honorsFloor('^18.0.0', 'latest'), true)
})

test('checkTemplateFloors passes a template that honors every floor', () => {
  const block = { templates: { file: 'web/package.json', floors: [{ name: 'react', floor: '>=18' }] } }
  const pkg = { dependencies: { react: '^18.3.1' } }
  assert.deepEqual(checkTemplateFloors(block, pkg), [])
})

test('checkTemplateFloors refuses a pin below its floor by name', () => {
  const block = { templates: { floors: [{ name: 'vite', floor: '>=5' }] } }
  const pkg = { devDependencies: { vite: '^4.9.0' } }
  const findings = checkTemplateFloors(block, pkg)
  assert.equal(findings.length, 1)
  assert.equal(findings[0].code, 'E_TEMPLATE_FLOOR_DRIFT')
  assert.match(findings[0].message, /"vite"/)
})

test('checkTemplateFloors refuses a floor naming an unpinned dependency', () => {
  const block = { templates: { floors: [{ name: 'react-router', floor: '>=6' }] } }
  const findings = checkTemplateFloors(block, { dependencies: { react: '^18.3.1' } })
  assert.equal(findings[0].code, 'E_TEMPLATE_FLOOR_DRIFT')
  assert.match(findings[0].message, /does not pin/)
})

test('a block with no template floors is a clean no-op', () => {
  assert.deepEqual(checkTemplateFloors({}, { dependencies: {} }), [])
  assert.deepEqual(checkTemplateFloors(null, {}), [])
})

// --- the shipped coreforge block is clean both ways ---

test('the shipped coreforge template floors are honored by its web template', async () => {
  const { templateFloorsFor } = await import('../src/templates.mjs')
  const { readFileSync } = await import('node:fs')
  const block = JSON.parse(readFileSync(join(ROOT, 'compliance', 'coreforge.json'), 'utf8'))
  assert.ok(block.templates.floors.length >= 3)
  assert.deepEqual(templateFloorsFor(ROOT, block), [])
})
