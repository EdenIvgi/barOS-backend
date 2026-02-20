import { configureStore } from '@reduxjs/toolkit'
import { userReducer } from './slices/user.slice'
import { reviewReducer } from './slices/review.slice'
import { categoryReducer } from './slices/category.slice'
import { itemReducer } from './slices/item.slice'
import { orderReducer } from './slices/order.slice'
import { recipeReducer } from './slices/recipe.slice'

export const store = configureStore({
  reducer: {
    userModule: userReducer,
    reviewModule: reviewReducer,
    categoryModule: categoryReducer,
    itemModule: itemReducer,
    orderModule: orderReducer,
    recipeModule: recipeReducer,
  },
})

if (import.meta.env.DEV) {
  window.gStore = store
}
