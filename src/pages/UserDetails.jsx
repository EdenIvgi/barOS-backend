import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { showErrorMsg } from '../services/event-bus.service'

export function UserDetails() {
  const { t } = useTranslation()
  const user = useSelector(storeState => storeState.userModule.loggedInUser)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/')
      showErrorMsg(t('loginRequired'))
      return
    }
  }, [user])

  if (!user) return null

  return (
    <section className="user-details">
      <h1>{t('hello')} {user.fullname}</h1>
    </section>
  )
}
