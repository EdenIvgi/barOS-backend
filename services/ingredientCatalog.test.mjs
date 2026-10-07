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

test('reads a non-volume unit and keeps the name clean', () => {
  const line = catalog.parseFreeText('1 wedge lime')
  assert.equal(line.unit, 'wedge')
  assert.equal(line.rawText, 'lime')
  assert.equal(line.amount, 1)
})

test('leaves a digit that belongs to a name alone', () => {
  const line = catalog.parseFreeText('7up 20 ml')
  assert.equal(line.amount, 20)
  assert.equal(line.unit, 'ml')
  assert.equal(line.rawText, '7up')
})

test('does not read a fraction as an amount', () => {
  const line = catalog.parseFreeText('1/2 oz lime')
  assert.equal(line.amount, null)
  assert.equal(line.unit, 'oz')
  assert.equal(line.rawText, '1/2 lime')
})

test('reads a unit stuck to its number', () => {
  const line = catalog.parseFreeText('60ml gin')
  assert.equal(line.amount, 60)
  assert.equal(line.unit, 'ml')
  assert.equal(line.rawText, 'gin')
})

test('does not take a unit off the prototype chain', () => {
  const line = catalog.parseFreeText('2 constructor gin')
  assert.equal(line.unit, 'ml')
  assert.equal(line.rawText, 'constructor gin')
})
