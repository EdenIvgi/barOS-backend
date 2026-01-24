import {
  SET_ORDERS,
  SET_CART,
  ADD_TO_CART,
  REMOVE_FROM_CART,
  UPDATE_CART_ITEM,
  CLEAR_CART,
  SET_IS_LOADING,
  SET_ERROR,
} from '../reducers/order.reducer'
import { store } from '../store'
import { asyncStorageService } from '../../services/async-storage.service'

const STORAGE_KEY = 'cart'

export function addToCart(item, quantity = 1) {
  store.dispatch({ type: ADD_TO_CART, item, quantity })
  saveCartToStorage()
}

export function removeFromCart(itemId) {
  store.dispatch({ type: REMOVE_FROM_CART, itemId })
  saveCartToStorage()
}

export function updateCartItem(itemId, quantity) {
  store.dispatch({ type: UPDATE_CART_ITEM, itemId, quantity })
  saveCartToStorage()
}

export function clearCart() {
  store.dispatch({ type: CLEAR_CART })
  asyncStorageService.remove(STORAGE_KEY)
}

export function loadCartFromStorage() {
  try {
    const cart = asyncStorageService.load(STORAGE_KEY) || []
    store.dispatch({ type: SET_CART, cart })
  } catch (error) {
    console.error('Failed to load cart from storage:', error)
  }
}

function saveCartToStorage() {
  try {
    const cart = store.getState().orderModule.cart
    asyncStorageService.save(STORAGE_KEY, cart)
  } catch (error) {
    console.error('Failed to save cart to storage:', error)
  }
}

export async function loadOrders(filterBy) {
  try {
    store.dispatch({ type: SET_IS_LOADING, isLoading: true })
    // TODO: Implement order service
    // const orders = await orderService.query(filterBy)
    // store.dispatch({ type: SET_ORDERS, orders })
  } catch (error) {
    store.dispatch({ type: SET_ERROR, error: 'Failed to load orders' })
    throw error
  } finally {
    store.dispatch({ type: SET_IS_LOADING, isLoading: false })
  }
}
