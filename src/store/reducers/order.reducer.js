export const SET_ORDERS = 'SET_ORDERS'
export const SET_CART = 'SET_CART'
export const ADD_TO_CART = 'ADD_TO_CART'
export const REMOVE_FROM_CART = 'REMOVE_FROM_CART'
export const UPDATE_CART_ITEM = 'UPDATE_CART_ITEM'
export const CLEAR_CART = 'CLEAR_CART'
export const SET_IS_LOADING = 'SET_IS_LOADING'
export const SET_ERROR = 'SET_ERROR'

const initialState = {
  orders: [],
  cart: [],
  flag: {
    isLoading: false,
    error: null,
  },
}

export function orderReducer(state = initialState, action = {}) {
  let cart
  switch (action.type) {
    case SET_ORDERS:
      return { ...state, orders: action.orders }

    case SET_CART:
      return { ...state, cart: action.cart }

    case ADD_TO_CART:
      cart = [...state.cart]
      const existingItem = cart.find((item) => item.itemId === action.item._id)
      if (existingItem) {
        existingItem.quantity += action.quantity || 1
      } else {
        cart.push({
          itemId: action.item._id,
          itemName: action.item.name,
          price: action.item.price,
          quantity: action.quantity || 1,
          subtotal: action.item.price * (action.quantity || 1),
          supplier: action.item.supplier || '',
        })
      }
      return { ...state, cart }

    case REMOVE_FROM_CART:
      cart = state.cart.filter((item) => item.itemId !== action.itemId)
      return { ...state, cart }

    case UPDATE_CART_ITEM:
      cart = state.cart.map((item) =>
        item.itemId === action.itemId
          ? { ...item, quantity: action.quantity, subtotal: item.price * action.quantity }
          : item
      )
      return { ...state, cart }

    case CLEAR_CART:
      return { ...state, cart: [] }

    case SET_IS_LOADING:
      return { ...state, flag: { ...state.flag, isLoading: action.isLoading } }

    case SET_ERROR:
      return { ...state, flag: { ...state.flag, error: action.error } }

    default:
      return state
  }
}
