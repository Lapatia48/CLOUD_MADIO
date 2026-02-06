import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #1a3a52 0%, #2c5282 100%);
    min-height: 100vh;
  }

  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: linear-gradient(135deg, #1a3a52 0%, #2c5282 100%);
  }

  .auth-container {
    width: 100%;
    max-width: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    animation: slideUp 0.6s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .auth-header {
    background: linear-gradient(135deg, #2c5282 0%, #1a3a52 100%);
    color: white;
    padding: 40px 30px;
    text-align: center;
    border-bottom: 5px solid #f5a623;
  }

  .auth-header h1 {
    font-size: 2.5em;
    font-weight: 700;
    letter-spacing: 2px;
    margin-bottom: 10px;
  }

  .auth-header p {
    font-size: 0.95em;
    opacity: 0.9;
    font-weight: 300;
  }

  .auth-form {
    padding: 40px 30px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 25px;
  }

  .form-group {
    margin-bottom: 25px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #2c5282;
    font-size: 0.95em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .form-group input {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1em;
    transition: all 0.3s ease;
    background-color: #f9f9f9;
  }

  .form-group input:focus {
    outline: none;
    border-color: #2c5282;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
  }

  .form-group input::placeholder {
    color: #999;
  }

  .error-message {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: white;
    padding: 15px 15px;
    border-radius: 8px;
    margin-bottom: 25px;
    font-size: 0.95em;
    border-left: 4px solid #f5a623;
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }

  .firebase-info {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;
    padding: 20px 15px;
    border-radius: 8px;
    margin-bottom: 25px;
    font-size: 0.9em;
    border-left: 4px solid #f5a623;
  }

  .firebase-info p {
    margin-bottom: 8px;
  }

  .firebase-info p:last-child {
    margin-bottom: 0;
  }

  .btn-submit {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #2c5282 0%, #1a3a52 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 20px;
    box-shadow: 0 4px 15px rgba(44, 82, 130, 0.3);
  }

  .btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(44, 82, 130, 0.4);
  }

  .btn-submit:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .auth-footer {
    display: flex;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
  }

  .auth-footer a {
    color: #2c5282;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9em;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .auth-footer a:hover {
    color: #f5a623;
  }
`

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
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nom, prenom }),
      })

      const data = await response.json()
      console.log('Register response:', data)

      if (response.ok && (data.token || data.userId)) {
        navigate('/manager', { 
          replace: true,
          state: { 
            message: 'Compte créé et synchronisé avec Firebase!'
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
    <>
      <style>{styles}</style>
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>MADIO</h1>
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
              <label>Adresse E-mail</label>
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
              {loading ? 'Création en cours...' : 'Créer le compte'}
            </button>

            <div className="firebase-info">
              <p>Votre compte sera automatiquement synchronisé avec Firebase</p>
              <p>Vous pourrez vous connecter sur l'application mobile</p>
            </div>

            <div className="auth-footer">
              <Link to="/manager">Retour à l'espace Manager</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
