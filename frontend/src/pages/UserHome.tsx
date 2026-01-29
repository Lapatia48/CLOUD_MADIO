import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useEffect, useMemo, useState } from 'react'
import { http, getApiErrorMessage } from '../api/http'
import type { SignalementResponse } from '../types/signalement'

export default function UserHome() {
  const { user, logout } = useAuth()

  const [signalements, setSignalements] = useState<SignalementResponse[]>([])
  const [loadingSignalements, setLoadingSignalements] = useState(false)
  const [signalementsError, setSignalementsError] = useState<string | null>(null)

  const sortedSignalements = useMemo(() => {
    return [...signalements].sort((a, b) => {
      const da = a.dateSignalement ? new Date(a.dateSignalement).getTime() : 0
      const db = b.dateSignalement ? new Date(b.dateSignalement).getTime() : 0
      return db - da
    })
  }, [signalements])

  async function fetchMySignalements() {
    if (!user) return

    setSignalementsError(null)
    setLoadingSignalements(true)
    try {
      const res = await http.get<SignalementResponse[]>(`/api/signalements/user/${user.id}`)
      setSignalements(res.data)
    } catch (err) {
      setSignalementsError(getApiErrorMessage(err))
    } finally {
      setLoadingSignalements(false)
    }
  }

  useEffect(() => {
    void fetchMySignalements()
  }, [user?.id])

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
        <Link to="/map" style={{ 
          padding: '8px 16px', 
          background: '#667eea', 
          color: 'white', 
          textDecoration: 'none',
          borderRadius: '4px'
        }}>
          🗺️ Voir la carte
        </Link>
        <Link
          to="/user/signalements/new"
          style={{
            padding: '8px 16px',
            background: '#2f855a',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          Ajouter signalement
        </Link>
        <button onClick={() => fetchMySignalements()} disabled={loadingSignalements}>
          {loadingSignalements ? 'Chargement...' : 'Rafraîchir signalements'}
        </button>
        <button
          onClick={async () => {
            await logout()
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2>Mes signalements</h2>

        {signalementsError ? <div style={{ color: 'crimson' }}>{signalementsError}</div> : null}

        {sortedSignalements.length === 0 && !loadingSignalements ? (
          <div style={{ color: '#666' }}>Aucun signalement pour le moment.</div>
        ) : null}

        {sortedSignalements.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>ID</th>
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
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{s.id}</td>
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
