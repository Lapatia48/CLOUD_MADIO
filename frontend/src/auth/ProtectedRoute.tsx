import { Navigate, Outlet } from 'react-router-dom'

type ProtectedRouteProps = {
  allowedRoles?: string[]
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  // Vérifier d'abord si un manager est connecté
  const storedManager = localStorage.getItem('manager')
  const storedUser = localStorage.getItem('user')

  // Si ni user ni manager n'est connecté
  if (!storedUser && !storedManager) {
    return <Navigate to="/manager-login" replace />
  }

  try {
    // Priorité au manager
    const userData = storedManager 
      ? JSON.parse(storedManager) as { role: string }
      : JSON.parse(storedUser!) as { role: string }

    // Si des rôles sont requis, vérifier que l'utilisateur a le bon rôle
    if (allowedRoles && !allowedRoles.includes(userData.role)) {
      return <Navigate to="/" replace />
    }

    // Utilisateur autorisé
    return <Outlet />
  } catch {
    // Erreur parsing -> rediriger vers login manager
    localStorage.removeItem('user')
    localStorage.removeItem('manager')
    return <Navigate to="/manager-login" replace />
  }
}

export default ProtectedRoute
