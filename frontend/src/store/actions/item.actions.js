import { itemService } from '../../services/item.service'
import {
  SET_ITEMS,
  REMOVE_ITEM,
  ADD_ITEM,
  UPDATE_ITEM,
  SET_MAX_PAGE,
  SET_FILTER_BY,
  SET_IS_LOADING,
  SET_ERROR,
} from '../reducers/item.reducer'
import { store } from '../store'

export async function loadItems(filterBy) {
  const filter = filterBy || store.getState().itemModule.filterBy
  try {
    store.dispatch({ type: SET_IS_LOADING, isLoading: true })
    const result = await itemService.query(filter)
    store.dispatch({ type: SET_ITEMS, items: result.items })
    store.dispatch({ type: SET_MAX_PAGE, maxPage: result.maxPage })
  } catch (error) {
    store.dispatch({ type: SET_ERROR, error: 'Failed to load items' })
    throw error
  } finally {
    setTimeout(() => {
      store.dispatch({ type: SET_IS_LOADING, isLoading: false })
    }, 350)
  }
}

export async function removeItem(itemId) {
  try {
    await itemService.remove(itemId)
    store.dispatch({ type: REMOVE_ITEM, itemId })
  } catch (error) {
    store.dispatch({ type: SET_ERROR, error: 'Failed to remove item' })
    throw error
  }
}

export async function saveItem(item) {
  try {
    const type = item._id ? UPDATE_ITEM : ADD_ITEM
    const savedItem = await itemService.save(item)
    store.dispatch({ type, item: savedItem })
    return savedItem
  } catch (error) {
    store.dispatch({ type: SET_ERROR, error: 'Failed to save item' })
    throw error
  }
}

export function setFilterBy(filterBy = itemService.getDefaultFilter()) {
  store.dispatch({ type: SET_FILTER_BY, filterBy })
}
