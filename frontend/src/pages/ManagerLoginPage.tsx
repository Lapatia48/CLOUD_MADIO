import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

  .manager-login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 20px;
  }

  .login-container {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 450px;
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

  .btn-back {
    position: absolute;
    top: 20px;
    left: 20px;
    padding: 10px 16px;
    background: linear-gradient(135deg, #2c5282 0%, #1a3a52 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9em;
    transition: all 0.3s ease;
    z-index: 20;
  }

  .btn-back:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(44, 82, 130, 0.3);
  }

  .login-header {
    background: linear-gradient(135deg, #2c5282 0%, #1a3a52 100%);
    color: white;
    padding: 50px 30px 40px;
    text-align: center;
    border-bottom: 5px solid #f5a623;
  }

  .login-icon {
    font-size: 3em;
    display: block;
    margin-bottom: 15px;
  }

  .login-header h1 {
    font-size: 2em;
    font-weight: 700;
    letter-spacing: 2px;
    margin-bottom: 10px;
  }

  .login-header p {
    font-size: 0.9em;
    opacity: 0.85;
    font-weight: 300;
  }

  .login-form {
    padding: 40px 30px;
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
    padding: 12px 15px;
    border-radius: 8px;
    margin-bottom: 25px;
    font-size: 0.9em;
    border-left: 4px solid #f5a623;
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
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
    margin-bottom: 12px;
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

  .btn-register {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #f5a623 0%, #d68910 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 4px 15px rgba(245, 166, 35, 0.3);
  }

  .btn-register:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(245, 166, 35, 0.4);
  }

  .login-footer {
    border-top: 1px solid #e0e0e0;
    padding-top: 20px;
    text-align: center;
  }

  .login-footer p {
    margin: 8px 0;
    color: #666;
    font-size: 0.9em;
  }

  .info-text {
    color: #2c5282;
    font-weight: 600;
    margin-top: 12px !important;
  }

  .login-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
  }

  .bg-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #1a3a52 0%, #2c5282 50%, #0f2438 100%);
  }

  @media (max-width: 480px) {
    .login-container {
      max-width: 100%;
      border-radius: 0;
    }

    .login-header {
      padding: 40px 20px 30px;
    }

    .login-form {
      padding: 30px 20px;
    }

    .btn-back {
      left: 10px;
      top: 10px;
      padding: 8px 12px;
      font-size: 0.85em;
    }
  }
`;

const ManagerLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('manager@gmail.com');
  const [password, setPassword] = useState('manager');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.idRole === 2 || data.role === 'MANAGER' || data.role === 'ADMIN') {
          localStorage.setItem('manager', JSON.stringify({
            id: data.userId,
            email: data.email,
            nom: data.nom,
            prenom: data.prenom,
            role: 'MANAGER'
          }));
          localStorage.setItem('managerToken', data.token);
          navigate('/manager');
        } else {
          setError('Accès refusé. Vous n\'êtes pas un manager.');
        }
      } else {
        setError(data.message || 'Email ou mot de passe incorrect');
      }
    } catch (err) {
      console.error('Erreur login:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="manager-login-page">
        <div className="login-container">
          <button className="btn-back" onClick={() => navigate('/')}>
            Retour
          </button>

          <div className="login-header">
            <span className="login-icon">M</span>
            <h1>Espace Manager</h1>
            <p>Connectez-vous pour accéder à la gestion des routes</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Adresse E-mail</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@gmail.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <button 
              type="button" 
              className="btn-register"
              onClick={() => navigate('/register')}
            >
              Créer un compte utilisateur
            </button>
          </form>

          <div className="login-footer">
            <p>Accès réservé aux gestionnaires autorisés</p>
            <p className="info-text">Créez des comptes pour les utilisateurs de l'application mobile</p>
          </div>
        </div>

        <div className="login-bg">
          <div className="bg-gradient"></div>
        </div>
      </div>
    </>
  );
};

export default ManagerLoginPage;

const ManagerLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('manager@gmail.com');
  const [password, setPassword] = useState('manager');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Vérifier si c'est un manager (id_role = 2)
        if (data.idRole === 2 || data.role === 'MANAGER' || data.role === 'ADMIN') {
          // Stocker les infos du manager
          localStorage.setItem('manager', JSON.stringify({
            id: data.userId,
            email: data.email,
            nom: data.nom,
            prenom: data.prenom,
            role: 'MANAGER'
          }));
          localStorage.setItem('managerToken', data.token);
          navigate('/manager');
        } else {
          setError('Accès refusé. Vous n\'êtes pas un manager.');
        }
      } else {
        setError(data.message || 'Email ou mot de passe incorrect');
      }
    } catch (err) {
      console.error('Erreur login:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manager-login-page">
      <div className="login-container">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Retour
        </button>

        <div className="login-header">
          <span className="login-icon">👨‍💼</span>
          <h1>Espace Manager</h1>
          <p>Connectez-vous pour accéder à la gestion</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@gmail.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
          </button>

          <button 
            type="button" 
            className="btn-register"
            onClick={() => navigate('/register')}
          >
            📝 Créer un compte utilisateur mobile
          </button>
        </form>

        <div className="login-footer">
          <p>Accès réservé aux gestionnaires autorisés</p>
          <p className="info-text">💡 Créez des comptes pour les utilisateurs de l'app mobile</p>
        </div>
      </div>

      {/* Background */}
      <div className="login-bg">
        <div className="bg-gradient"></div>
      </div>
    </div>
  );
};

export default ManagerLoginPage;
