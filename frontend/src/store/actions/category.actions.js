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
    store.dispatch({ type: SET_CATEGORIES, categories })
  } catch (error) {
    store.dispatch({ type: SET_ERROR, error: 'Failed to load categories' })
    throw error
  } finally {
    setTimeout(() => {
      store.dispatch({ type: SET_IS_LOADING, isLoading: false })
    }, 350)
  }
}
