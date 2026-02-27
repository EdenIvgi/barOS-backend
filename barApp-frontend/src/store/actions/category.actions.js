import { categoryService } from '../../services/category.service'
import {
  setCategories as setCategoriesAction,
  setIsLoading,
  setError,
} from '../slices/category.slice'
import { store } from '../store'

export async function loadCategories() {
  try {
    store.dispatch(setIsLoading(true))
    const categories = await categoryService.query()
    const categoriesArray = Array.isArray(categories) ? categories : []
    store.dispatch(setCategoriesAction(categoriesArray))
    return categoriesArray
  } catch (error) {
    store.dispatch(setError('Failed to load categories'))
    store.dispatch(setCategoriesAction([]))
    throw error
  } finally {
    store.dispatch(setIsLoading(false))
  }
}
