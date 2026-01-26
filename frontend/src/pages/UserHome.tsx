import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function UserHome() {
  const { user, logout } = useAuth()

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 16 }}>
      <h1>Espace utilisateur</h1>

      <div style={{ marginTop: 12 }}>
        <div>
          <strong>Email:</strong> {user?.email}
        </div>
        <div>
          <strong>Nom:</strong> {user?.nom ?? '-'}
        </div>
        <div>
          <strong>Prénom:</strong> {user?.prenom ?? '-'}
        </div>
        <div>
          <strong>Rôle:</strong> {user?.role}
        </div>
        <div>
          <strong>Bloqué:</strong> {user?.isBlocked ? 'Oui' : 'Non'}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <Link to="/">Accueil public</Link>
        <button
          onClick={async () => {
            await logout()
          }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
