import { categoryService } from '../../services/category.service'
import {
  SET_CATEGORIES,
  SET_IS_LOADING,
  SET_ERROR,
} from '../reducers/category.reducer'
import { store } from '../store'

export async function loadCategories() {
  try {
    store.dispatch({ type: SET_IS_LOADING, isLoading: true })
    const categories = await categoryService.query()
    const categoriesArray = Array.isArray(categories) ? categories : []
    store.dispatch({ type: SET_CATEGORIES, categories: categoriesArray })
    return categoriesArray
  } catch (error) {
    store.dispatch({ type: SET_ERROR, error: 'Failed to load categories' })
    store.dispatch({ type: SET_CATEGORIES, categories: [] })
    throw error
  } finally {
    setTimeout(() => {
      store.dispatch({ type: SET_IS_LOADING, isLoading: false })
    }, 350)
  }
}
