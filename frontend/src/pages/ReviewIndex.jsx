import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { loadReviews, removeReview } from '../store/actions/review.actions'

import { ReviewEdit } from '../cmps/ReviewEdit'
import { ReviewList } from '../cmps/ReviewList'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { itemService } from '../services/item.service'
import { useState } from 'react'

export function ReviewIndex() {
  const user = useSelector(storeState => storeState.userModule.loggedInUser)
  const reviews = useSelector(storeState => storeState.reviewModule.reviews)

  const [items, setItems] = useState([])

  useEffect(() => {
    loadReviews()
    loadItems()
  }, [])

  async function loadItems() {
    try {
      const result = await itemService.query()
      setItems(result.items || [])
    } catch (error) {
      console.log('error:', error)
    }
  }

  async function onRemoveReview(reviewId) {
    try {
      await removeReview(reviewId)
      showSuccessMsg('Review removed')
    } catch (err) {
      showErrorMsg('Cannot remove')
    }
  }

  return (
    <div className="review-index">
      <h2>Reviews</h2>
      {user && <ReviewEdit items={items} />}
      {!!reviews.length && (
        <ReviewList reviews={reviews} onRemoveReview={onRemoveReview} />
      )}
    </div>
  )
}
