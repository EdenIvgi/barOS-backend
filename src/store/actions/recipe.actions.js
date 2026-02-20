import { recipeService } from '../../services/recipe.service'
import {
  setRecipes as setRecipesAction,
  addRecipe as addRecipeAction,
  updateRecipe as updateRecipeAction,
  removeRecipe as removeRecipeAction,
  setIsLoading,
  setError,
} from '../slices/recipe.slice'
import { store } from '../store'

export async function loadRecipes() {
  try {
    store.dispatch(setIsLoading(true))
    const data = await recipeService.query()
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.recipes ?? data?.data)
        ? (data.recipes ?? data.data)
        : []
    store.dispatch(setRecipesAction(list))
    store.dispatch(setError(null))
    return list
  } catch (error) {
    store.dispatch(
      setError(
        error?.response?.data?.details ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to load recipes'
      )
    )
    store.dispatch(setRecipesAction([]))
    throw error
  } finally {
    setTimeout(() => {
      store.dispatch(setIsLoading(false))
    }, 350)
  }
}

export async function saveRecipe(recipe) {
  try {
    store.dispatch(setError(null))
    const saved = await recipeService.save(recipe)
    if (recipe._id) {
      store.dispatch(updateRecipeAction(saved))
    } else {
      store.dispatch(addRecipeAction(saved))
    }
    return saved
  } catch (error) {
    store.dispatch(
      setError(
        error?.response?.data?.details ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to save recipe'
      )
    )
    throw error
  }
}

export async function removeRecipe(recipeId) {
  try {
    store.dispatch(setError(null))
    await recipeService.remove(recipeId)
    store.dispatch(removeRecipeAction(recipeId))
  } catch (error) {
    store.dispatch(
      setError(
        error?.response?.data?.details ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to remove recipe'
      )
    )
    throw error
  }
}
