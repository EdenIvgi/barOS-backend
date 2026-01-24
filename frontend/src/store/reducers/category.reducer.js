import { categoryService } from '../../services/category.service'

export const SET_CATEGORIES = 'SET_CATEGORIES'
export const SET_IS_LOADING = 'SET_IS_LOADING'
export const SET_ERROR = 'SET_ERROR'

const initialState = {
  categories: [],
  flag: {
    isLoading: false,
    error: null,
  },
}

export function categoryReducer(state = initialState, action = {}) {
  switch (action.type) {
    case SET_CATEGORIES:
      return { ...state, categories: action.categories }

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
