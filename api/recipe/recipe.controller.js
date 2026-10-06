import { recipeService } from './recipe.service.js'
import { createError } from '../../middleware/error.middleware.js'

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
        res.json({ ingredients: recipeService.ingredients() })
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
