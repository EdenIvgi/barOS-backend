import { recipeModel } from './recipe.model.js'

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

function serialize(recipe) {
  if (!recipe) return recipe
  const s = { ...recipe }
  if (s._id) s._id = s._id.toString()
  return s
}

async function query() {
  try {
    const recipes = await recipeModel.getAll()
    return recipes.map(serialize)
  } catch (error) {
    console.error('[RecipeService] Error in query:', error)
    throw error
  }
}

async function getById(recipeId) {
  try {
    const recipe = await recipeModel.getById(recipeId)
    return serialize(recipe)
  } catch (error) {
    console.error('[RecipeService] Error in getById:', error)
    throw error
  }
}

async function add(recipe) {
  try {
    const added = await recipeModel.create(recipe)
    return serialize(added)
  } catch (error) {
    console.error('[RecipeService] Error in add:', error)
    throw error
  }
}

async function update(recipeId, recipe) {
  try {
    const updated = await recipeModel.update(recipeId, recipe)
    return serialize(updated)
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
