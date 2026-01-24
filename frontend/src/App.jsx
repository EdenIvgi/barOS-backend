import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './assets/style/main.scss'

import { AppFooter } from './cmps/AppFooter'
import { AppHeader } from './cmps/AppHeader'
import { UserMsg } from './cmps/UserMsg'
import { About } from './pages/About'
import { HomePage } from './pages/HomePage'
import { ReviewIndex } from './pages/ReviewIndex'
import { UserDetails } from './pages/UserDetails'
import { MenuPage } from './pages/MenuPage'
import { ItemDetails } from './pages/ItemDetails'
import { OrderPage } from './pages/OrderPage'
import { OrdersListPage } from './pages/OrdersListPage'
import { InventoryPage } from './pages/InventoryPage'
import { store } from './store/store'
import { loadCartFromStorage } from './store/actions/order.actions'

export function App() {
  useEffect(() => {
    // Load cart from localStorage on app start
    loadCartFromStorage()
  }, [])

  return (
    <Provider store={store}>
      <Router>
        <section className="main-layout app">
          <AppHeader />
          <main>
            <Routes>
              <Route element={<HomePage />} path="/" />
              <Route element={<About />} path="/about" />
              <Route element={<ReviewIndex />} path="/review" />
              <Route element={<UserDetails />} path="/user" />
              <Route element={<MenuPage />} path="/menu" />
              <Route element={<ItemDetails />} path="/menu/:itemId" />
              <Route element={<OrderPage />} path="/order" />
              <Route element={<OrdersListPage />} path="/orders" />
              <Route element={<InventoryPage />} path="/inventory" />
            </Routes>
          </main>
          <AppFooter />
        </section>
      </Router>
      <UserMsg />
    </Provider>
  )
}
