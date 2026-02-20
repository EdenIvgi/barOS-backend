import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  reviews: [],
}

const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    setReviews(state, action) {
      state.reviews = action.payload
    },
    addReview(state, action) {
      state.reviews = [...state.reviews, action.payload]
    },
    removeReview(state, action) {
      state.reviews = state.reviews.filter((r) => r._id !== action.payload)
    },
    updateReview(state, action) {
      state.reviews = state.reviews.map((r) =>
        r._id === action.payload._id ? action.payload : r
      )
    },
  },
})

export const { setReviews, addReview, removeReview, updateReview } = reviewSlice.actions
export const reviewReducer = reviewSlice.reducer
