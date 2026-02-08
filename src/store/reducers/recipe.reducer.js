export const SET_RECIPES = 'SET_RECIPES'
export const ADD_RECIPE = 'ADD_RECIPE'
export const UPDATE_RECIPE = 'UPDATE_RECIPE'
export const REMOVE_RECIPE = 'REMOVE_RECIPE'
export const SET_IS_LOADING = 'SET_IS_LOADING'
export const SET_ERROR = 'SET_ERROR'

const initialState = {
  recipes: [],
  flag: {
    isLoading: false,
    error: null,
  },
}

export function recipeReducer(state = initialState, action = {}) {
  switch (action.type) {
    case SET_RECIPES:
      return { ...state, recipes: action.recipes }

    case ADD_RECIPE:
      return { ...state, recipes: [action.recipe, ...state.recipes] }

    case UPDATE_RECIPE:
      return {
        ...state,
        recipes: state.recipes.map((r) =>
          r._id === action.recipe._id ? action.recipe : r
        ),
      }

    case REMOVE_RECIPE:
      return {
        ...state,
        recipes: state.recipes.filter((r) => r._id !== action.recipeId),
      }

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
