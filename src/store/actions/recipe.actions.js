import { recipeService } from '../../services/recipe.service'
import {
  SET_RECIPES,
  ADD_RECIPE,
  UPDATE_RECIPE,
  REMOVE_RECIPE,
  SET_IS_LOADING,
  SET_ERROR,
} from '../reducers/recipe.reducer'
import { store } from '../store'

export async function loadRecipes() {
  try {
    store.dispatch({ type: SET_IS_LOADING, isLoading: true })
    const data = await recipeService.query()
    const recipesArray = Array.isArray(data) ? data : (data?.recipes ?? data?.data ?? [])
    const list = Array.isArray(recipesArray) ? recipesArray : []
    store.dispatch({ type: SET_RECIPES, recipes: list })
    store.dispatch({ type: SET_ERROR, error: null })
    return list
  } catch (error) {
    store.dispatch({
      type: SET_ERROR,
      error: error?.response?.data?.details || error?.response?.data?.error || error?.message || 'טעינת המתכונים נכשלה',
    })
    store.dispatch({ type: SET_RECIPES, recipes: [] })
    throw error
  } finally {
    setTimeout(() => {
      store.dispatch({ type: SET_IS_LOADING, isLoading: false })
    }, 350)
  }
}

export async function saveRecipe(recipe) {
  try {
    store.dispatch({ type: SET_ERROR, error: null })
    const saved = await recipeService.save(recipe)
    if (recipe._id) {
      store.dispatch({ type: UPDATE_RECIPE, recipe: saved })
    } else {
      store.dispatch({ type: ADD_RECIPE, recipe: saved })
    }
    return saved
  } catch (error) {
    store.dispatch({
      type: SET_ERROR,
      error: error?.response?.data?.details || error?.response?.data?.error || error?.message || 'שמירת המתכון נכשלה',
    })
    throw error
  }
}

export async function removeRecipe(recipeId) {
  try {
    store.dispatch({ type: SET_ERROR, error: null })
    await recipeService.remove(recipeId)
    store.dispatch({ type: REMOVE_RECIPE, recipeId })
  } catch (error) {
    store.dispatch({
      type: SET_ERROR,
      error: error?.response?.data?.details || error?.response?.data?.error || error?.message || 'מחיקת המתכון נכשלה',
    })
    throw error
  }
}
