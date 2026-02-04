import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../assets/css/Auth.css'

export default function RegisterPage() {
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
      // Créer le compte dans PostgreSQL (le backend sync automatiquement vers Firebase avec le password)
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nom, prenom }),
      })

      const data = await response.json()
      console.log('Register response:', data)

      if (response.ok && (data.token || data.userId)) {
        // Retourner à l'espace manager
        navigate('/manager', { 
          replace: true,
          state: { 
            message: '✅ Compte créé et synchronisé avec Firebase!'
          }
        })
      } else {
        setError(data.message || 'Erreur lors de l\'inscription')
      }
    } catch (err) {
      console.error('Register error:', err)
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
          <p>Créer un compte</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Nom</label>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Votre nom"
                required
              />
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Votre prénom"
                required
              />
            </div>
          </div>

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
              minLength={6}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '⏳ Création...' : 'Créer le compte'}
          </button>

          <div className="firebase-info">
            <p>🔥 Votre compte sera automatiquement synchronisé avec Firebase</p>
            <p>📱 Vous pourrez vous connecter sur l'application mobile</p>
          </div>

          <div className="auth-footer">
            <Link to="/manager">← Retour à l'espace Manager</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
