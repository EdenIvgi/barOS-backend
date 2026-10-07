import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCatalog, SHARED_INGREDIENTS } from './ingredientCatalog.service.js'

const catalog = createCatalog(SHARED_INGREDIENTS)

test('reads an amount, a unit and a known ingredient', () => {
  assert.deepEqual(catalog.parseFreeText('60 ml gin'), {
    ingredientId: 'gin', rawText: 'gin', amount: 60, unit: 'ml',
    isOptional: false, isGarnish: false,
  })
})

test('reads a Hebrew unit as ml and keeps the name clean', () => {
  const line = catalog.parseFreeText('60 מ״ל ג׳ין')
  assert.equal(line.unit, 'ml')
  assert.equal(line.amount, 60)
  assert.equal(line.rawText, 'ג׳ין')
})

test('reads a decimal written with a comma', () => {
  assert.equal(catalog.parseFreeText('2,5 ml absinthe').amount, 2.5)
})

test('keeps an unmatched name as rawText with no ingredientId', () => {
  const line = catalog.parseFreeText('20 ml סילאן')
  assert.equal(line.ingredientId, '')
  assert.equal(line.rawText, 'סילאן')
  assert.equal(line.amount, 20)
})

test('handles a line with no amount', () => {
  const line = catalog.parseFreeText('gin')
  assert.equal(line.ingredientId, 'gin')
  assert.equal(line.amount, null)
  assert.equal(line.unit, 'ml')
})

test('returns null for a blank line', () => {
  assert.equal(catalog.parseFreeText('   '), null)
})

test('falls back to the whole line when stripping leaves nothing', () => {
  assert.equal(catalog.parseFreeText('60 ml').rawText, '60 ml')
})
