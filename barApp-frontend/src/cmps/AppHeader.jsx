import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { logout } from '../store/actions/user.actions'
import { CartIcon } from './CartIcon'

export function AppHeader() {
  const user = useSelector(storeState => storeState.userModule.loggedInUser)
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  function toggleLanguage() {
    const currentLang = i18n.resolvedLanguage || 'he'
    const nextLang = currentLang === 'en' ? 'he' : 'en'
    i18n.changeLanguage(nextLang)
  }

  function getLanguageLabel() {
    const currentLang = i18n.resolvedLanguage || 'he'
    return currentLang === 'en' ? 'EN' : 'HE'
  }

  async function onLogout() {
    try {
      await logout()
      showSuccessMsg(t('logoutSuccess'))
      navigate('/')
    } catch (error) {
      showErrorMsg('OOPs try again')
    }
  }

  function closeMenu() {
    setIsMenuOpen(false)
  }

  return (
    <header className="app-header">
      <div className="header-content">
        <NavLink to="/home" className="header-brand">
          <span className="logo">BarOS</span>
        </NavLink>

        <button
          className={`hamburger-btn ${isMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMenuOpen(prev => !prev)}
          aria-label="Toggle menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
          <NavLink to="/home" className="nav-link" onClick={closeMenu}>{t('home')}</NavLink>
          <NavLink to="/products" className="nav-link" onClick={closeMenu}>{t('products')}</NavLink>
          <NavLink to="/bar-book" className="nav-link" onClick={closeMenu}>{t('barBook')}</NavLink>
          <NavLink to="/orders" className="nav-link" onClick={closeMenu}>{t('orders')}</NavLink>
          <NavLink to="/order" className="nav-link" onClick={closeMenu}>{t('cart')}</NavLink>
          <NavLink to="/items-management" className="nav-link" onClick={closeMenu}>{t('itemsManagement')}</NavLink>
          {user && <NavLink to="/user" className="nav-link" onClick={closeMenu}>{t('profile')}</NavLink>}
          <NavLink to="/about" className="nav-link" onClick={closeMenu}>{t('about')}</NavLink>
        </nav>

        <div className="header-actions">
          <CartIcon />
          <button
            className="language-toggle-btn"
            onClick={toggleLanguage}
            title={t('toggleLanguage')}
          >
            {getLanguageLabel()}
          </button>
          {user ? (
            <div className="user-section">
              <Link to="/user" className="user-greeting">{t('hello')} {user.fullname}</Link>
              <button className="logout-btn" onClick={onLogout}>{t('logout')}</button>
            </div>
          ) : (
            <Link to="/" className="header-login-link">{t('landingLoginBtn')}</Link>
          )}
        </div>
      </div>
    </header>
  )
}
