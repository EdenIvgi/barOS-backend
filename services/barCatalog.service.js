import { dbService } from './mongo.service.js'
import { createCatalog, SHARED_INGREDIENTS, normalise } from './ingredientCatalog.service.js'

const COLLECTION = 'ingredients'
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * One bar's ingredient vocabulary: the shared list plus whatever it added.
 *
 * No shared list covers every bar - someone will keep falernum, or a date syrup
 * they make themselves, and a recipe calling for it has to be answerable. A bar
 * can therefore extend the catalogue, and its additions are its own: another
 * bar's falernum is not this one's business.
 *
 * Building an index is cheap but not free, and it is needed on every availability
 * check, so each bar's is cached and dropped whenever that bar changes its own
 * ingredients. The cache is per process; a second instance simply builds its own.
 */
export const barCatalog = { get, addIngredient, removeIngredient, listCustom, invalidate, COLLECTION }

const cache = new Map()

async function collection(dbName) {
    return dbService.getCollection(COLLECTION, dbName)
}

/** The catalogue this bar matches against. */
async function get(dbName) {
    const cached = cache.get(dbName)
    if (cached && cached.expiresAt > Date.now()) return cached.catalog

    const custom = await listCustom(dbName)
    // Shared first: a bar can add to the vocabulary, not redefine what "gin" means
    // for recipes everyone else reads.
    const catalog = createCatalog([...SHARED_INGREDIENTS, ...custom])
    cache.set(dbName, { catalog, expiresAt: Date.now() + CACHE_TTL_MS })
    return catalog
}

function invalidate(dbName) {
    cache.delete(dbName)
}

async function listCustom(dbName) {
    try {
        const ingredients = await collection(dbName)
        return ingredients.find({}).sort({ slug: 1 }).toArray()
    } catch {
        // A bar that has never added one has no collection yet, which is not a
        // failure: it just means the shared list is the whole vocabulary.
        return []
    }
}

/**
 * Adds an ingredient to this bar's vocabulary.
 *
 * The slug is derived rather than asked for, and prefixed, so a bar's own entry
 * can never collide with a shared one that arrives later in a release.
 */
async function addIngredient({ he, en, kind, aliases }, dbName) {
    const name = String(he || en || '').trim()
    if (!name) {
        const err = new Error('An ingredient needs a name')
        err.status = 400
        throw err
    }

    const slug = 'bar_' + (normalise(en || he).replace(/\s+/g, '_') || Date.now().toString(36))
    const doc = {
        slug,
        he: String(he || en || '').trim(),
        en: String(en || he || '').trim(),
        kind: kind || 'other',
        aliases: (aliases || []).map(a => String(a).trim()).filter(Boolean),
        isCustom: true,
        createdAt: Date.now(),
    }

    const ingredients = await collection(dbName)
    await ingredients.updateOne({ slug }, { $set: doc }, { upsert: true })
    invalidate(dbName)
    return doc
}

/** Only a bar's own entries can go; the shared ones are not its to remove. */
async function removeIngredient(slug, dbName) {
    if (!String(slug || '').startsWith('bar_')) {
        const err = new Error('Only a bar\'s own ingredients can be removed')
        err.status = 403
        throw err
    }
    const ingredients = await collection(dbName)
    const res = await ingredients.deleteOne({ slug })
    invalidate(dbName)
    return res.deletedCount > 0
}
