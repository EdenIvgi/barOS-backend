import { httpService } from './http.service'

const BASE_URL = 'recipe/'

export const recipeService = {
  query,
  getById,
  save,
  remove
}

async function query() {
  return httpService.get(BASE_URL)
}

async function getById(recipeId) {
  return httpService.get(`${BASE_URL}${recipeId}`)
}

async function save(recipe) {
  if (recipe._id) {
    return httpService.put(`${BASE_URL}${recipe._id}`, recipe)
  }
  return httpService.post(BASE_URL, recipe)
}

async function remove(recipeId) {
  return httpService.delete(`${BASE_URL}${recipeId}`)
}
