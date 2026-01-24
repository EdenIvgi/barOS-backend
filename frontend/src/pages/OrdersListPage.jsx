import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { loadOrders } from '../store/actions/order.actions'
import { Loader } from '../cmps/Loader'

export function OrdersListPage() {
  const orders = useSelector((storeState) => storeState.orderModule.orders)
  const isLoading = useSelector((storeState) => storeState.orderModule.flag.isLoading)

  useEffect(() => {
    loadOrders()
  }, [])

  if (isLoading) return <Loader />

  return (
    <div className="orders-list-page">
      <h1>רשימת הזמנות</h1>
      {orders.length === 0 ? (
        <p>אין הזמנות</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <h3>הזמנה #{order.orderNumber}</h3>
              <p>סטטוס: {order.status}</p>
              <p>סכום: ₪{order.totalAmount}</p>
              <p>תאריך: {new Date(order.createdAt).toLocaleDateString('he-IL')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
