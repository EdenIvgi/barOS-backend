import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { logout } from '../store/actions/user.actions'
import { LoginSignup } from './LoginSignup'
import { CartIcon } from './CartIcon'

export function AppHeader({ isSidebarExpanded, onToggleSidebar }) {
  const user = useSelector(storeState => storeState.userModule.loggedInUser)
  const { t, i18n } = useTranslation()

  function toggleLanguage() {
    const currentLang = i18n.resolvedLanguage || 'he'
    const nextLang = currentLang === 'en' ? 'es' : currentLang === 'es' ? 'he' : 'en'
    i18n.changeLanguage(nextLang)
  }

  function getLanguageLabel() {
    const currentLang = i18n.resolvedLanguage || 'he'
    if (currentLang === 'en') return 'EN'
    if (currentLang === 'es') return 'ES'
    return 'HE'
  }

  function onLogout() {
    try {
      logout()
      showSuccessMsg('Bye Bye')
    } catch (error) {
      showErrorMsg('OOPs try again')
    }
  }

  return (
    <section className="app-header full">
      <div className="header-content flex justify-between align-center">
        <div className="header-actions flex align-center gap-1">
          <button 
            className="language-toggle-btn"
            onClick={toggleLanguage}
            title="Toggle Language"
          >
            {getLanguageLabel()}
          </button>
          {user ? (
            <section className="flex align-center gap-1">
              <Link to={'/user'}>Hello {user.fullname}</Link>
              <button onClick={onLogout}>Logout</button>
            </section>
          ) : (
            <section>
              <LoginSignup />
            </section>
          )}
          <CartIcon />
        </div>
        <div className="header-brand flex align-center gap-1">
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={isSidebarExpanded ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={!!isSidebarExpanded}
            onClick={onToggleSidebar}
          >
            <span className="hamburger" aria-hidden="true">
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
            </span>
          </button>
          <div className="logo">Bar App</div>
        </div>
      </div>
    </section>
  )
}
