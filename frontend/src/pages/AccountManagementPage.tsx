import { useNavigate } from 'react-router-dom';
import '../assets/css/AccountManagement.css';

const AccountManagementPage = () => {
  const navigate = useNavigate();

  return (
    <div className="account-management">
      <div className="header">
        <button className="btn-back" onClick={() => navigate('/manager')}>← Retour</button>
        <h1>👥 Gestion des Comptes</h1>
      </div>

      <div className="options-grid">
        {/* Option 1: Créer un compte */}
        <div className="option-card" onClick={() => navigate('/accounts/create')}>
          <div className="option-icon">➕</div>
          <h2>Créer un compte</h2>
          <p>Créer un nouveau compte utilisateur et le synchroniser avec Firebase</p>
          <div className="option-features">
            <span>✓ Création compte PostgreSQL</span>
            <span>✓ Sync automatique Firebase</span>
            <span>✓ Définir le rôle</span>
          </div>
        </div>

        {/* Option 2: Gérer les comptes existants */}
        <div className="option-card" onClick={() => navigate('/accounts/manage')}>
          <div className="option-icon">✏️</div>
          <h2>Gérer les comptes</h2>
          <p>Modifier, bloquer/débloquer ou supprimer les comptes existants</p>
          <div className="option-features">
            <span>✓ Voir tous les utilisateurs</span>
            <span>✓ Modifier les informations</span>
            <span>✓ Bloquer/Débloquer</span>
            <span>✓ Supprimer un compte</span>
          </div>
        </div>

        {/* Option 3: Configuration */}
        <div className="option-card" onClick={() => navigate('/accounts/configuration')}>
          <div className="option-icon">⚙️</div>
          <h2>Configuration</h2>
          <p>Paramétrer les règles de sécurité (tentatives max, etc.)</p>
          <div className="option-features">
            <span>✓ Nombre max de tentatives</span>
            <span>✓ Sync vers Firebase</span>
            <span>✓ Paramètres globaux</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountManagementPage;
