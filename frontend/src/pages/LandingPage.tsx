import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.landingPage}>
      <div className={styles.landingContent}>
        {/* Logo + Titre MADIO */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19V5a1 1 0 011-1h4l2 2h8a1 1 0 011 1v2" />
              <path d="M5 19h14a2 2 0 002-2v0a2 2 0 00-2-2H9l-2-2H5" />
              <path d="M3 21h18" />
              <circle cx="8" cy="21" r="1.5" />
              <circle cx="16" cy="21" r="1.5" />
            </svg>
          </div>
          <h1 className={styles.title}>🛣️ CLOUD MADIO</h1>
          <p className={styles.subtitle}>Gestion et suivi de l'état des routes — Antananarivo</p>
        </div>

        {/* Cards Manager / Visiteur */}
        <div className={styles.optionsGrid}>
          <button
            className={`${styles.optionCard} ${styles.managerCard}`}
            onClick={() => navigate('/manager-login')}
          >
            <div className={styles.optionIconWrap}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className={styles.optionLabel}>Manager</div>
            <div className={styles.optionDesc}>Gérer les signalements et les utilisateurs</div>
          </button>

          <button
            className={`${styles.optionCard} ${styles.visitorCard}`}
            onClick={() => navigate('/visitor')}
          >
            <div className={styles.optionIconWrap}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className={styles.optionLabel}>Visiteur</div>
            <div className={styles.optionDesc}>Consulter la carte des routes en temps réel</div>
          </button>
        </div>
      </div>

      {/* Déco arrière-plan */}
      <div className={styles.bgDeco}>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
      </div>
    </div>
  );
};

export default LandingPage;