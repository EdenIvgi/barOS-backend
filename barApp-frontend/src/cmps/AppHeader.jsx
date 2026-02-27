import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { logout } from '../store/actions/user.actions'
import { CartIcon } from './CartIcon'

export function AppHeader({ isSidebarExpanded, onToggleSidebar }) {
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
    <section className="app-header full">
      <div className="header-content flex justify-between align-center">
        <div className="header-actions flex align-center gap-1">
          <CartIcon />
          <button 
            className="language-toggle-btn"
            onClick={toggleLanguage}
            title={t('toggleLanguage')}
          >
            {getLanguageLabel()}
          </button>
          {user ? (
            <section className="flex align-center gap-1">
              <Link to={'/user'}>{t('hello')} {user.fullname}</Link>
              <button onClick={onLogout}>{t('logout')}</button>
            </section>
          ) : (
            <Link to="/" className="header-login-link">{t('landingLoginBtn')}</Link>
          )}
        </div>
        <div className="header-brand flex align-center gap-1">
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={isSidebarExpanded ? t('closeSidebar') : t('openSidebar')}
            aria-expanded={!!isSidebarExpanded}
            onClick={onToggleSidebar}
          >
            <span className="hamburger" aria-hidden="true">
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
            </span>
          </button>
          <div className="logo">BarOS</div>
        </div>
      </div>
    </section>
  )
}
