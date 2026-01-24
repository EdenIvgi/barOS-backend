import { useEffect } from 'react'
import { useSelector } from 'react-redux'
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
    </section>
  )
}
