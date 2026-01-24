import { httpService } from './http.service'
import { userService } from './user.service'

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
  const user = userService.getLoggedInUser()
  const reviewData = { txt, aboutItemId }
  if (user && user._id) {
    reviewData.byUserId = user._id
  }
  return await httpService.post(BASE_URL, reviewData)
}
