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

  return (
    <header className="app-header">
      <div className="header-content">
        <NavLink to="/home" className="header-brand">
          <span className="logo">BarOS</span>
        </NavLink>

        <nav className="header-nav">
          <NavLink to="/home" className="nav-link">{t('home')}</NavLink>
          <NavLink to="/products" className="nav-link">{t('products')}</NavLink>
          <NavLink to="/bar-book" className="nav-link">{t('barBook')}</NavLink>
          <NavLink to="/orders" className="nav-link">{t('orders')}</NavLink>
          <NavLink to="/order" className="nav-link">{t('cart')}</NavLink>
          <NavLink to="/items-management" className="nav-link">{t('itemsManagement')}</NavLink>
          {user && <NavLink to="/user" className="nav-link">{t('profile')}</NavLink>}
          <NavLink to="/about" className="nav-link">{t('about')}</NavLink>
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
