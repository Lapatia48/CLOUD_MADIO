import { Navigate, Outlet } from 'react-router-dom'

type ProtectedRouteProps = {
  allowedRoles?: string[]
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const storedUser = localStorage.getItem('user')

  if (!storedUser) {
    // Pas connecté -> rediriger vers login
    return <Navigate to="/login" replace />
  }

  try {
    const user = JSON.parse(storedUser) as { role: string }

    // Si des rôles sont requis, vérifier que l'utilisateur a le bon rôle
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/user" replace />
    }

    // Utilisateur autorisé
    return <Outlet />
  } catch {
    // Erreur parsing -> rediriger vers login
    localStorage.removeItem('user')
    return <Navigate to="/login" replace />
  }
}

export default ProtectedRoute
