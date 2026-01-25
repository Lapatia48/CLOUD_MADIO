import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { Role } from '../types/auth'

export default function ProtectedRoute({
  allowedRoles,
  redirectTo = '/login',
}: {
  allowedRoles?: Role[]
  redirectTo?: string
}) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user) return <Navigate to={redirectTo} replace />

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const fallback = user.role === 'MANAGER' ? '/admin' : '/user'
    return <Navigate to={fallback} replace />
  }

  return <Outlet />
}
