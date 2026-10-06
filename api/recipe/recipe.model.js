import { dbService } from '../../services/mongo.service.js'
import { toObjectId } from '../../services/objectId.service.js'
import { ingredientCatalog } from '../../services/ingredientCatalog.service.js'

const COLLECTION = 'recipes'
const ITEMS = 'items'

/**
 * A bar's own recipes, and what that bar can currently make.
 *
 * The shared library lives elsewhere and is never written here. This collection
 * holds what one bar wrote itself, including its own version of a classic it
 * copied out of the library.
 */
export const recipeModel = { getAll, getById, create, update, remove, getAvailableIngredients }

async function collection(dbName) {
    return dbService.getCollection(COLLECTION, dbName)
}

async function getAll(dbName) {
    const recipes = await collection(dbName)
    return recipes.find({}).sort({ updatedAt: -1 }).toArray()
}

async function getById(id, dbName) {
    const recipes = await collection(dbName)
    const objId = toObjectId(id)
    return recipes.findOne(objId ? { _id: objId } : { _id: id })
}

async function create(recipe, dbName) {
    const recipes = await collection(dbName)
    const doc = { ...withDerived(recipe), createdAt: Date.now(), updatedAt: Date.now() }
    const res = await recipes.insertOne(doc)
    return { ...doc, _id: res.insertedId }
}

async function update(id, recipe, dbName) {
    const recipes = await collection(dbName)
    const objId = toObjectId(id)
    const filter = objId ? { _id: objId } : { _id: id }

    const { _id, createdAt, ...rest } = recipe
    const doc = { ...withDerived(rest), updatedAt: Date.now() }
    await recipes.updateOne(filter, { $set: doc })
    return recipes.findOne(filter)
}

async function remove(id, dbName) {
    const recipes = await collection(dbName)
    const objId = toObjectId(id)
    const res = await recipes.deleteOne(objId ? { _id: objId } : { _id: id })
    return res.deletedCount > 0
}

/**
 * The lists a recipe is matched on are derived, never trusted from the client:
 * they are what "can I make this" reads, so they have to agree with the
 * ingredients actually stored.
 */
function withDerived(recipe) {
    const ingredients = (recipe.ingredients || [])
        .filter(line => line && ingredientCatalog.has(line.ingredientId))
        .map(line => ({
            ingredientId: line.ingredientId,
            amount: Number.isFinite(Number(line.amount)) && Number(line.amount) > 0 ? Number(line.amount) : null,
            unit: line.unit || 'ml',
            isOptional: Boolean(line.isOptional),
            isGarnish: Boolean(line.isGarnish),
        }))

    return {
        ...recipe,
        ingredients,
        ingredientIds: [...new Set(ingredients.map(i => i.ingredientId))],
        requiredIds: [...new Set(
            ingredients.filter(i => !i.isOptional && !i.isGarnish).map(i => i.ingredientId)
        )],
        isLibrary: false,
    }
}

/**
 * What the bar can pour right now.
 *
 * Only products actually in stock count: a bottle the bar is out of cannot make a
 * drink, and saying otherwise is the one answer this feature must never give.
 *
 * Products carry a mapping once someone sets or saves one, but an unmapped product
 * is matched here on the spot rather than being treated as nothing. That keeps a
 * bar that has never opened this screen from seeing an empty shelf.
 */
async function getAvailableIngredients(dbName) {
    const items = await dbService.getCollection(ITEMS, dbName)
    const inStock = await items
        .find({}, { projection: { name: 1, nameEn: 1, category: 1, ingredientId: 1, stockQuantity: 1 } })
        .toArray()

    const available = new Map()
    for (const item of inStock) {
        if ((Number(item.stockQuantity) || 0) <= 0) continue
        const slug = ingredientCatalog.matchItem(item)
        if (!slug) continue
        // Several bottles can be the same ingredient; the first one is enough to
        // name it, and keeping it lets the screen say which bottle to reach for.
        if (!available.has(slug)) available.set(slug, { ingredientId: slug, itemId: item._id, name: item.name })
    }
    return available
}
