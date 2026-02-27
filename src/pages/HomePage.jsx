import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { OrdersGrowthBySupplierChart } from '../cmps/OrdersGrowthBySupplierChart'
import { loadItems } from '../store/actions/item.actions'
import { loadOrders } from '../store/actions/order.actions'
import { barBookService } from '../services/barBook.service'

export function HomePage() {
  const { t, i18n } = useTranslation()
  const items = useSelector((storeState) => storeState.itemModule.items)
  const orders = useSelector((storeState) => storeState.orderModule.orders)
  const user = useSelector((storeState) => storeState.userModule.loggedInUser)
  const [barBookDailyTasks, setBarBookDailyTasks] = useState([])

  useEffect(() => {
    if (user) loadItems()
  }, [user])

  useEffect(() => {
    if (user) loadOrders()
  }, [user])

  useEffect(() => {
    if (!user) return
    barBookService
      .getContent()
      .then((data) => {
        const raw = Array.isArray(data?.dailyTasks) ? data.dailyTasks : []
        const tasks = raw.map((d) => ({
          day: d.day || '',
          task: typeof d.task !== 'undefined' ? String(d.task) : (Array.isArray(d.items) ? d.items.join('\n') : '')
        }))
        setBarBookDailyTasks(tasks)
      })
      .catch(() => setBarBookDailyTasks([]))
  }, [user])

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

  // משימה יומית מטבלת המשימות בספר הבר – התאמה לפי שם היום (כמו בטבלה: יום שני, יום שלישי...)
  const dayIndex = new Date().getDay()
  const dayNames = [t('day_0'), t('day_1'), t('day_2'), t('day_3'), t('day_4'), t('day_5'), t('day_6')]
  const todayNameKey = dayNames[dayIndex]
  const todayEntry = barBookDailyTasks.find(
    (entry) => (entry?.day || '').includes(todayNameKey)
  )
  const todayTask = todayEntry?.task?.trim() || null
  const displayDayName = t('dayPrefix') ? `${t('dayPrefix')} ${t('day_' + dayIndex)}` : t('day_' + dayIndex)

  return (
    <section className="home-page">

      {/* משימה יומית */}
      {todayTask && (
        <div className="daily-task-card">
          <div className="daily-task-header">
            <span className="daily-task-badge">{t('dailyTask')}</span>
            <span className="daily-task-day">{displayDayName}</span>
          </div>
          <p className="daily-task-text">{todayTask}</p>
        </div>
      )}

      {/* Dashboard Statistics */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{stats.totalItems}</h3>
          <p>{t('statTotalProducts')}</p>
        </div>

        <div className="stat-card">
          <h3>{stats.availableItems}</h3>
          <p>{t('statAvailableProducts')}</p>
        </div>

        <div className="stat-card">
          <h3>{stats.lowStockItems}</h3>
          <p>{t('statLowStock')}</p>
        </div>

        <div className="stat-card">
          <h3>{stats.totalOrders}</h3>
          <p>{t('statTotalOrders')}</p>
        </div>

        <div className="stat-card">
          <h3>{stats.pendingOrders}</h3>
          <p>{t('statPendingOrders')}</p>
        </div>

        <div className="stat-card">
          <h3>₪{stats.todayRevenue.toFixed(2)}</h3>
          <p>{t('statTodayRevenue')}</p>
        </div>
      </div>

      {/* Orders growth by supplier – uses same supplier logic as orders list, Y = order size (totalAmount) */}
      <OrdersGrowthBySupplierChart orders={orders} items={items} />

      {/* Low Stock Alerts */}
      {stats.lowStockItems > 0 && (
        <div className="low-stock-alerts">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('lowStockAlerts')} ({stats.lowStockItems})
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
                    {t('stockLabel')}: {item.stockQuantity || 0} | {t('alertThresholdLabel')}: {item.minStockLevel || 0}
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
                {t('viewAllLowStock')} ({stats.lowStockItems})
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Recent Orders */}
      {orders && orders.length > 0 && (
        <div className="recent-orders">
          <div className="section-header">
            <h2>{t('recentOrders')}</h2>
            <Link
              to="/orders"
              className="view-all-link"
            >
              {t('viewAll')} →
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
                        {t('orderId')} #{order._id?.toString().slice(-6) || 'N/A'}
                      </div>
                      <div className="order-date">
                        {order.createdAt && new Date(order.createdAt).toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-GB', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {order.items && order.items.length > 0 && (
                        <div className="order-items-count">
                          {order.items.length} {t('itemsCount')}
                        </div>
                      )}
                    </div>
                    <div className={`order-status ${order.status || 'pending'}`}>
                      {t('status_' + (order.status || 'pending'))}
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
          {t('products')}
        </Link>

        <Link
          to="/items-management"
          className="quick-link"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.4829L13.5578 4.36974L12.9353 2H11.0647L10.4422 4.36974L7.73526 5.4829L6 4L4 6L5.47526 7.7448L4.37764 10.3954L2 11.2361L2 12.7639L4.37764 13.6046L5.47526 16.2552L4 18L6 20L7.73526 18.5171L10.4422 19.6303L11.0647 22H12.9353L13.5578 19.6303L16.2647 18.5171L18 20L20 18L18.5247 16.2552L19.6224 13.6046L22 12.7639V11.2361L19.6224 10.3954Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t('itemsManagement')}
        </Link>

        <Link
          to="/orders"
          className="quick-link"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t('orders')}
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
          {t('cart')}
        </Link>
      </div>
    </section>
  )
}
