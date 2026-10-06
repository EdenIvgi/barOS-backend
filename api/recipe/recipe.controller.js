import { recipeService } from './recipe.service.js'
import { createError } from '../../middleware/error.middleware.js'
import { recipeParseService } from '../../services/recipeParse.service.js'
import { barCatalog } from '../../services/barCatalog.service.js'

export async function getRecipes(req, res, next) {
    try {
        const result = await recipeService.query(req.userDbName, req.query)
        res.json(result)
    } catch (error) {
        next(error)
    }
}

export async function getRecipeById(req, res, next) {
    try {
        const recipe = await recipeService.getById(req.params.id, req.userDbName)
        if (!recipe) return next(createError('Recipe not found', 404))
        res.json(recipe)
    } catch (error) {
        next(error)
    }
}

export async function getIngredients(req, res, next) {
    try {
        res.json({ ingredients: await recipeService.ingredients(req.userDbName) })
    } catch (error) {
        next(error)
    }
}

export async function parseRecipes(req, res, next) {
    try {
        const catalog = await barCatalog.get(req.userDbName)
        const result = await recipeParseService.parseRecipes(req.body?.text, catalog)
        res.json(result)
    } catch (error) {
        // Text that holds no drink recipe is an ordinary outcome of pasting, not a
        // failure: it carries a code so the client can say the useful thing.
        if (error?.code === 'no_recipes') {
            return res.status(422).json({ error: error.message, code: 'no_recipes' })
        }
        next(error)
    }
}

export async function addRecipes(req, res, next) {
    try {
        const result = await recipeService.createMany(req.body?.recipes, req.userDbName)
        res.status(201).json(result)
    } catch (error) {
        next(error)
    }
}

export async function addRecipe(req, res, next) {
    try {
        const created = await recipeService.create(req.body, req.userDbName)
        res.status(201).json(created)
    } catch (error) {
        next(error)
    }
}

export async function updateRecipe(req, res, next) {
    try {
        const updated = await recipeService.update(req.params.id, req.body, req.userDbName)
        // A library recipe has no id in this bar's collection, so an update aimed at
        // one finds nothing. That is the intended answer: the shared text is shared.
        if (!updated) return next(createError('Recipe not found', 404))
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

export async function deleteRecipe(req, res, next) {
    try {
        const removed = await recipeService.remove(req.params.id, req.userDbName)
        if (!removed) return next(createError('Recipe not found', 404))
        res.json({ ok: true })
    } catch (error) {
        next(error)
    }
}
