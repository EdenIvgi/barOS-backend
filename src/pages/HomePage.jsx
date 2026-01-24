import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { loadItems } from '../store/actions/item.actions'
import { loadOrders } from '../store/actions/order.actions'

export function HomePage() {
  const items = useSelector((storeState) => storeState.itemModule.items)
  const orders = useSelector((storeState) => storeState.orderModule.orders)

  useEffect(() => {
    loadItems()
    loadOrders()
  }, [])

  // Calculate statistics
  const stats = {
    totalItems: items?.length || 0,
    availableItems: items?.filter(item => item.isAvailable).length || 0,
    unavailableItems: items?.filter(item => !item.isAvailable).length || 0,
    lowStockItems: items?.filter(item => {
      const stock = item.stockQuantity || 0
      const minLevel = item.minStockLevel || 0
      return stock <= minLevel && stock > 0
    }).length || 0,
    outOfStockItems: items?.filter(item => (item.stockQuantity || 0) <= 0).length || 0,
    totalOrders: orders?.length || 0,
    pendingOrders: orders?.filter(order => order.status === 'pending').length || 0,
    todayOrders: orders?.filter(order => {
      if (!order.createdAt) return false
      const today = new Date()
      const orderDate = new Date(order.createdAt)
      return orderDate.toDateString() === today.toDateString()
    }).length || 0,
    todayRevenue: orders?.filter(order => {
      if (!order.createdAt) return false
      const today = new Date()
      const orderDate = new Date(order.createdAt)
      return orderDate.toDateString() === today.toDateString()
    }).reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0
  }

  return (
    <section className="home-page">
      <div className="hero-section">
        <h1>Welcome to Bar App</h1>
        <p>Your favorite bar management system</p>
      </div>

      {/* Dashboard Statistics */}
      <div className="dashboard-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        margin: '2rem 0',
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div className="stat-card" style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50', fontSize: '2rem' }}>{stats.totalItems}</h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>סה"כ מוצרים</p>
        </div>

        <div className="stat-card" style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#28a745', fontSize: '2rem' }}>{stats.availableItems}</h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>מוצרים זמינים</p>
        </div>

        <div className="stat-card" style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#dc3545', fontSize: '2rem' }}>{stats.lowStockItems}</h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>מלאי נמוך</p>
        </div>

        <div className="stat-card" style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#007bff', fontSize: '2rem' }}>{stats.totalOrders}</h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>סה"כ הזמנות</p>
        </div>

        <div className="stat-card" style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#ffc107', fontSize: '2rem' }}>{stats.pendingOrders}</h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>הזמנות ממתינות</p>
        </div>

        <div className="stat-card" style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#17a2b8', fontSize: '2rem' }}>₪{stats.todayRevenue.toFixed(2)}</h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>הכנסות היום</p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {stats.lowStockItems > 0 && (
        <div className="low-stock-alerts" style={{
          margin: '2rem 0',
          padding: '1.5rem',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          border: '2px solid #ffc107'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#856404', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚠️ התראות מלאי נמוך ({stats.lowStockItems})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {items
              .filter(item => {
                const stock = item.stockQuantity || 0
                const minLevel = item.minStockLevel || 0
                return stock <= minLevel && stock > 0
              })
              .slice(0, 6)
              .map(item => (
                <Link
                  key={item._id}
                  to="/items-management"
                  style={{
                    display: 'block',
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    color: 'inherit',
                    border: '1px solid #ffc107',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#856404' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    מלאי: {item.stockQuantity || 0} | רף התראה: {item.minStockLevel || 0}
                  </div>
                </Link>
              ))}
          </div>
          {stats.lowStockItems > 6 && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <Link
                to="/items-management"
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  background: '#ffc107',
                  color: '#856404',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}
              >
                צפה בכל המוצרים עם מלאי נמוך ({stats.lowStockItems})
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
