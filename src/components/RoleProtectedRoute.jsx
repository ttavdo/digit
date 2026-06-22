import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDefaultRouteForRole, resolveUserRole } from '../utils/roles'

function RoleProtectedRoute({ children, allowedRoles, loginPath = '/login' }) {
  const { user, userProfile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading__spinner" aria-label="იტვირთება..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  const role = resolveUserRole(userProfile)

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />
  }

  return children
}

export default RoleProtectedRoute
