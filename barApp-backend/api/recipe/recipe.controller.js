import { recipeService } from './recipe.service.js'

export async function getRecipes(req, res, next) {
    try {
        const recipes = await recipeService.query(req.userDbName)
        res.json(recipes)
    } catch (error) {
        next(error)
    }
}

export async function getRecipeById(req, res, next) {
    try {
        const recipe = await recipeService.getById(req.params.id, req.userDbName)
        if (!recipe) return res.status(404).json({ error: 'Recipe not found' })
        res.json(recipe)
    } catch (error) {
        next(error)
    }
}

export async function addRecipe(req, res, next) {
    try {
        const added = await recipeService.add(req.body, req.userDbName)
        res.status(201).json(added)
    } catch (error) {
        next(error)
    }
}

export async function updateRecipe(req, res, next) {
    try {
        const updated = await recipeService.update(req.params.id, req.body, req.userDbName)
        if (!updated) return res.status(404).json({ error: 'Recipe not found' })
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

export async function deleteRecipe(req, res, next) {
    try {
        const deletedCount = await recipeService.remove(req.params.id, req.userDbName)
        if (deletedCount === 1) res.json({ message: 'Deleted successfully' })
        else res.status(404).json({ error: 'Recipe not found' })
    } catch (error) {
        next(error)
    }
}
