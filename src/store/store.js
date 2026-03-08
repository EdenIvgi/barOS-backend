import { configureStore } from '@reduxjs/toolkit'
import { userReducer } from './slices/user.slice'
import { categoryReducer } from './slices/category.slice'
import { itemReducer } from './slices/item.slice'
import { orderReducer } from './slices/order.slice'
export const store = configureStore({
  reducer: {
    userModule: userReducer,
    categoryModule: categoryReducer,
    itemModule: itemReducer,
    orderModule: orderReducer,
  },
})

if (import.meta.env.DEV) {
  window.gStore = store
}
