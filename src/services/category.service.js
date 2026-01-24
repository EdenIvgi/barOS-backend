import { httpService } from './http.service'

const BASE_URL = 'category/'

export const categoryService = {
  query,
  getById,
  save,
  remove,
  getEmptyCategory,
}

async function query() {
  return httpService.get(BASE_URL)
}

async function getById(categoryId) {
  return httpService.get(BASE_URL + categoryId)
}

async function remove(categoryId) {
  return httpService.delete(BASE_URL + categoryId)
}

async function save(category) {
  if (category._id) {
    return httpService.put(BASE_URL, category)
  } else {
    return httpService.post(BASE_URL, category)
  }
}

function getEmptyCategory() {
  return {
    name: '',
    nameEn: '',
    icon: '',
    order: 0,
    isActive: true,
  }
}
