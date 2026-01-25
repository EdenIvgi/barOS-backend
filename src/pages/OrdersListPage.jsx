import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { loadOrders, removeOrder, updateOrder } from '../store/actions/order.actions'
import { Loader } from '../cmps/Loader'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'

export function OrdersListPage() {
  const orders = useSelector((storeState) => storeState.orderModule.orders)
  const isLoading = useSelector((storeState) => storeState.orderModule.flag.isLoading)
  const [editingOrder, setEditingOrder] = useState(null)
  const [editingQuantities, setEditingQuantities] = useState({})

  useEffect(() => {
    loadOrders()
  }, [])

  async function handleDelete(orderId) {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את ההזמנה?')) {
      return
    }

    try {
      await removeOrder(orderId)
      showSuccessMsg('ההזמנה נמחקה בהצלחה')
    } catch (error) {
      showErrorMsg('שגיאה במחיקת ההזמנה')
    }
  }

  function handleEdit(order) {
    setEditingOrder(order._id)
    const quantities = {}
    order.items.forEach((item, index) => {
      quantities[index] = item.quantity || 0
    })
    setEditingQuantities(quantities)
  }

  function handleCancelEdit() {
    setEditingOrder(null)
    setEditingQuantities({})
  }

  function handleQuantityChange(itemIndex, newQuantity) {
    setEditingQuantities(prev => ({
      ...prev,
      [itemIndex]: Math.max(0, Number(newQuantity) || 0)
    }))
  }

  async function handleSaveEdit(order) {
    try {
      const updatedItems = order.items.map((item, index) => ({
        ...item,
        quantity: editingQuantities[index] || 0,
        subtotal: (item.price || 0) * (editingQuantities[index] || 0)
      }))

      const updatedOrder = {
        ...order,
        items: updatedItems
      }

      const result = await updateOrder(updatedOrder)
      if (result) {
        showSuccessMsg('ההזמנה עודכנה בהצלחה')
        setEditingOrder(null)
        setEditingQuantities({})
      } else {
        showErrorMsg('שגיאה בעדכון ההזמנה - נטען מחדש')
        await loadOrders()
      }
    } catch (error) {
      showErrorMsg('שגיאה בעדכון ההזמנה')
      await loadOrders()
    }
  }

  if (isLoading) return <Loader />

  return (
    <div className="orders-list-page">
      <h1>רשימת הזמנות</h1>
      {orders.length === 0 ? (
        <p>אין הזמנות</p>
      ) : (
        <div className="orders-list">
          {orders.filter(order => order !== null && order !== undefined).map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                {order && order.createdAt && (
                  <h3>
                    תאריך: {new Date(order.createdAt).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                )}
                <div className="order-actions">
                  {editingOrder === order._id ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(order)}
                        className="btn-save"
                      >
                        שמור
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="btn-cancel"
                      >
                        ביטול
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(order)}
                        className="btn-edit"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.333 2.00001C11.5084 1.82445 11.7163 1.68506 11.9447 1.59123C12.1731 1.4974 12.4173 1.45117 12.6637 1.45534C12.9101 1.45951 13.1523 1.51398 13.3763 1.61538C13.6003 1.71678 13.8012 1.8628 13.9667 2.04445C14.1321 2.2261 14.2585 2.43937 14.3384 2.67091C14.4182 2.90245 14.4497 3.14762 14.4307 3.39068C14.4117 3.63374 14.3426 3.86975 14.2277 4.08334L6.12001 13.3333L2.00001 14L2.66668 9.88001L10.7733 0.63001C10.8882 0.416421 11.0439 0.228215 11.2313 0.0764062C11.4187 -0.0754026 11.6339 -0.188281 11.8637 -0.25534C12.0935 -0.322399 12.3333 -0.342399 12.57 -0.31423C12.8067 -0.286061 13.0353 -0.21023 13.24 -0.09134L11.333 2.00001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        ערוך
                      </button>
                      <button
                        onClick={() => handleDelete(order._id)}
                        className="btn-delete"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 4H14M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4M6.66667 7.33333V11.3333M9.33333 7.33333V11.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        מחק
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {order.items && order.items.length > 0 ? (
                <div className="order-items">
                  <table>
                    <thead>
                      <tr>
                        <th>שם הפריט</th>
                        <th>כמות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            {item.name || `פריט ${index + 1}`}
                          </td>
                          <td>
                            {editingOrder === order._id ? (
                              <input
                                type="number"
                                min="0"
                                value={editingQuantities[index] || 0}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                              />
                            ) : (
                              item.quantity || 0
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-message">
                  אין פריטים בהזמנה זו
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
