import { recipeModel } from './recipe.model.js'
import { serializeDoc } from '../../services/serialize.service.js'

export const recipeService = {
  query,
  getById,
  add,
  update,
  remove,
  ensureDefaultRecipes
}

async function ensureDefaultRecipes() {
  await recipeModel.ensureDefaultRecipes()
}

async function query() {
  try {
    const recipes = await recipeModel.getAll()
    return recipes.map(serializeDoc)
  } catch (error) {
    console.error('[RecipeService] Error in query:', error)
    throw error
  }
}

async function getById(recipeId) {
  try {
    const recipe = await recipeModel.getById(recipeId)
    return serializeDoc(recipe)
  } catch (error) {
    console.error('[RecipeService] Error in getById:', error)
    throw error
  }
}

async function add(recipe) {
  try {
    const added = await recipeModel.create(recipe)
    return serializeDoc(added)
  } catch (error) {
    console.error('[RecipeService] Error in add:', error)
    throw error
  }
}

async function update(recipeId, recipe) {
  try {
    const updated = await recipeModel.update(recipeId, recipe)
    return serializeDoc(updated)
  } catch (error) {
    console.error('[RecipeService] Error in update:', error)
    throw error
  }
}

async function remove(recipeId) {
  try {
    return await recipeModel.remove(recipeId)
  } catch (error) {
    console.error('[RecipeService] Error in remove:', error)
    throw error
  }
}
