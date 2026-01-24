import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { itemService } from '../services/item.service'
import { Loader } from '../cmps/Loader'
import { showErrorMsg } from '../services/event-bus.service'
import { addToCart } from '../store/actions/order.actions'

export function ItemDetails() {
  const { itemId } = useParams()
  const dispatch = useDispatch()
  const [item, setItem] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    loadItem()
  }, [itemId])

  async function loadItem() {
    try {
      setIsLoading(true)
      const loadedItem = await itemService.getById(itemId)
      setItem(loadedItem)
    } catch (error) {
      showErrorMsg('Cannot load item details')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <Loader />

  function handleAddToCart() {
    dispatch(addToCart(item, quantity))
  }

  if (!item) {
    return <div className="item-details">Item not found</div>
  }

  return (
    <section className="item-details">
      <div className="item-details-container">
        {item.imageUrl && (
          <img src={item.imageUrl} alt={item.name} className="item-detail-image" />
        )}
        <div className="item-details-info">
          <h1 className="item-detail-name">{item.name}</h1>
          {item.description && (
            <p className="item-detail-description">{item.description}</p>
          )}
          <div className="item-detail-price">₪{item.price}</div>
          <div
            className={`item-detail-availability ${
              item.isAvailable ? 'available' : 'unavailable'
            }`}
          >
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </div>
          {item.stockQuantity > 0 && (
            <div className="item-detail-stock">
              Stock: {item.stockQuantity}
            </div>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="item-detail-tags">
              {item.tags.map((tag, idx) => (
                <span key={idx} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {item.isAvailable && (
            <div className="item-detail-actions">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={item.stockQuantity > 0 ? item.stockQuantity : undefined}
                  value={quantity}
                  onChange={(ev) => setQuantity(+ev.target.value)}
                  className="quantity-input"
                />
              </div>
              <button onClick={handleAddToCart} className="btn-add-to-cart-large">
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
