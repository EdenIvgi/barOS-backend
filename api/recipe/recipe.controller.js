import { recipeService } from './recipe.service.js'

export async function seedRecipes(req, res, next) {
    try {
        await recipeService.ensureDefaultRecipes()
        res.json({ ok: true, message: 'Recipes seeded successfully' })
    } catch (error) {
        next(error)
    }
}

export async function getRecipes(req, res, next) {
    try {
        const recipes = await recipeService.query()
        res.json(recipes)
    } catch (error) {
        next(error)
    }
}

export async function getRecipeById(req, res, next) {
    try {
        const recipe = await recipeService.getById(req.params.id)
        if (!recipe) return res.status(404).json({ error: 'Recipe not found' })
        res.json(recipe)
    } catch (error) {
        next(error)
    }
}

export async function addRecipe(req, res, next) {
    try {
        const added = await recipeService.add(req.body)
        res.status(201).json(added)
    } catch (error) {
        next(error)
    }
}

export async function updateRecipe(req, res, next) {
    try {
        const updated = await recipeService.update(req.params.id, req.body)
        if (!updated) return res.status(404).json({ error: 'Recipe not found' })
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

export async function deleteRecipe(req, res, next) {
    try {
        const deletedCount = await recipeService.remove(req.params.id)
        if (deletedCount === 1) res.json({ message: 'Deleted successfully' })
        else res.status(404).json({ error: 'Recipe not found' })
    } catch (error) {
        next(error)
    }
}
