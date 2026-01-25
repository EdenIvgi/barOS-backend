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

  const lowStockItems = items?.filter(item => {
    const stock = item.stockQuantity || 0
    const minLevel = item.minStockLevel || 0
    return stock <= minLevel && stock > 0
  }) || []

  return (
    <section className="home-page">

      {/* Dashboard Statistics */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{stats.totalItems}</h3>
          <p>סה"כ מוצרים</p>
        </div>

        <div className="stat-card">
          <h3>{stats.availableItems}</h3>
          <p>מוצרים זמינים</p>
        </div>

        <div className="stat-card">
          <h3>{stats.lowStockItems}</h3>
          <p>מלאי נמוך</p>
        </div>

        <div className="stat-card">
          <h3>{stats.totalOrders}</h3>
          <p>סה"כ הזמנות</p>
        </div>

        <div className="stat-card">
          <h3>{stats.pendingOrders}</h3>
          <p>הזמנות ממתינות</p>
        </div>

        <div className="stat-card">
          <h3>₪{stats.todayRevenue.toFixed(2)}</h3>
          <p>הכנסות היום</p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {stats.lowStockItems > 0 && (
        <div className="low-stock-alerts">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            התראות מלאי נמוך ({stats.lowStockItems})
          </h2>
          <div className="alerts-grid">
            {lowStockItems
              .slice(0, 6)
              .map(item => (
                <Link
                  key={item._id}
                  to="/items-management"
                  className="alert-item"
                >
                  <div className="item-name">{item.name}</div>
                  <div className="item-details">
                    מלאי: {item.stockQuantity || 0} | רף התראה: {item.minStockLevel || 0}
                  </div>
                </Link>
              ))}
          </div>
          {stats.lowStockItems > 6 && (
            <div style={{ textAlign: 'center' }}>
              <Link
                to="/items-management"
                className="view-all-link"
              >
                צפה בכל המוצרים עם מלאי נמוך ({stats.lowStockItems})
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Recent Orders */}
      {orders && orders.length > 0 && (
        <div className="recent-orders">
          <div className="section-header">
            <h2>הזמנות אחרונות</h2>
            <Link
              to="/orders"
              className="view-all-link"
            >
              צפה בהכל →
            </Link>
          </div>
          <div className="orders-list">
            {orders
              .slice(0, 5)
              .map(order => (
                <Link
                  key={order._id}
                  to="/orders"
                  className="order-item"
                >
                  <div className="order-content">
                    <div className="order-info">
                      <div className="order-id">
                        הזמנה #{order._id?.toString().slice(-6) || 'N/A'}
                      </div>
                      <div className="order-date">
                        {order.createdAt && new Date(order.createdAt).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {order.items && order.items.length > 0 && (
                        <div className="order-items-count">
                          {order.items.length} פריטים
                        </div>
                      )}
                    </div>
                    <div className={`order-status ${order.status || 'pending'}`}>
                      {order.status || 'pending'}
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="quick-links">
        <Link
          to="/products"
          className="quick-link"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          מוצרים
        </Link>

        <Link
          to="/items-management"
          className="quick-link"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.4829L13.5578 4.36974L12.9353 2H11.0647L10.4422 4.36974L7.73526 5.4829L6 4L4 6L5.47526 7.7448L4.37764 10.3954L2 11.2361L2 12.7639L4.37764 13.6046L5.47526 16.2552L4 18L6 20L7.73526 18.5171L10.4422 19.6303L11.0647 22H12.9353L13.5578 19.6303L16.2647 18.5171L18 20L20 18L18.5247 16.2552L19.6224 13.6046L22 12.7639V11.2361L19.6224 10.3954Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          ניהול מוצרים
        </Link>

        <Link
          to="/orders"
          className="quick-link"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          הזמנות
        </Link>

        <Link
          to="/order"
          className="quick-link"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="21" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="20" cy="21" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 1H4L6.68 13.39C6.77144 13.8504 7.02191 14.264 7.38755 14.5583C7.75318 14.8526 8.2107 15.009 8.68 15H19C19.5304 15 20.0391 14.7893 20.4142 14.4142C20.7893 14.0391 21 13.5304 21 13H8.68" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          עגלת קניות
        </Link>
      </div>
    </section>
  )
}
