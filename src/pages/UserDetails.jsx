import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { logout } from '../store/actions/user.actions'

export function UserDetails() {
  const { t, i18n } = useTranslation()
  const user = useSelector(storeState => storeState.userModule.loggedInUser)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/')
      showErrorMsg(t('loginRequired'))
    }
  }, [user])

  if (!user) return null

  // Derive display company name:
  // 1. user.companyName if set (new users with explicit company name)
  // 2. derive from user.dbName by stripping _db suffix (legacy users: bandit_db → bandit)
  // 3. null if database is the generic bar_<id> pattern
  function getCompanyDisplay() {
    if (user.companyDisplayName) return user.companyDisplayName
    if (user.companyName) return user.companyName
    if (user.dbName && !user.dbName.startsWith('bar_')) {
      return user.dbName.replace(/_db$/, '')
    }
    return null
  }

  function getInitials(name) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  function getRoleKey(role) {
    if (role === 'admin') return 'role_admin'
    if (role === 'manager') return 'role_manager'
    return 'role_bartender'
  }

  function formatDate(timestamp) {
    if (!timestamp) return '—'
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  async function onLogout() {
    try {
      await logout()
      showSuccessMsg(t('logoutSuccess'))
      navigate('/')
    } catch {
      showErrorMsg('Oops, try again')
    }
  }

  const currentLang = i18n.resolvedLanguage || 'he'

  return (
    <section className="user-details">

      {/* ── Profile card ── */}
      <div className="profile-card">
        <div className="profile-avatar">{getInitials(user.fullname)}</div>
        <h1 className="profile-name">{user.fullname}</h1>
        <span className="profile-role-badge">{t(getRoleKey(user.role))}</span>

        <div className="profile-info">
          <div className="profile-row">
            <span className="profile-label">{t('profileUsername')}</span>
            <span className="profile-value">{user.username}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">{t('profileRole')}</span>
            <span className="profile-value">{t(getRoleKey(user.role))}</span>
          </div>
          {user.createdAt && (
            <div className="profile-row">
              <span className="profile-label">{t('profileMemberSince')}</span>
              <span className="profile-value">{formatDate(user.createdAt)}</span>
            </div>
          )}
          {getCompanyDisplay() && (
            <div className="profile-row">
              <span className="profile-label">{t('profileCompany')}</span>
              <span className="profile-value profile-company">{getCompanyDisplay()}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Settings card ── */}
      <div className="profile-settings">
        <h2 className="settings-title">{t('settingsTitle')}</h2>

        <div className="settings-row">
          <span className="settings-label">{t('settingsLanguage')}</span>
          <div className="settings-lang-toggle">
            <button
              className={currentLang === 'he' ? 'active' : ''}
              onClick={() => i18n.changeLanguage('he')}
            >
              עברית
            </button>
            <button
              className={currentLang === 'en' ? 'active' : ''}
              onClick={() => i18n.changeLanguage('en')}
            >
              English
            </button>
          </div>
        </div>

        <div className="settings-logout-row">
          <button className="btn-profile-logout" onClick={onLogout}>
            {t('logout')}
          </button>
        </div>
      </div>

    </section>
  )
}
