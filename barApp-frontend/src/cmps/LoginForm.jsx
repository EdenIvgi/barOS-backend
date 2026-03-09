import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { userService } from '../services/user.service.js'

export function LoginForm({ onLogin, isSignup }) {
  const { t } = useTranslation()
  const [credentials, setCredentials] = useState(
    userService.getEmptyCredentials()
  )

  function handleChange({ target }) {
    const { name: field, value } = target
    setCredentials(prevState => {
      return { ...prevState, [field]: value }
    })
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    onLogin(credentials)
  }

  const { fullname, username, password } = credentials

  return (
    <form className="form flex" onSubmit={handleSubmit}>
      <input
        type="text"
        name="username"
        value={username}
        placeholder={t('usernamePlaceholder')}
        onChange={handleChange}
        required
        autoFocus
      />
      <input
        type="password"
        name="password"
        value={password}
        placeholder={t('passwordPlaceholder')}
        onChange={handleChange}
        required
      />
      {isSignup && (
        <input
          type="text"
          name="fullname"
          value={fullname}
          placeholder={t('fullnamePlaceholder')}
          onChange={handleChange}
          required
        />
      )}
      <button className="btn">{isSignup ? t('landingSignupBtn') : t('landingLoginBtn')}</button>
    </form>
  )
}
