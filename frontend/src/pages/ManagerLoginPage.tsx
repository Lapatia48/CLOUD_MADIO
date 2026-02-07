import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ManagerLoginPage.module.css';

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
    <div className={styles.managerLoginPage}>
      <div className={styles.loginContainer}>
        <button className={styles.btnBack} onClick={() => navigate('/')}>
          ← Retour
        </button>

        <div className={styles.loginHeader}>
          <div className={styles.loginIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1>Manager</h1>
        </div>

        <form onSubmit={handleLogin} className={styles.loginForm}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
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

          <div className={styles.formGroup}>
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
            className={styles.btnSubmit}
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <button 
            type="button" 
            className={styles.btnRegister}
            onClick={() => navigate('/register')}
          >
            Créer un compte utilisateur
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManagerLoginPage;
