import { Link } from 'react-router-dom'

export function ReviewPreview({ review }) {
  const { byUser, aboutItem } = review

  return (
    <article className="preview review-preview">
      <p>
        About:{' '}
        <Link className="about" to={`/menu/${aboutItem?._id || ''}`}>
          {aboutItem?.name || 'Item'}
        </Link>
      </p>
      <p className="review-by">By: {byUser?.fullname || 'Unknown'}</p>
      <pre className="review-txt">{review.txt}</pre>
      {review.createdAt && (
        <section className="created-at">
          <h4>Created At:</h4>
          {new Date(review.createdAt).toLocaleString('he')}
        </section>
      )}
    </article>
  )
}
