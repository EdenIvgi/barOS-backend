import { Link } from 'react-router-dom'
import { addToCart } from '../store/actions/order.actions'

export function ItemPreview({ item }) {
  function handleAddToCart(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    addToCart(item, 1)
  }

  return (
    <Link to={`/menu/${item._id}`}>
      <article className="item-preview flex flex-column align-center">
        {item.imageUrl && (
          <img src={item.imageUrl} alt={item.name} className="item-image" />
        )}
        <h2 className="item-name">{item.name}</h2>
        {item.description && (
          <p className="item-description">{item.description}</p>
        )}
        <div className="item-price">₪{item.price}</div>
        <div
          className={`item-availability ${item.isAvailable ? 'available' : 'unavailable'}`}
        >
          {item.isAvailable ? 'Available' : 'Unavailable'}
        </div>
        {item.stockQuantity > 0 && (
          <div className="item-stock">Stock: {item.stockQuantity}</div>
        )}
        {item.isAvailable && (
          <button
            onClick={handleAddToCart}
            className="btn-add-to-cart"
            title="Add to cart"
          >
            + Add to Cart
          </button>
        )}
      </article>
    </Link>
  )
}
