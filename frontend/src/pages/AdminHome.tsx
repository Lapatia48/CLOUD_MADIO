import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { http, getApiErrorMessage } from '../api/http'
import { useAuth } from '../auth/AuthContext'
import type { User } from '../types/auth'

export default function AdminHome() {
  const { logout } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.email.localeCompare(b.email))
  }, [users])

  async function fetchUsers() {
    setError(null)
    setLoading(true)
    try {
      const res = await http.get<User[]>('/api/auth/users')
      setUsers(res.data)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function block(email: string) {
    setError(null)
    try {
      await http.post(`/api/auth/users/${encodeURIComponent(email)}/block`)
      await fetchUsers()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  async function unblock(email: string) {
    setError(null)
    try {
      await http.post(`/api/auth/users/${encodeURIComponent(email)}/unblock`)
      await fetchUsers()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    void fetchUsers()
  }, [])

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 16 }}>
      <h1>Espace admin (MANAGER)</h1>

      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <Link to="/">Accueil public</Link>
        <button onClick={() => fetchUsers()} disabled={loading}>
          {loading ? 'Chargement...' : 'Rafraîchir'}
        </button>
        <button
          onClick={async () => {
            await logout()
          }}
        >
          Logout
        </button>
      </div>

      {error ? <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div> : null}

      <div style={{ marginTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Email</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Rôle</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Bloqué</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((u) => (
              <tr key={u.id}>
                <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{u.email}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{u.role}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{u.isBlocked ? 'Oui' : 'Non'}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => block(u.email)} disabled={u.isBlocked}>
                      Bloquer
                    </button>
                    <button onClick={() => unblock(u.email)} disabled={!u.isBlocked}>
                      Débloquer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
