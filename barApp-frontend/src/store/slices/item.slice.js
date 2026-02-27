import { createSlice } from '@reduxjs/toolkit'
import { itemService } from '../../services/item.service'

const initialState = {
  items: [],
  filterBy: itemService.getDefaultFilter(),
  flag: { isLoading: false, error: null },
  maxPage: 0,
}

const itemSlice = createSlice({
  name: 'item',
  initialState,
  reducers: {
    setItems(state, action) {
      state.items = action.payload
    },
    removeItem(state, action) {
      state.items = state.items.filter((item) => item._id !== action.payload)
    },
    addItem(state, action) {
      state.items = [...state.items, action.payload]
    },
    updateItem(state, action) {
      state.items = state.items.map((item) =>
        item._id === action.payload._id ? action.payload : item
      )
    },
    setMaxPage(state, action) {
      state.maxPage = action.payload
    },
    setFilterBy(state, action) {
      state.filterBy = { ...state.filterBy, ...action.payload }
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
  setItems,
  removeItem,
  addItem,
  updateItem,
  setMaxPage,
  setFilterBy,
  setIsLoading,
  setError,
} = itemSlice.actions

export const itemReducer = itemSlice.reducer
