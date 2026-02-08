import {
  combineReducers,
  compose,
  legacy_createStore as createStore,
} from 'redux'
import { userReducer } from './reducers/user.reducer.js'
import { reviewReducer } from './reducers/review.reducer.js'
import { categoryReducer } from './reducers/category.reducer.js'
import { itemReducer } from './reducers/item.reducer.js'
import { orderReducer } from './reducers/order.reducer.js'
import { recipeReducer } from './reducers/recipe.reducer.js'

const rootReducer = combineReducers({
  userModule: userReducer,
  reviewModule: reviewReducer,
  categoryModule: categoryReducer,
  itemModule: itemReducer,
  orderModule: orderReducer,
  recipeModule: recipeReducer,
})

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export const store = createStore(rootReducer, composeEnhancers())

window.gStore = store
