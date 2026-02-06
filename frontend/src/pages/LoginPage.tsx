import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Récupérer le message de succès après inscription
  useEffect(() => {
    const state = location.state as { message?: string; firebaseSynced?: boolean } | null
    if (state?.message) {
      setSuccessMessage(state.message)
      // Nettoyer l'état pour ne pas réafficher le message
      window.history.replaceState({}, document.title)
    }
  }, [location])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && (data.success || data.token || data.userId || data.id)) {
        const userData = data.user || data
        localStorage.setItem('user', JSON.stringify({
          userId: userData.userId || userData.id,
          email: userData.email || email,
          nom: userData.nom,
          prenom: userData.prenom,
          role: userData.role || 'USER',
          token: data.token,
        }))
        navigate('/', { replace: true })
      } else {
        setError(data.message || 'Email ou mot de passe incorrect')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🛣️ MADIO</h1>
          <p>Connexion</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          {successMessage && (
            <div className="success-message">
              {successMessage}
              <p className="firebase-note">📱 Vous pouvez aussi vous connecter sur l'app mobile!</p>
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
          </button>

          <div className="auth-footer">
            <Link to="/">← Retour à la carte</Link>
            <Link to="/register">Créer un compte</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
