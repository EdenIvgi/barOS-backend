import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { login } from '../store/actions/user.actions'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'

export function SwitchUserModal({ onClose }) {
  const { t } = useTranslation()
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleChange({ target }) {
    setCredentials(prev => ({ ...prev, [target.name]: target.value }))
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setIsLoading(true)
    try {
      await login(credentials)
      showSuccessMsg(t('welcomeMsg'))
      onClose()
    } catch {
      showErrorMsg(t('loginError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="switch-user-dropdown">
      <p className="sud-title">{t('switchUser').toUpperCase()}</p>
      <form className="sud-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          name="username"
          placeholder={t('usernamePlaceholder')}
          value={credentials.username}
          onChange={handleChange}
          autoComplete="username"
          required
        />
        <input
          type="password"
          name="password"
          placeholder={t('passwordPlaceholder')}
          value={credentials.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />
        <button type="submit" className="sud-btn-login" disabled={isLoading}>
          {isLoading ? '...' : t('landingLoginBtn')}
        </button>
      </form>
    </div>
  )
}
