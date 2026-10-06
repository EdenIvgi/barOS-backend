import { dbService } from './mongo.service.js'
import { ingredientCatalog } from './ingredientCatalog.service.js'
import { RECIPE_LIBRARY } from '../data/recipeLibrary.mjs'
import { logger } from './logger.service.js'

const COLLECTION = 'recipeLibrary'

/**
 * The shared library, seeded into the master database.
 *
 * Every bar reads the same rows, which is the point: five hundred classics do not
 * need five hundred copies per tenant, and a correction reaches everyone at once.
 * A bar that wants its own version copies a recipe into its own collection and
 * edits that, so nothing here is ever written by a tenant.
 *
 * Seeding is by slug and idempotent: an edit to the data file reaches existing
 * installations on the next start, and a bar's own recipes are untouched because
 * they live somewhere else entirely.
 */
export const recipeLibraryService = { ensureLibrary, listLibrary, getBySlug, COLLECTION }

/** The stored shape of a library recipe, built from the terse data file. */
function toDocument(entry) {
    const ingredients = (entry.ingredients || [])
        .map(line => ingredientCatalog.parseLine(line))
        .filter(Boolean)

    const unknown = (entry.ingredients || []).length - ingredients.length
    if (unknown > 0) {
        logger.warn(`[recipeLibrary] ${entry.slug}: ${unknown} ingredient line(s) name nothing in the catalogue`)
    }

    // What a bar must own for the drink to be possible. A garnish is not a reason
    // to say no, and neither is something the recipe itself calls optional.
    //
    // Nor is the thing the recipe makes: a syrup recipe that listed its own
    // output would report itself as impossible until the bar already had a
    // bottle of it, which is exactly backwards.
    const requiredIds = [...new Set(
        ingredients
            .filter(i => !i.isOptional && !i.isGarnish && i.ingredientId !== entry.produces)
            .map(i => i.ingredientId)
    )]

    return {
        slug: entry.slug,
        title: { he: entry.he, en: entry.en },
        instructions: { he: entry.he_steps || [], en: entry.en_steps || [] },
        method: entry.method || '',
        glass: entry.glass || '',
        ingredients,
        ingredientIds: [...new Set(ingredients.map(i => i.ingredientId))],
        requiredIds,
        // A syrup recipe makes an ingredient other recipes ask for, rather than a
        // drink someone orders. It is the same kind of document either way.
        produces: entry.produces || null,
        yieldMl: entry.yieldMl || null,
        isLibrary: true,
        updatedAt: Date.now(),
    }
}

/** Writes the library into the master database. Safe to run on every start. */
async function ensureLibrary() {
    try {
        const collection = await dbService.getMasterCollection(COLLECTION)
        const docs = RECIPE_LIBRARY.map(toDocument)

        await collection.bulkWrite(
            docs.map(doc => ({
                updateOne: {
                    filter: { slug: doc.slug },
                    update: { $set: doc, $setOnInsert: { createdAt: Date.now() } },
                    upsert: true,
                },
            })),
            { ordered: false }
        )

        await collection.createIndex({ slug: 1 }, { unique: true })
        await collection.createIndex({ requiredIds: 1 })
        await collection.createIndex({ 'title.he': 1 })

        logger.info(`[recipeLibrary] ${docs.length} shared recipes ready`)
    } catch (err) {
        // A bar can still run its own recipes without the shared library, so this
        // must not stop the server from coming up.
        logger.error('[recipeLibrary] could not seed the shared library', err)
    }
}

async function listLibrary() {
    const collection = await dbService.getMasterCollection(COLLECTION)
    return collection.find({}).toArray()
}

async function getBySlug(slug) {
    const collection = await dbService.getMasterCollection(COLLECTION)
    return collection.findOne({ slug })
}
