import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children }) {
  const user = useSelector(state => state.userModule.loggedInUser)
  if (!user) return <Navigate to="/" replace />
  return children
}
