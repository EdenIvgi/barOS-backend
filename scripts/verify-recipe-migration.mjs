/**
 * Verifies the Bar Book -> recipes collection migration against a real MongoDB.
 * Usage: node scripts/verify-recipe-migration.mjs
 */
import dotenv from 'dotenv'
dotenv.config({ quiet: true })

import assert from 'node:assert/strict'
const { dbService } = await import('../services/mongo.service.js')
const { barBookModel } = await import('../api/barBook/barBook.model.js')

const dbName = `verify_recipe_migration_${Date.now()}`
const T = he => ({ he, en: '' })
const L = he => ({ he, en: '' })

async function seedBook(pages) {
    const col = await dbService.getCollection('barBook', dbName)
    await col.deleteMany({})
    await col.insertOne({ pages, createdAt: 1, updatedAt: 1 })
}
const rawDoc = async () => (await dbService.getCollection('barBook', dbName)).findOne({})
const recipes = async () => (await dbService.getCollection('recipes', dbName)).find({}).toArray()

try {
    await seedBook([{
        _id: 'r', type: 'recipes', title: 'מתכונים', items: [
            { title: T('מרגריטה'), ingredients: [L('60 ml tequila'), L('30 ml מיץ ליים')], instructions: [{ he: 'לנער', en: 'Shake' }] },
            { title: T('משהו חדש'), ingredients: [L('20 ml סילאן')] },
            { title: T('עם תמונה'), imageUrl: '/api/image/aaaaaaaaaaaaaaaaaaaaaaaa' },
            { title: T('עם קישור'), imageUrl: 'https://example.com/x.jpg' },
            { ingredients: [L('10 ml gin')] },
            { title: T('מרגריטה') },
            { title: T('בלי מצרכים') },
        ],
    }])

    const after = await barBookModel.get(dbName)
    const saved = await recipes()
    const byTitle = t => saved.find(r => r.title?.he === t)

    assert.equal(after.pages.filter(p => p.type === 'recipes').length, 0)
    assert.equal((await rawDoc()).pages.filter(p => p.type === 'recipes').length, 0)
    assert.equal(saved.length, 5)
    assert.equal(byTitle('משהו חדש').ingredients[0].rawText, 'סילאן')
    assert.equal(byTitle('משהו חדש').ingredients[0].ingredientId, '')
    assert.deepEqual(byTitle('משהו חדש').requiredIds, [])
    assert.ok(byTitle('מרגריטה').requiredIds.includes('tequila'))
    assert.deepEqual(byTitle('מרגריטה').instructions, { he: ['לנער'], en: ['Shake'] })
    assert.equal(byTitle('עם תמונה').imageUrl, '/api/image/aaaaaaaaaaaaaaaaaaaaaaaa')
    assert.equal(byTitle('עם קישור').imageUrl, 'https://example.com/x.jpg')
    assert.deepEqual(byTitle('בלי מצרכים').ingredients, [])

    await barBookModel.get(dbName)
    const secondReadCount = (await recipes()).length
    assert.equal(secondReadCount, 5)

    // A book that never held recipes is not written to at all.
    await seedBook([{ _id: 'x', type: 'table', headers: [], rows: [] }])
    const before = (await rawDoc()).updatedAt
    await barBookModel.get(dbName)
    assert.equal((await rawDoc()).updatedAt, before)

    console.log('PASS: all recipe migration assertions held')
} finally {
    const db = await dbService.getDb(dbName)
    await db.dropDatabase()
    await dbService.close()
}
