import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/ManagerLogin.css';

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
