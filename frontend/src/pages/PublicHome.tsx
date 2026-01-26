import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function PublicHome() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 16 }}>
      <h1>Accueil</h1>
      <p>
        Bienvenue. Les visiteurs peuvent consulter l’accueil. Pour accéder à votre espace, connectez-vous.
      </p>

      {!isAuthenticated ? (
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login">Se connecter</Link>
          <Link to="/register">Créer un compte</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>
            Connecté en tant que <strong>{user?.email}</strong> ({user?.role})
          </span>
          <Link to={user?.role === 'MANAGER' ? '/admin' : '/user'}>Aller à mon espace</Link>
        </div>
      )}
    </div>
  )
}
