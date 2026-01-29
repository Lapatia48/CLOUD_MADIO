import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useEffect, useMemo, useState } from 'react'
import { http, getApiErrorMessage } from '../api/http'
import type { SignalementResponse } from '../types/signalement'

export default function PublicHome() {
  const { isAuthenticated, user } = useAuth()

  const [signalements, setSignalements] = useState<SignalementResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedSignalements = useMemo(() => {
    return [...signalements].sort((a, b) => {
      const da = a.dateSignalement ? new Date(a.dateSignalement).getTime() : 0
      const db = b.dateSignalement ? new Date(b.dateSignalement).getTime() : 0
      return db - da
    })
  }, [signalements])

  async function fetchSignalements() {
    setError(null)
    setLoading(true)
    try {
      const res = await http.get<SignalementResponse[]>('/api/signalements')
      setSignalements(res.data)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchSignalements()
  }, [])

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

      <div style={{ marginTop: 24 }}>
        <h2>Signalements (public)</h2>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => fetchSignalements()} disabled={loading}>
            {loading ? 'Chargement...' : 'Rafraîchir'}
          </button>
        </div>

        {error ? <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div> : null}

        {sortedSignalements.length === 0 && !loading ? (
          <div style={{ color: '#666', marginTop: 12 }}>Aucun signalement pour le moment.</div>
        ) : null}

        {sortedSignalements.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Entreprise</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Status</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Description</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Position</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {sortedSignalements.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{s.entrepriseNom ?? '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{s.status}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{s.description ?? '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
                    {s.latitude}, {s.longitude}
                  </td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
                    {s.dateSignalement ? new Date(s.dateSignalement).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  )
}
