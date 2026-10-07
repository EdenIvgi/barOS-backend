/**
 * Verifies the Bar Book -> recipes collection migration against a real MongoDB.
 * Usage: node scripts/verify-recipe-migration.mjs
 */
import dotenv from 'dotenv'
dotenv.config({ quiet: true })

import assert from 'node:assert/strict'
const { dbService } = await import('../services/mongo.service.js')
const { imageStore } = await import('../services/imageStore.service.js')
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

let failed = false
try {
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const photoId = (await imageStore.saveImage(dbName, png)).id
    await seedBook([{
        _id: 'r', type: 'recipes', title: 'מתכונים', items: [
            { title: T('מרגריטה'), ingredients: [L('60 ml tequila'), L('30 ml מיץ ליים')], instructions: [{ he: 'לנער', en: 'Shake' }] },
            { title: T('משהו חדש'), ingredients: [L('20 ml סילאן')] },
            { title: T('עם תמונה'), imageUrl: `/api/image/${photoId}` },
            { title: T('עם קישור'), imageUrl: 'https://example.com/x.jpg' },
            { ingredients: [L('10 ml gin')] },
            { title: T('מרגריטה'), ingredients: [L('45 ml gin')] },
            { title: T('בלי מצרכים') },
            { title: T('מחרוזת'), ingredients: '50 ml gin\n20 ml סילאן' },
        ],
    }])

    // Two simultaneous first reads must migrate once.
    const [after] = await Promise.all([barBookModel.get(dbName), barBookModel.get(dbName)])
    const saved = await recipes()
    const byTitle = t => saved.find(r => r.title?.he === t)

    assert.equal(after.pages.filter(p => p.type === 'recipes').length, 0)
    assert.equal((await rawDoc()).pages.filter(p => p.type === 'recipes').length, 0)
    assert.equal(saved.length, 7)                                // only the untitled one is skipped
    const margs = saved.filter(r => r.title?.he === 'מרגריטה')
    assert.equal(margs.length, 2)
    assert.ok(margs.some(r => r.requiredIds.includes('tequila')))
    assert.ok(margs.some(r => r.ingredients.some(i => i.rawText === 'gin' || i.ingredientId === 'gin')))
    assert.equal(byTitle('מחרוזת').ingredients.length, 2)
    assert.ok(saved.every(r => r.migratedFrom))
    assert.equal(byTitle('משהו חדש').ingredients[0].rawText, 'סילאן')
    assert.equal(byTitle('משהו חדש').ingredients[0].ingredientId, '')
    assert.deepEqual(byTitle('משהו חדש').requiredIds, [])
    assert.ok(byTitle('מרגריטה').requiredIds.includes('tequila'))
    assert.deepEqual(byTitle('מרגריטה').instructions, { he: ['לנער'], en: ['Shake'] })
    assert.equal(byTitle('עם תמונה').imageUrl, `/api/image/${photoId}`)
    // The URL string surviving proves nothing: the blob must still be in storage.
    assert.ok(await imageStore.openImage(dbName, photoId), 'migrated photo was deleted from storage')
    assert.equal(byTitle('עם קישור').imageUrl, 'https://example.com/x.jpg')
    assert.deepEqual(byTitle('בלי מצרכים').ingredients, [])

    await barBookModel.get(dbName)
    const secondReadCount = (await recipes()).length
    assert.equal(secondReadCount, 7)
    // The first save after the migrating read must not 409.
    await barBookModel.save({ pages: after.pages, baseUpdatedAt: after.updatedAt }, dbName)

    // A book that never held recipes is not written to at all.
    await seedBook([{ _id: 'x', type: 'table', headers: [], rows: [] }])
    const before = (await rawDoc()).updatedAt
    await barBookModel.get(dbName)
    assert.equal((await rawDoc()).updatedAt, before)

    // Two recipes pages without _id, items sharing indices: nothing may collapse.
    await seedBook([
        { type: 'recipes', items: [{ title: T('א1') }, { title: T('א2') }] },
        { type: 'recipes', items: [{ title: T('ב1') }, { title: T('ב2') }] },
    ])
    await (await dbService.getCollection('recipes', dbName)).deleteMany({})
    await barBookModel.get(dbName)
    assert.equal((await recipes()).length, 4, 'recipes from id-less pages collided')

    // A genuinely old-format document: returned updatedAt must be what was stored.
    await (await dbService.getCollection('barBook', dbName)).deleteMany({})
    await (await dbService.getCollection('barBook', dbName)).insertOne({
        checklists: { opening: { title: 'פתיחה', items: ['a'] } },
        dailyTasks: [{ day: 'Sun', task: 't' }],
        createdAt: 1, updatedAt: 1,
    })
    const old = await barBookModel.get(dbName)
    assert.equal(old.updatedAt, (await rawDoc()).updatedAt)
    assert.notEqual(old.updatedAt, 1)
    await barBookModel.save({ pages: old.pages, baseUpdatedAt: old.updatedAt }, dbName)

    console.log('PASS: all recipe migration assertions held')
} catch (err) {
    failed = true
    console.error(err)
} finally {
    try {
        const db = await dbService.getDb(dbName)
        await db.dropDatabase()
    } catch (err) {
        failed = true
        console.error('could not drop throwaway database', dbName, err)
    }
    try { await dbService.close() } catch { /* nothing to do */ }
    if (failed) process.exitCode = 1
}
