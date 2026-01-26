import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getApiErrorMessage } from '../api/http'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const user = await register({ email, password, nom, prenom })
      navigate(user.role === 'MANAGER' ? '/admin' : '/user', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h1>Register</h1>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          Nom
          <input value={nom} onChange={(e) => setNom(e.target.value)} />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          Prénom
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          Mot de passe
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Création...' : 'Créer un compte'}
        </button>

        {error ? <div style={{ color: 'crimson' }}>{error}</div> : null}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Link to="/">Accueil</Link>
          <Link to="/login">Login</Link>
        </div>
      </form>
    </div>
  )
}
