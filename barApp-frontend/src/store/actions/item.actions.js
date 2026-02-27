import { itemService } from '../../services/item.service'
import {
  setItems,
  removeItem as removeItemAction,
  addItem as addItemAction,
  updateItem as updateItemAction,
  setMaxPage,
  setFilterBy as setFilterByAction,
  setIsLoading,
  setError,
} from '../slices/item.slice'
import { store } from '../store'

const STALE_MS = 30_000
let _lastFetchAt = 0
let _lastFilter = null

export async function loadItems(filterBy, { force = false } = {}) {
  const filter = filterBy || store.getState().itemModule.filterBy
  const filterChanged = JSON.stringify(filter) !== JSON.stringify(_lastFilter)
  if (!force && !filterChanged && Date.now() - _lastFetchAt < STALE_MS && store.getState().itemModule.items.length) {
    return
  }
  try {
    store.dispatch(setIsLoading(true))
    const result = await itemService.query(filter)
    _lastFetchAt = Date.now()
    _lastFilter = { ...filter }
    if (Array.isArray(result)) {
      store.dispatch(setItems(result))
      store.dispatch(setMaxPage(0))
    } else {
      store.dispatch(setItems(result.items || []))
      store.dispatch(setMaxPage(result.maxPage || 0))
    }
  } catch (error) {
    store.dispatch(setError('Failed to load items'))
    store.dispatch(setItems([]))
    throw error
  } finally {
    store.dispatch(setIsLoading(false))
  }
}

export async function removeItem(itemId) {
  try {
    await itemService.remove(itemId)
    store.dispatch(removeItemAction(itemId))
  } catch (error) {
    store.dispatch(setError('Failed to remove item'))
    throw error
  }
}

export async function saveItem(item) {
  try {
    const savedItem = await itemService.save(item)
    if (item._id) {
      store.dispatch(updateItemAction(savedItem))
    } else {
      store.dispatch(addItemAction(savedItem))
    }
    return savedItem
  } catch (error) {
    store.dispatch(setError('Failed to save item'))
    throw error
  }
}

export function setFilterBy(filterBy = itemService.getDefaultFilter()) {
  store.dispatch(setFilterByAction(filterBy))
}
