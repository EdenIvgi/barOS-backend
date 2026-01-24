import { httpService } from './http.service'

const BASE_URL = 'review/'

export const reviewService = {
  add,
  query,
  remove,
}

function query(filterBy = {}) {
  return httpService.get(BASE_URL, filterBy)
}

async function remove(reviewId) {
  await httpService.delete(BASE_URL + reviewId)
}

async function add({ txt, aboutItemId }) {
  return await httpService.post(BASE_URL, { txt, aboutItemId })
}
