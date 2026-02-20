import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  categories: [],
  flag: { isLoading: false, error: null },
}

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    setCategories(state, action) {
      state.categories = action.payload
    },
    setIsLoading(state, action) {
      state.flag.isLoading = action.payload
    },
    setError(state, action) {
      state.flag.error = action.payload
    },
  },
})

export const { setCategories, setIsLoading, setError } = categorySlice.actions
export const categoryReducer = categorySlice.reducer
