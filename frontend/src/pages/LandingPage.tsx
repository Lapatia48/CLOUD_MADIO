import { useNavigate } from 'react-router-dom';
import '../assets/css/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-content">
        {/* Logo et titre */}
        <div className="landing-header">
          <div className="logo-container">
            <span className="logo-icon">🛣️</span>
            <h1>MADIO</h1>
          </div>
          <p className="tagline">Système de Gestion des Routes</p>
          <p className="subtitle">Signalement et suivi des travaux routiers à Antananarivo</p>
        </div>

        {/* Boutons de connexion */}
        <div className="login-options">
          <h2>Accéder à l'application</h2>
          
          <button 
            className="btn-login btn-manager"
            onClick={() => navigate('/manager-login')}
          >
            <span className="btn-icon">👨‍💼</span>
            <div className="btn-text">
              <strong>Manager</strong>
              <small>Gestion et synchronisation</small>
            </div>
          </button>

          <button 
            className="btn-login btn-visitor"
            onClick={() => navigate('/visitor')}
          >
            <span className="btn-icon">👁️</span>
            <div className="btn-text">
              <strong>Visiteur</strong>
              <small>Consultation de la carte</small>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="landing-footer">
          <p>© 2026 MADIO - Ministère des Travaux Publics</p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="landing-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>
    </div>
  );
};

export default LandingPage;
