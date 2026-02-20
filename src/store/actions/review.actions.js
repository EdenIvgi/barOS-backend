import { reviewService } from '../../services/review.service'
import { setReviews, addReview as addReviewAction, removeReview as removeReviewAction } from '../slices/review.slice'
import { store } from '../store'

export async function loadReviews(filterBy = {}) {
  try {
    const reviews = await reviewService.query(filterBy)
    store.dispatch(setReviews(reviews))
  } catch {
    store.dispatch(setReviews([]))
  }
}

export async function addReview(review) {
  try {
    const addedReview = await reviewService.add(review)
    store.dispatch(addReviewAction(addedReview))
  } catch (err) {
    console.error('ReviewActions: err in addReview', err)
    throw err
  }
}

export async function removeReview(reviewId) {
  try {
    await reviewService.remove(reviewId)
    store.dispatch(removeReviewAction(reviewId))
  } catch (err) {
    console.error('ReviewActions: err in removeReview', err)
    throw err
  }
}
