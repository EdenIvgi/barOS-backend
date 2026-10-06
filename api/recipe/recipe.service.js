import { recipeModel } from './recipe.model.js'
import { recipeLibraryService } from '../../services/recipeLibrary.service.js'
import { barCatalog } from '../../services/barCatalog.service.js'
import { serializeDoc } from '../../services/serialize.service.js'

const DEFAULT_LIMIT = 60

/**
 * Recipes as one list.
 *
 * A bartender looking for something to pour does not care which collection a
 * recipe came from, so the shared library and the bar's own recipes are merged
 * here and marked with where they came from rather than kept apart.
 *
 * Every recipe is answered with what the bar is missing for it. That is the whole
 * feature: "you can make this" is useful, and "you are one bottle away" is what
 * someone acts on.
 */
export const recipeService = { query, getById, create, update, remove, createMany, ingredients }

/** The shared vocabulary plus whatever this bar added to it. */
async function ingredients(dbName) {
    const catalog = await barCatalog.get(dbName)
    return catalog.all()
}

/** A recipe plus what this bar is short of for it. */
function annotate(recipe, available) {
    const missing = (recipe.requiredIds || []).filter(id => !available.has(id))
    const missingOptional = (recipe.ingredients || [])
        .filter(line => (line.isOptional || line.isGarnish) && !available.has(line.ingredientId))
        .map(line => line.ingredientId)

    return {
        ...serializeDoc(recipe),
        source: recipe.isLibrary ? 'library' : 'bar',
        canMake: missing.length === 0,
        missing,
        missingOptional,
        missingCount: missing.length,
    }
}

function matchesText(recipe, needle, catalog) {
    if (!needle) return true
    const key = catalog.normalise(needle)
    if (!key) return true

    const haystack = [
        recipe.title?.he, recipe.title?.en, recipe.slug,
        ...(recipe.ingredientIds || []).flatMap(id => {
            const ing = catalog.get(id)
            return ing ? [ing.he, ing.en] : []
        }),
    ]
    return haystack.some(text => catalog.normalise(text).includes(key))
}

/**
 * Filters: `q` free text, `scope` library|bar, `kind` cocktail|syrup, and
 * `availability` canMake|missingOne — the two questions worth asking a shelf.
 */
async function query(dbName, filterBy = {}) {
    const [library, own, available, catalog] = await Promise.all([
        recipeLibraryService.listLibrary(),
        recipeModel.getAll(dbName),
        recipeModel.getAvailableIngredients(dbName),
        barCatalog.get(dbName),
    ])

    const scope = filterBy.scope
    let all = []
    if (scope !== 'bar') all = all.concat(library)
    if (scope !== 'library') all = all.concat(own)

    let recipes = all
        .filter(recipe => matchesText(recipe, filterBy.q, catalog))
        .filter(recipe => {
            if (filterBy.kind === 'syrup') return Boolean(recipe.produces)
            if (filterBy.kind === 'cocktail') return !recipe.produces
            return true
        })
        .map(recipe => annotate(recipe, available))

    if (filterBy.availability === 'canMake') {
        recipes = recipes.filter(r => r.canMake)
    } else if (filterBy.availability === 'missingOne') {
        recipes = recipes.filter(r => r.missingCount === 1)
    }

    // What is closest to pourable comes first; a bar's own recipes win ties,
    // because its own drinks are the ones it means to serve.
    recipes.sort((a, b) =>
        a.missingCount - b.missingCount ||
        (a.source === b.source ? 0 : a.source === 'bar' ? -1 : 1) ||
        String(a.title?.he || '').localeCompare(String(b.title?.he || ''), 'he')
    )

    const limit = Math.min(Number(filterBy.limit) || DEFAULT_LIMIT, 200)
    const skip = Math.max(Number(filterBy.skip) || 0, 0)

    return {
        recipes: recipes.slice(skip, skip + limit),
        total: recipes.length,
        availableCount: available.size,
    }
}

async function getById(id, dbName) {
    const available = await recipeModel.getAvailableIngredients(dbName)

    // A library recipe is addressed by its slug, a bar's own by its id; one lookup
    // path would have to guess which, so both are tried and whichever answers wins.
    const own = await recipeModel.getById(id, dbName)
    if (own) return annotate(own, available)

    const shared = await recipeLibraryService.getBySlug(id)
    return shared ? annotate(shared, available) : null
}

async function create(recipe, dbName) {
    const created = await recipeModel.create(recipe, dbName)
    const available = await recipeModel.getAvailableIngredients(dbName)
    return annotate(created, available)
}

async function update(id, recipe, dbName) {
    const updated = await recipeModel.update(id, recipe, dbName)
    if (!updated) return null
    const available = await recipeModel.getAvailableIngredients(dbName)
    return annotate(updated, available)
}

async function createMany(list, dbName) {
    return recipeModel.createMany(Array.isArray(list) ? list : [], dbName)
}

async function remove(id, dbName) {
    return recipeModel.remove(id, dbName)
}
