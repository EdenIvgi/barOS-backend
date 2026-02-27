import { recipeModel } from './recipe.model.js'
import { serializeDoc } from '../../services/serialize.service.js'

export const recipeService = {
  query,
  getById,
  add,
  update,
  remove,
}

async function query(dbName) {
  try {
    const recipes = await recipeModel.getAll(dbName)
    return recipes.map(serializeDoc)
  } catch (error) {
    console.error('[RecipeService] Error in query:', error)
    throw error
  }
}

async function getById(recipeId, dbName) {
  try {
    const recipe = await recipeModel.getById(recipeId, dbName)
    return serializeDoc(recipe)
  } catch (error) {
    console.error('[RecipeService] Error in getById:', error)
    throw error
  }
}

async function add(recipe, dbName) {
  try {
    const added = await recipeModel.create(recipe, dbName)
    return serializeDoc(added)
  } catch (error) {
    console.error('[RecipeService] Error in add:', error)
    throw error
  }
}

async function update(recipeId, recipe, dbName) {
  try {
    const updated = await recipeModel.update(recipeId, recipe, dbName)
    return serializeDoc(updated)
  } catch (error) {
    console.error('[RecipeService] Error in update:', error)
    throw error
  }
}

async function remove(recipeId, dbName) {
  try {
    return await recipeModel.remove(recipeId, dbName)
  } catch (error) {
    console.error('[RecipeService] Error in remove:', error)
    throw error
  }
}
