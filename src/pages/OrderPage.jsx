import { useSelector } from 'react-redux'
import { removeFromCart, updateCartItem, clearCart, checkout } from '../store/actions/order.actions'
import { Loader } from '../cmps/Loader'

export function OrderPage() {
  const cart = useSelector((storeState) => storeState.orderModule.cart)
  const isLoading = useSelector((storeState) => storeState.orderModule.flag.isLoading)

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0)

  function handleQuantityChange(itemId, newQuantity) {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
    } else {
      updateCartItem(itemId, newQuantity)
    }
  }

  async function handleCheckout() {
    await checkout()
  }

  if (isLoading) return <Loader />

  return (
    <div className="order-page">
      <h1>עגלת קניות</h1>
      {cart.length === 0 ? (
        <p>העגלה ריקה</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.itemId} className="cart-item">
                <h3>{item.itemName}</h3>
                {item.supplier && (
                  <p className="cart-item-supplier">ספק: {item.supplier}</p>
                )}
                <p>מחיר: ₪{item.price}</p>
                <div>
                  <label>
                    כמות:
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value))}
                    />
                  </label>
                </div>
                <p>סה"כ: ₪{item.subtotal}</p>
                <button onClick={() => removeFromCart(item.itemId)}>הסר</button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h2>סה"כ: ₪{totalAmount}</h2>
            <button onClick={handleCheckout} disabled={isLoading}>
              הזמן עכשיו (לפי ספק)
            </button>
            <button onClick={clearCart}>נקה עגלה</button>
          </div>
        </>
      )}
    </div>
  )
}
