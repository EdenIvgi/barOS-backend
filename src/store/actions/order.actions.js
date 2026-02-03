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
import { orderService } from '../../services/order.service'
import { showSuccessMsg, showErrorMsg } from '../../services/event-bus.service'

const STORAGE_KEY = 'cart'
const NO_SUPPLIER = 'ללא ספק'

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

export async function loadOrders(filterBy = {}) {
  try {
    store.dispatch({ type: SET_IS_LOADING, isLoading: true })
    const orders = await orderService.query(filterBy)
    store.dispatch({ type: SET_ORDERS, orders })
  } catch (error) {
    store.dispatch({ type: SET_ERROR, error: 'Failed to load orders' })
    throw error
  } finally {
    store.dispatch({ type: SET_IS_LOADING, isLoading: false })
  }
}

export async function removeOrder(orderId) {
  try {
    await orderService.remove(orderId)
    const orders = store.getState().orderModule.orders
    const updatedOrders = orders.filter(order => order._id !== orderId)
    store.dispatch({ type: SET_ORDERS, orders: updatedOrders })
  } catch (error) {
    store.dispatch({ type: SET_ERROR, error: 'Failed to remove order' })
    throw error
  }
}

export async function updateOrder(order) {
  try {
    const updatedOrder = await orderService.save(order)
    if (!updatedOrder) {
      // If update failed, reload all orders
      await loadOrders()
      return null
    }
    const orders = store.getState().orderModule.orders
    const updatedOrders = orders.map(o => {
      if (o._id === order._id) {
        return updatedOrder
      }
      return o
    }).filter(o => o !== null && o !== undefined) // Filter out null/undefined orders
    store.dispatch({ type: SET_ORDERS, orders: updatedOrders })
    return updatedOrder
  } catch (error) {
    store.dispatch({ type: SET_ERROR, error: 'Failed to update order' })
    // Reload orders on error
    await loadOrders()
    throw error
  }
}

/**
 * Group cart by supplier and create one order per supplier.
 * On success: clear cart, reload orders, show success. On failure: show error, keep cart.
 */
export async function checkout() {
  const cart = store.getState().orderModule.cart
  if (!cart || cart.length === 0) {
    showErrorMsg('העגלה ריקה')
    return 0
  }

  const bySupplier = {}
  for (const item of cart) {
    const key = item.supplier != null && String(item.supplier).trim() !== '' ? String(item.supplier).trim() : NO_SUPPLIER
    if (!bySupplier[key]) bySupplier[key] = []
    bySupplier[key].push(item)
  }

  try {
    store.dispatch({ type: SET_IS_LOADING, isLoading: true })
    let created = 0
    for (const [supplier, items] of Object.entries(bySupplier)) {
      const saved = await orderService.save({
        items: items.map(({ itemId, itemName, price, quantity, subtotal }) => ({
          itemId,
          name: itemName,
          price,
          quantity,
          subtotal,
        })),
        supplier: supplier || '',
        status: 'pending',
        type: 'stock_order',
      })
      if (saved) created++
    }
    clearCart()
    await loadOrders()
    showSuccessMsg(created === 1
      ? 'ההזמנה נוצרה בהצלחה'
      : `נוצרו ${created} הזמנות בהצלחה (לפי ספק)`)
    return created
  } catch (error) {
    showErrorMsg('שגיאה ביצירת ההזמנות. נסה שוב.')
    throw error
  } finally {
    store.dispatch({ type: SET_IS_LOADING, isLoading: false })
  }
}
