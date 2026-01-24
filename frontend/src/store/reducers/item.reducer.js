import { itemService } from '../../services/item.service'

export const SET_ITEMS = 'SET_ITEMS'
export const REMOVE_ITEM = 'REMOVE_ITEM'
export const ADD_ITEM = 'ADD_ITEM'
export const UPDATE_ITEM = 'UPDATE_ITEM'

export const SET_MAX_PAGE = 'SET_MAX_PAGE'
export const SET_FILTER_BY = 'SET_FILTER_BY'
export const SET_IS_LOADING = 'SET_IS_LOADING'
export const SET_ERROR = 'SET_ERROR'

const initialState = {
  items: [],
  filterBy: itemService.getDefaultFilter(),
  flag: {
    isLoading: false,
    error: null,
  },
  maxPage: 0,
}

export function itemReducer(state = initialState, action = {}) {
  let items
  switch (action.type) {
    case SET_ITEMS:
      return { ...state, items: action.items }

    case REMOVE_ITEM:
      items = state.items.filter((item) => item._id !== action.itemId)
      return { ...state, items }

    case ADD_ITEM:
      items = [...state.items, action.item]
      return { ...state, items }

    case UPDATE_ITEM:
      items = state.items.map((item) =>
        item._id === action.item._id ? action.item : item
      )
      return { ...state, items }

    case SET_MAX_PAGE:
      return { ...state, maxPage: action.maxPage }

    case SET_FILTER_BY:
      return { ...state, filterBy: { ...state.filterBy, ...action.filterBy } }

    case SET_IS_LOADING:
      return {
        ...state,
        flag: { ...state.flag, isLoading: action.isLoading },
      }

    case SET_ERROR:
      return { ...state, flag: { ...state.flag, error: action.error } }

    default:
      return state
  }
}
