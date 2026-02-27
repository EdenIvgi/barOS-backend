import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login, signup } from '../store/actions/user.actions'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'

export function LandingPage() {
  const { t, i18n } = useTranslation()
  const user = useSelector(state => state.userModule.loggedInUser)
  const navigate = useNavigate()

  const [isSignup, setIsSignup] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [credentials, setCredentials] = useState({ username: '', password: '', fullname: '' })

  useEffect(() => {
    if (user) navigate('/home')
  }, [user, navigate])

  function handleChange({ target }) {
    const { name, value } = target
    setCredentials(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setIsLoading(true)
    try {
      if (isSignup) {
        await signup(credentials)
        showSuccessMsg(t('welcomeMsg'))
      } else {
        await login(credentials)
        showSuccessMsg(t('welcomeMsg'))
      }
      navigate('/home')
    } catch {
      showErrorMsg(t('loginError'))
    } finally {
      setIsLoading(false)
    }
  }

  function toggleLanguage() {
    const currentLang = i18n.resolvedLanguage || 'he'
    i18n.changeLanguage(currentLang === 'en' ? 'he' : 'en')
  }

  const isHe = (i18n.resolvedLanguage || 'he') === 'he'

  return (
    <section className="landing-page" dir={isHe ? 'rtl' : 'ltr'}>

      <button className="landing-lang-btn" onClick={toggleLanguage}>
        {isHe ? 'EN' : 'HE'}
      </button>

      {/* Left / content side */}
      <div className="landing-content">
        <div className="landing-brand">
          <div className="landing-logo-mark">🍸</div>
          <h1 className="landing-app-name">BarOS</h1>
          <p className="landing-tagline">{t('landingTagline')}</p>
        </div>

        <ul className="landing-features">
          <li>
            <span className="feature-icon">📦</span>
            <div>
              <strong>{t('featureInventoryTitle')}</strong>
              <span>{t('featureInventoryDesc')}</span>
            </div>
          </li>
          <li>
            <span className="feature-icon">🛒</span>
            <div>
              <strong>{t('featureOrdersTitle')}</strong>
              <span>{t('featureOrdersDesc')}</span>
            </div>
          </li>
          <li>
            <span className="feature-icon">📖</span>
            <div>
              <strong>{t('featureBarBookTitle')}</strong>
              <span>{t('featureBarBookDesc')}</span>
            </div>
          </li>
          <li>
            <span className="feature-icon">📊</span>
            <div>
              <strong>{t('featureDashboardTitle')}</strong>
              <span>{t('featureDashboardDesc')}</span>
            </div>
          </li>
        </ul>
      </div>

      {/* Right / auth side */}
      <div className="landing-auth">
        <div className="landing-auth-card">
          <h2 className="auth-title">
            {isSignup ? t('landingSignupTitle') : t('landingLoginTitle')}
          </h2>

          <form className="landing-form" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="form-field">
                <label htmlFor="l-fullname">{t('fullnamePlaceholder')}</label>
                <input
                  id="l-fullname"
                  type="text"
                  name="fullname"
                  value={credentials.fullname}
                  onChange={handleChange}
                  placeholder={t('fullnamePlaceholder')}
                  required
                />
              </div>
            )}

            <div className="form-field">
              <label htmlFor="l-username">{t('usernamePlaceholder')}</label>
              <input
                id="l-username"
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                placeholder={t('usernamePlaceholder')}
                autoFocus
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="l-password">{t('passwordPlaceholder')}</label>
              <input
                id="l-password"
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder={t('passwordPlaceholder')}
                required
              />
            </div>

            <button type="submit" className="landing-submit-btn" disabled={isLoading}>
              {isLoading
                ? t('loading')
                : isSignup
                ? t('landingSignupBtn')
                : t('landingLoginBtn')}
            </button>
          </form>

          <button
            type="button"
            className="landing-toggle-btn"
            onClick={() => {
              setIsSignup(p => !p)
              setCredentials({ username: '', password: '', fullname: '' })
            }}
          >
            {isSignup ? t('alreadyMember') : t('newUser')}
          </button>
        </div>
      </div>
    </section>
  )
}
