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
import { UserDetails } from './pages/UserDetails'
import { MenuPage } from './pages/MenuPage'
import { ItemDetails } from './pages/ItemDetails'
import { OrderPage } from './pages/OrderPage'
import { OrdersListPage } from './pages/OrdersListPage'
import { ItemsManagementPage } from './pages/ItemsManagementPage'
import { RecipesPage } from './pages/RecipesPage'
import { store } from './store/store'
import { loadCartFromStorage } from './store/actions/order.actions'
import { initLocalData } from './services/localData'

export function App() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)

  useEffect(() => {
    // Initialize demo data in localStorage if empty
    initLocalData()
    // Load cart from localStorage on app start
    loadCartFromStorage()
  }, [])

  return (
    <Provider store={store}>
      <Router>
        <section className={`main-layout app ${isSidebarExpanded ? 'sidebar-expanded' : ''}`}>
          <Sidebar isExpanded={isSidebarExpanded} />
          <div className="main-content">
            <AppHeader
              isSidebarExpanded={isSidebarExpanded}
              onToggleSidebar={() => setIsSidebarExpanded(prev => !prev)}
            />
            <main>
              <Routes>
                <Route element={<HomePage />} path="/" />
                <Route element={<About />} path="/about" />
                <Route element={<UserDetails />} path="/user" />
                <Route element={<MenuPage />} path="/products" />
                <Route element={<ItemDetails />} path="/products/:itemId" />
                <Route element={<OrderPage />} path="/order" />
                <Route element={<OrdersListPage />} path="/orders" />
                <Route element={<ItemsManagementPage />} path="/items-management" />
                <Route element={<RecipesPage />} path="/recipes" />
              </Routes>
            </main>
            <AppFooter />
          </div>
        </section>
      </Router>
      <UserMsg />
    </Provider>
  )
}
