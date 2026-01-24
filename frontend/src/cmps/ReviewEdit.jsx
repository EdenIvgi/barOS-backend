import { useState } from 'react'

import { addReview } from '../store/actions/review.actions'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'

export function ReviewEdit({ items }) {
  const [reviewToEdit, setReviewToEdit] = useState({ txt: '', aboutItemId: '' })

  function handleChange(ev) {
    const { name, value } = ev.target
    setReviewToEdit({ ...reviewToEdit, [name]: value })
  }

  async function onAddReview(ev) {
    ev.preventDefault()
    if (!reviewToEdit.txt || !reviewToEdit.aboutItemId)
      return alert('All fields are required')

    try {
      await addReview({ txt: reviewToEdit.txt, aboutItemId: reviewToEdit.aboutItemId })
      showSuccessMsg('Review added')
      setReviewToEdit({ txt: '', aboutItemId: '' })
    } catch (err) {
      showErrorMsg('Cannot add review')
    }
  }

  return (
    <form className="review-edit" onSubmit={onAddReview}>
      <select
        onChange={handleChange}
        value={reviewToEdit.aboutItemId}
        name="aboutItemId"
      >
        <option value="">Review about...</option>
        {items.map(item => (
          <option key={item._id} value={item._id}>
            {item.name}
          </option>
        ))}
      </select>
      <textarea
        name="txt"
        onChange={handleChange}
        value={reviewToEdit.txt}
      ></textarea>
      <button>Add</button>
    </form>
  )
}
