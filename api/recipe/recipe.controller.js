import { recipeService } from './recipe.service.js'

export async function seedRecipes(req, res) {
  try {
    await recipeService.ensureDefaultRecipes()
    res.json({ ok: true, message: 'המתכונים נדחפו לדאטה בייס' })
  } catch (error) {
    console.error('[RecipeController] Error seeding recipes:', error)
    res.status(500).json({ error: 'Failed to seed recipes', details: error.message })
  }
}

export async function getRecipes(req, res) {
  try {
    const recipes = await recipeService.query()
    res.json(recipes)
  } catch (error) {
    console.error('[RecipeController] Error getting recipes:', error)
    res.status(500).json({ error: 'Failed to get recipes', details: error.message })
  }
}

export async function getRecipeById(req, res) {
  try {
    const { id: recipeId } = req.params
    const recipe = await recipeService.getById(recipeId)
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }
    res.json(recipe)
  } catch (error) {
    console.error('[RecipeController] Error getting recipe by id:', error)
    res.status(500).json({ error: 'Failed to get recipe', details: error.message })
  }
}

export async function addRecipe(req, res) {
  try {
    const recipe = req.body
    const added = await recipeService.add(recipe)
    res.status(201).json(added)
  } catch (error) {
    console.error('[RecipeController] Error adding recipe:', error)
    res.status(500).json({ error: 'Failed to add recipe', details: error.message })
  }
}

export async function updateRecipe(req, res) {
  try {
    const { id: recipeId } = req.params
    const recipe = req.body
    const updated = await recipeService.update(recipeId, recipe)
    if (!updated) {
      return res.status(404).json({ error: 'Recipe not found' })
    }
    res.json(updated)
  } catch (error) {
    console.error('[RecipeController] Error updating recipe:', error)
    res.status(500).json({ error: 'Failed to update recipe', details: error.message })
  }
}

export async function deleteRecipe(req, res) {
  try {
    const { id: recipeId } = req.params
    const deletedCount = await recipeService.remove(recipeId)
    if (deletedCount === 1) {
      res.json({ message: 'Deleted successfully' })
    } else {
      res.status(404).json({ error: 'Recipe not found' })
    }
  } catch (error) {
    console.error('[RecipeController] Error deleting recipe:', error)
    res.status(500).json({ error: 'Failed to delete recipe', details: error.message })
  }
}
