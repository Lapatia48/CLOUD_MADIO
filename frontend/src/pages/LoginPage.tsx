import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getApiErrorMessage } from '../api/http'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const user = await login(email, password)
      navigate(user.role === 'MANAGER' ? '/admin' : '/user', { replace: true })
    } catch (err) {
      const msg = getApiErrorMessage(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h1>Login</h1>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          Mot de passe
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        {error ? (
          <div style={{ color: 'crimson' }}>
            {error}
            <div style={{ marginTop: 8, fontSize: 13 }}>
              Si tu vois “Account is blocked…”, c’est que le compte a été bloqué après 3 tentatives.
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Link to="/">Accueil</Link>
          <Link to="/register">Register</Link>
        </div>
      </form>
    </div>
  )
}
