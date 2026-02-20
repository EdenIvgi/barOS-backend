import {
  setOrders as setOrdersAction,
  setCart as setCartAction,
  addToCart as addToCartAction,
  removeFromCart as removeFromCartAction,
  updateCartItem as updateCartItemAction,
  clearCart as clearCartAction,
  setIsLoading,
  setError,
} from '../slices/order.slice'
import { store } from '../store'
import { asyncStorageService } from '../../services/async-storage.service'
import { orderService } from '../../services/order.service'
import { showSuccessMsg, showErrorMsg } from '../../services/event-bus.service'

const STORAGE_KEY = 'cart'
const NO_SUPPLIER = 'ללא ספק'

export function addToCart(item, quantity = 1) {
  store.dispatch(addToCartAction({ item, quantity }))
  saveCartToStorage()
}

export function removeFromCart(itemId) {
  store.dispatch(removeFromCartAction(itemId))
  saveCartToStorage()
}

export function updateCartItem(itemId, quantity) {
  store.dispatch(updateCartItemAction({ itemId, quantity }))
  saveCartToStorage()
}

export function clearCart() {
  store.dispatch(clearCartAction())
  asyncStorageService.remove(STORAGE_KEY)
}

export function loadCartFromStorage() {
  try {
    const cart = asyncStorageService.load(STORAGE_KEY) || []
    store.dispatch(setCartAction(cart))
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
    store.dispatch(setIsLoading(true))
    const orders = await orderService.query(filterBy)
    store.dispatch(setOrdersAction(orders))
  } catch (error) {
    store.dispatch(setError('Failed to load orders'))
    throw error
  } finally {
    store.dispatch(setIsLoading(false))
  }
}

export async function removeOrder(orderId) {
  try {
    await orderService.remove(orderId)
    const orders = store.getState().orderModule.orders
    store.dispatch(setOrdersAction(orders.filter((o) => o._id !== orderId)))
  } catch (error) {
    store.dispatch(setError('Failed to remove order'))
    throw error
  }
}

export async function updateOrder(order) {
  try {
    const updatedOrder = await orderService.save(order)
    if (!updatedOrder) {
      await loadOrders()
      return null
    }
    const orders = store.getState().orderModule.orders
    store.dispatch(
      setOrdersAction(
        orders
          .map((o) => (o._id === order._id ? updatedOrder : o))
          .filter(Boolean)
      )
    )
    return updatedOrder
  } catch (error) {
    store.dispatch(setError('Failed to update order'))
    await loadOrders()
    throw error
  }
}

export async function checkout() {
  const cart = store.getState().orderModule.cart
  if (!cart || cart.length === 0) {
    showErrorMsg('העגלה ריקה')
    return 0
  }

  const bySupplier = {}
  for (const item of cart) {
    const key =
      item.supplier != null && String(item.supplier).trim() !== ''
        ? String(item.supplier).trim()
        : NO_SUPPLIER
    if (!bySupplier[key]) bySupplier[key] = []
    bySupplier[key].push(item)
  }

  try {
    store.dispatch(setIsLoading(true))
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
    showSuccessMsg(
      created === 1
        ? 'ההזמנה נוצרה בהצלחה'
        : `נוצרו ${created} הזמנות בהצלחה (לפי ספק)`
    )
    return created
  } catch (error) {
    showErrorMsg('שגיאה ביצירת ההזמנות. נסה שוב.')
    throw error
  } finally {
    store.dispatch(setIsLoading(false))
  }
}
