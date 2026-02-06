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

  .landing-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 20px;
  }

  .landing-content {
    position: relative;
    z-index: 10;
    text-align: center;
    max-width: 600px;
    width: 100%;
  }

  .landing-header {
    margin-bottom: 60px;
    animation: fadeInDown 0.8s ease-out;
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 30px;
  }

  .logo-icon {
    font-size: 4em;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
    background: linear-gradient(135deg, #f5a623 0%, #d68910 100%);
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(245, 166, 35, 0.3);
  }

  .landing-header h1 {
    font-size: 3.5em;
    color: white;
    font-weight: 700;
    letter-spacing: 3px;
    margin: 0;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .tagline {
    color: #f5a623;
    font-size: 1.2em;
    font-weight: 600;
    margin-top: 20px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .subtitle {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.1em;
    margin-top: 15px;
    font-weight: 300;
    line-height: 1.6;
  }

  .login-options {
    margin-bottom: 60px;
    animation: fadeInUp 0.8s ease-out 0.2s both;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .login-options h2 {
    color: white;
    margin-bottom: 40px;
    font-size: 1.5em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  .btn-login {
    display: flex;
    align-items: center;
    gap: 20px;
    width: 100%;
    padding: 25px 30px;
    margin-bottom: 20px;
    border: 2px solid transparent;
    border-radius: 12px;
    font-size: 1em;
    cursor: pointer;
    transition: all 0.4s ease;
    background: white;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    text-align: left;
  }

  .btn-login:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
  }

  .btn-login:active {
    transform: translateY(-2px);
  }

  .btn-icon {
    font-size: 2.5em;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 70px;
    height: 70px;
    border-radius: 12px;
    flex-shrink: 0;
  }

  .btn-manager .btn-icon {
    background: linear-gradient(135deg, #2c5282 0%, #1a3a52 100%);
  }

  .btn-visitor .btn-icon {
    background: linear-gradient(135deg, #f5a623 0%, #d68910 100%);
  }

  .btn-text {
    flex: 1;
  }

  .btn-text strong {
    display: block;
    font-size: 1.3em;
    color: #2c5282;
    margin-bottom: 5px;
    font-weight: 700;
  }

  .btn-visitor .btn-text strong {
    color: #d68910;
  }

  .btn-text small {
    display: block;
    font-size: 0.9em;
    color: #666;
    font-weight: 300;
  }

  .landing-footer {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9em;
    animation: fadeInUp 0.8s ease-out 0.4s both;
  }

  .landing-footer p {
    margin: 0;
  }

  .landing-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    overflow: hidden;
  }

  .bg-shape {
    position: absolute;
    opacity: 0.1;
    border-radius: 50%;
  }

  .shape-1 {
    width: 300px;
    height: 300px;
    background: white;
    top: -100px;
    left: -100px;
    animation: float 20s ease-in-out infinite;
  }

  .shape-2 {
    width: 200px;
    height: 200px;
    background: white;
    bottom: -50px;
    right: -50px;
    animation: float 25s ease-in-out infinite reverse;
  }

  .shape-3 {
    width: 250px;
    height: 250px;
    background: white;
    bottom: 100px;
    right: 50px;
    animation: float 30s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(30px, 30px);
    }
  }

  @media (max-width: 768px) {
    .landing-header h1 {
      font-size: 2.5em;
    }

    .logo-container {
      flex-direction: column;
      gap: 15px;
    }

    .logo-icon {
      width: 100px;
      height: 100px;
      font-size: 3em;
    }

    .btn-login {
      flex-direction: column;
      gap: 15px;
      padding: 20px;
      text-align: center;
    }

    .btn-text strong {
      font-size: 1.1em;
    }

    .btn-icon {
      width: 60px;
      height: 60px;
      font-size: 2em;
    }
  }
`;

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <style>{styles}</style>
      <div className="landing-page">
        <div className="landing-content">
          <div className="landing-header">
            <div className="logo-container">
              <div className="logo-icon">ROUTE</div>
              <h1>MADIO</h1>
            </div>
            <p className="tagline">Système Intelligent de Gestion des Routes</p>
            <p className="subtitle">Signalement et suivi des travaux routiers à Antananarivo</p>
          </div>

          <div className="login-options">
            <h2>Accéder à l'application</h2>
            
            <button 
              className="btn-login btn-manager"
              onClick={() => navigate('/manager-login')}
            >
              <div className="btn-icon">M</div>
              <div className="btn-text">
                <strong>Espace Manager</strong>
                <small>Gestion et synchronisation des données</small>
              </div>
            </button>

            <button 
              className="btn-login btn-visitor"
              onClick={() => navigate('/visitor')}
            >
              <div className="btn-icon">V</div>
              <div className="btn-text">
                <strong>Mode Visiteur</strong>
                <small>Consultation de la carte et signalements</small>
              </div>
            </button>
          </div>

          <div className="landing-footer">
            <p>Système intelligent pour une gestion efficace des routes - Antananarivo 2026</p>
          </div>
        </div>

        <div className="landing-bg">
          <div className="bg-shape shape-1"></div>
          <div className="bg-shape shape-2"></div>
          <div className="bg-shape shape-3"></div>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
