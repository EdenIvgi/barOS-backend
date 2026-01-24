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
            <div key={order._id} className="order-card" style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {order && order.createdAt && (
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.1em',
                    color: '#2c3e50',
                    fontWeight: '600'
                  }}>
                    תאריך: {new Date(order.createdAt).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {editingOrder === order._id ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(order)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.9em'
                        }}
                      >
                        שמור
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.9em'
                        }}
                      >
                        ביטול
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(order)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.9em'
                        }}
                      >
                        ✏️ ערוך
                      </button>
                      <button
                        onClick={() => handleDelete(order._id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.9em'
                        }}
                      >
                        🗑️ מחק
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {order.items && order.items.length > 0 ? (
                <div className="order-items">
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr style={{
                        borderBottom: '2px solid #2c3e50'
                      }}>
                        <th style={{
                          textAlign: 'right',
                          padding: '0.75rem',
                          fontWeight: 'bold',
                          color: '#2c3e50',
                          fontSize: '1em'
                        }}>
                          שם הפריט
                        </th>
                        <th style={{
                          textAlign: 'center',
                          padding: '0.75rem',
                          fontWeight: 'bold',
                          color: '#2c3e50',
                          fontSize: '1em',
                          width: '120px'
                        }}>
                          כמות
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr 
                          key={index}
                          style={{
                            borderBottom: index < order.items.length - 1 ? '1px solid #f0f0f0' : 'none'
                          }}
                        >
                          <td style={{
                            textAlign: 'right',
                            padding: '0.75rem',
                            fontSize: '1em',
                            color: '#333'
                          }}>
                            {item.name || `פריט ${index + 1}`}
                          </td>
                          <td style={{
                            textAlign: 'center',
                            padding: '0.75rem',
                            fontWeight: 'bold',
                            color: '#2c3e50',
                            fontSize: '1.1em'
                          }}>
                            {editingOrder === order._id ? (
                              <input
                                type="number"
                                min="0"
                                value={editingQuantities[index] || 0}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                style={{
                                  width: '80px',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: '2px solid #007bff',
                                  textAlign: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '1em'
                                }}
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
                <p style={{ color: '#999', textAlign: 'center', padding: '1rem' }}>
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
