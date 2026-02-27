import { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './assets/style/main.scss'

import { AppFooter } from './cmps/AppFooter'
import { AppHeader } from './cmps/AppHeader'
import { Sidebar } from './cmps/Sidebar'
import { UserMsg } from './cmps/UserMsg'
import { About } from './pages/About'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'
import { UserDetails } from './pages/UserDetails'
import { MenuPage } from './pages/MenuPage'
import { ItemDetails } from './pages/ItemDetails'
import { OrderPage } from './pages/OrderPage'
import { OrdersListPage } from './pages/OrdersListPage'
import { ItemsManagementPage } from './pages/ItemsManagementPage'
import { BarBookPage } from './pages/BarBookPage'
import { ProtectedRoute } from './cmps/ProtectedRoute'
import { store } from './store/store'
import { loadCartFromStorage } from './store/actions/order.actions'

function AppLayout() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)

  useEffect(() => {
    loadCartFromStorage()
  }, [])

  return (
    <section className={`main-layout app ${isSidebarExpanded ? 'sidebar-expanded' : ''}`}>
      <Sidebar
        isExpanded={isSidebarExpanded}
        onHover={() => setIsSidebarExpanded(true)}
        onLeave={() => setIsSidebarExpanded(false)}
      />
      <div className="main-content">
        <AppHeader
          isSidebarExpanded={isSidebarExpanded}
          onToggleSidebar={() => setIsSidebarExpanded(prev => !prev)}
        />
        <main>
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/about" element={<About />} />
            <Route element={<ProtectedRoute><UserDetails /></ProtectedRoute>} path="/user" />
            <Route element={<MenuPage />} path="/products" />
            <Route element={<ItemDetails />} path="/products/:itemId" />
            <Route element={<ProtectedRoute><OrderPage /></ProtectedRoute>} path="/order" />
            <Route element={<ProtectedRoute><OrdersListPage /></ProtectedRoute>} path="/orders" />
            <Route element={<ProtectedRoute><ItemsManagementPage /></ProtectedRoute>} path="/items-management" />
            <Route element={<ProtectedRoute><BarBookPage /></ProtectedRoute>} path="/bar-book" />
          </Routes>
        </main>
        <AppFooter />
      </div>
    </section>
  )
}

export function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
        <UserMsg />
      </Router>
    </Provider>
  )
}
