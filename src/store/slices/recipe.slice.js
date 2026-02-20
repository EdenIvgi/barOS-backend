import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  recipes: [],
  flag: { isLoading: false, error: null },
}

const recipeSlice = createSlice({
  name: 'recipe',
  initialState,
  reducers: {
    setRecipes(state, action) {
      state.recipes = action.payload
    },
    addRecipe(state, action) {
      state.recipes = [action.payload, ...state.recipes]
    },
    updateRecipe(state, action) {
      state.recipes = state.recipes.map((r) =>
        r._id === action.payload._id ? action.payload : r
      )
    },
    removeRecipe(state, action) {
      state.recipes = state.recipes.filter((r) => r._id !== action.payload)
    },
    setIsLoading(state, action) {
      state.flag.isLoading = action.payload
    },
    setError(state, action) {
      state.flag.error = action.payload
    },
  },
})

export const {
  setRecipes,
  addRecipe,
  updateRecipe,
  removeRecipe,
  setIsLoading,
  setError,
} = recipeSlice.actions

export const recipeReducer = recipeSlice.reducer
