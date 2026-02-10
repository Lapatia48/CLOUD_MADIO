import { useNavigate } from 'react-router-dom';

const AccountManagementPage = () => {
  const navigate = useNavigate();

  return (
    <div className="account-management">
      <div className="header">
        <button className="btn-back" onClick={() => navigate('/manager')}>Retour</button>
        <h1>Gestion des Comptes</h1>
      </div>

      <div className="options-grid">
        <div className="option-card" onClick={() => navigate('/accounts/create')}>
          <div className="option-icon">+</div>
          <h2>Creer un compte</h2>
        </div>

        <div className="option-card" onClick={() => navigate('/accounts/manage')}>
          <div className="option-icon">Modifier</div>
          <h2>Gerer les comptes</h2>
        </div>

        <div className="option-card" onClick={() => navigate('/accounts/configuration')}>
          <div className="option-icon">Config</div>
          <h2>Configuration</h2>
        </div>
      </div>
    </div>
  );
};

export default AccountManagementPage;
