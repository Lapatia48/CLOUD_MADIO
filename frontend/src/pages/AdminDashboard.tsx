import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f5f7fa;
  }

  .admin-dashboard {
    min-height: 100vh;
    background: #f5f7fa;
    padding: 30px;
  }

  .admin-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 30px;
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .btn-back {
    padding: 10px 20px;
    background: linear-gradient(135deg, #2c5282 0%, #1a3a52 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .btn-back:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(44, 82, 130, 0.3);
  }

  .admin-header h1 {
    flex: 1;
    font-size: 2em;
    color: #2c5282;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .header-buttons {
    display: flex;
    gap: 10px;
  }

  .btn-firebase-sync, .btn-users {
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn-firebase-sync {
    background: linear-gradient(135deg, #f5a623 0%, #d68910 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(245, 166, 35, 0.3);
  }

  .btn-firebase-sync:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(245, 166, 35, 0.4);
  }

  .btn-firebase-sync:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-users {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }

  .btn-users:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);
  }

  .sync-message {
    padding: 16px 20px;
    margin-bottom: 20px;
    border-radius: 10px;
    font-size: 0.95em;
    position: relative;
    padding-right: 40px;
    animation: slideInDown 0.4s ease-out;
  }

  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .sync-message.success {
    background: linear-gradient(135deg, rgba(39, 174, 96, 0.1) 0%, rgba(39, 174, 96, 0.05) 100%);
    border-left: 4px solid #27ae60;
    color: #27ae60;
  }

  .sync-message.error {
    background: linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(231, 76, 60, 0.05) 100%);
    border-left: 4px solid #e74c3c;
    color: #e74c3c;
  }

  .close-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: inherit;
    font-size: 1.3em;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }

  .close-btn:hover {
    opacity: 1;
  }

  .admin-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .stat-card {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    text-align: center;
    border-left: 5px solid #3498db;
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }

  .stat-card.total {
    border-left-color: #2c5282;
  }

  .stat-card.nouveau {
    border-left-color: #e74c3c;
  }

  .stat-card.en-cours {
    border-left-color: #f39c12;
  }

  .stat-card.termine {
    border-left-color: #27ae60;
  }

  .stat-card .num {
    display: block;
    font-size: 2.5em;
    font-weight: 700;
    color: #2c5282;
    margin-bottom: 10px;
  }

  .stat-card .label {
    display: block;
    font-size: 0.9em;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .filters {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 30px;
  }

  .filters h3 {
    font-size: 1.1em;
    color: #2c5282;
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
  }

  .filter-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 15px;
    align-items: flex-end;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
  }

  .filter-group label {
    margin-bottom: 8px;
    font-weight: 600;
    color: #2c5282;
    font-size: 0.9em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .filter-group select,
  .filter-group input {
    padding: 10px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 0.95em;
    background-color: white;
    transition: all 0.3s ease;
    font-family: inherit;
  }

  .filter-group select:focus,
  .filter-group input:focus {
    outline: none;
    border-color: #2c5282;
    box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
  }

  .btn-reset {
    padding: 10px 20px;
    background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    text-transform: uppercase;
    font-size: 0.85em;
    letter-spacing: 0.5px;
  }

  .btn-reset:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(149, 165, 166, 0.3);
  }

  .table-container {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    overflow-x: auto;
  }

  .table-container h3 {
    font-size: 1.1em;
    color: #2c5282;
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  table thead {
    background: linear-gradient(135deg, #f5a623 0%, #d68910 100%);
    color: white;
  }

  table thead th {
    padding: 15px;
    text-align: left;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.85em;
    letter-spacing: 0.5px;
  }

  table tbody tr {
    border-bottom: 1px solid #e0e0e0;
    transition: all 0.3s ease;
  }

  table tbody tr:hover {
    background: #f9f9f9;
  }

  table tbody td {
    padding: 15px;
    font-size: 0.95em;
    color: #333;
  }

  .status-badge {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 6px;
    color: white;
    font-weight: 600;
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn-view {
    padding: 8px 16px;
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn-view:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #666;
    font-size: 1.1em;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .admin-dashboard {
      padding: 15px;
    }

    .admin-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 15px;
    }

    .admin-header h1 {
      font-size: 1.5em;
    }

    .header-buttons {
      width: 100%;
      flex-direction: column;
    }

    .btn-firebase-sync, .btn-users, .btn-back {
      width: 100%;
    }

    .filter-row {
      grid-template-columns: 1fr;
    }

    table {
      font-size: 0.85em;
    }

    table thead th,
    table tbody td {
      padding: 10px;
    }
  }
`;

type Signalement = {
  id: number;
  description?: string;
  latitude: number;
  longitude: number;
  status: string;
  surfaceM2?: number | null;
  budget?: number | null;
  dateSignalement?: string;
  date_signalement?: string;
  user?: { id: number; email: string; nom?: string; prenom?: string } | null;
};

type User = {
  id: number;
  email: string;
  nom?: string;
  prenom?: string;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingFirebase, setSyncingFirebase] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sigRes, userRes] = await Promise.all([
        fetch('http://localhost:8080/api/signalements'),
        fetch('http://localhost:8080/api/users'),
      ]);

      if (sigRes.ok) setSignalements(await sigRes.json());
      if (userRes.ok) setUsers(await userRes.json());
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncFromFirebase = async () => {
    setSyncingFirebase(true);
    setSyncMessage(null);
    
    try {
      const token = localStorage.getItem('firebaseToken') || 'admin-sync-token';
      
      const response = await fetch('http://localhost:8080/api/firebase/sync/signalements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        const successCount = result.synced?.length || 0;
        const failedCount = result.failed?.length || 0;
        const total = result.totalFetched || 0;
        
        setSyncMessage({
          type: 'success',
          text: `Synchronisation réussie! ${successCount} signalement(s) importé(s), ${failedCount} échec(s) sur ${total} au total.`
        });
        
        await fetchData();
      } else {
        setSyncMessage({
          type: 'error',
          text: `Erreur: ${result.error || 'Échec de la synchronisation'}`
        });
      }
    } catch (error) {
      console.error('Erreur sync Firebase:', error);
      setSyncMessage({
        type: 'error',
        text: 'Erreur de connexion au serveur'
      });
    } finally {
      setSyncingFirebase(false);
    }
  };

  const filteredSignalements = signalements.filter(sig => {
    if (filterStatus && sig.status !== filterStatus) return false;
    if (filterUser && sig.user?.id !== Number(filterUser)) return false;

    const sigDate = sig.dateSignalement || sig.date_signalement;
    if (filterDateFrom && sigDate && new Date(sigDate) < new Date(filterDateFrom)) return false;
    if (filterDateTo && sigDate && new Date(sigDate) > new Date(filterDateTo)) return false;

    return true;
  });

  const countByStatus = (status: string) => signalements.filter(s => s.status === status).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOUVEAU': return '#e74c3c';
      case 'EN_COURS': return '#f39c12';
      case 'TERMINE': return '#27ae60';
      default: return '#3498db';
    }
  };

  const formatDate = (sig: Signalement) => {
    const dateStr = sig.dateSignalement || sig.date_signalement;
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  return (
    <>
      <style>{styles}</style>
      <div className="admin-dashboard">
        <div className="admin-header">
          <button className="btn-back" onClick={() => navigate('/')}>Retour</button>
          <h1>Tableau de Bord Administration</h1>
          <div className="header-buttons">
            <button 
              className="btn-firebase-sync" 
              onClick={syncFromFirebase}
              disabled={syncingFirebase}
            >
              {syncingFirebase ? 'Synchronisation...' : 'Sync Firebase'}
            </button>
            <button className="btn-users" onClick={() => navigate('/admin/users')}>
              Gestion Utilisateurs
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className={`sync-message ${syncMessage.type}`}>
            {syncMessage.text}
            <button className="close-btn" onClick={() => setSyncMessage(null)}>×</button>
          </div>
        )}

        <div className="admin-stats">
          <div className="stat-card total">
            <span className="num">{signalements.length}</span>
            <span className="label">Total</span>
          </div>
          <div className="stat-card nouveau">
            <span className="num">{countByStatus('NOUVEAU')}</span>
            <span className="label">Nouveaux</span>
          </div>
          <div className="stat-card en-cours">
            <span className="num">{countByStatus('EN_COURS')}</span>
            <span className="label">En cours</span>
          </div>
          <div className="stat-card termine">
            <span className="num">{countByStatus('TERMINE')}</span>
            <span className="label">Terminés</span>
          </div>
        </div>

        <div className="filters">
          <h3>Filtres</h3>
          <div className="filter-row">
            <div className="filter-group">
              <label>Statut</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Tous</option>
                <option value="NOUVEAU">Nouveau</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Utilisateur</label>
              <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                <option value="">Tous</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.email})</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Date début</label>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
            </div>

            <div className="filter-group">
              <label>Date fin</label>
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
            </div>

            <button className="btn-reset" onClick={() => {
              setFilterStatus('');
              setFilterUser('');
              setFilterDateFrom('');
              setFilterDateTo('');
            }}>
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="table-container">
          <h3>Signalements ({filteredSignalements.length})</h3>
          {loading ? (
            <p className="loading">Chargement des données...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Utilisateur</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSignalements.map(sig => (
                  <tr key={sig.id}>
                    <td>#{sig.id}</td>
                    <td>{sig.description?.slice(0, 40) || 'N/A'}...</td>
                    <td>
                      <span className="status-badge" style={{ background: getStatusColor(sig.status) }}>
                        {sig.status}
                      </span>
                    </td>
                    <td>{formatDate(sig)}</td>
                    <td>{sig.user ? `${sig.user.prenom} ${sig.user.nom}` : 'N/A'}</td>
                    <td>
                      <button className="btn-view" onClick={() => navigate(`/signalement/${sig.id}`)}>
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;

type Signalement = {
  id: number;
  description?: string;
  latitude: number;
  longitude: number;
  status: string;
  surfaceM2?: number | null;
  budget?: number | null;
  dateSignalement?: string;
  date_signalement?: string;
  user?: { id: number; email: string; nom?: string; prenom?: string } | null;
};

type User = {
  id: number;
  email: string;
  nom?: string;
  prenom?: string;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingFirebase, setSyncingFirebase] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtres
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sigRes, userRes] = await Promise.all([
        fetch('http://localhost:8080/api/signalements'),
        fetch('http://localhost:8080/api/users'),
      ]);

      if (sigRes.ok) setSignalements(await sigRes.json());
      if (userRes.ok) setUsers(await userRes.json());
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Synchroniser les signalements depuis Firebase
  const syncFromFirebase = async () => {
    setSyncingFirebase(true);
    setSyncMessage(null);
    
    try {
      // Récupérer un token d'admin stocké ou utiliser un token système
      // Pour l'instant, on utilise un token d'accès simple via localStorage si disponible
      const token = localStorage.getItem('firebaseToken') || 'admin-sync-token';
      
      const response = await fetch('http://localhost:8080/api/firebase/sync/signalements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        const successCount = result.synced?.length || 0;
        const failedCount = result.failed?.length || 0;
        const total = result.totalFetched || 0;
        
        setSyncMessage({
          type: 'success',
          text: `✅ Synchronisation terminée! ${successCount} signalement(s) importé(s), ${failedCount} échec(s) sur ${total} total.`
        });
        
        // Rafraîchir les données
        await fetchData();
      } else {
        setSyncMessage({
          type: 'error',
          text: `❌ Erreur: ${result.error || 'Échec de la synchronisation'}`
        });
      }
    } catch (error) {
      console.error('Erreur sync Firebase:', error);
      setSyncMessage({
        type: 'error',
        text: `❌ Erreur de connexion au serveur`
      });
    } finally {
      setSyncingFirebase(false);
    }
  };

  const filteredSignalements = signalements.filter(sig => {
    if (filterStatus && sig.status !== filterStatus) return false;
    if (filterUser && sig.user?.id !== Number(filterUser)) return false;

    const sigDate = sig.dateSignalement || sig.date_signalement;
    if (filterDateFrom && sigDate && new Date(sigDate) < new Date(filterDateFrom)) return false;
    if (filterDateTo && sigDate && new Date(sigDate) > new Date(filterDateTo)) return false;

    return true;
  });

  const countByStatus = (status: string) => signalements.filter(s => s.status === status).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOUVEAU': return '#e74c3c';
      case 'EN_COURS': return '#f39c12';
      case 'TERMINE': return '#27ae60';
      default: return '#3498db';
    }
  };

  const formatDate = (sig: Signalement) => {
    const dateStr = sig.dateSignalement || sig.date_signalement;
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <button className="btn-back" onClick={() => navigate('/')}>← Retour</button>
        <h1>📊 Dashboard Admin</h1>
        <div className="header-buttons">
          <button 
            className="btn-firebase-sync" 
            onClick={syncFromFirebase}
            disabled={syncingFirebase}
          >
            {syncingFirebase ? '🔄 Synchronisation...' : '🔥 Sync Firebase → PostgreSQL'}
          </button>
          <button className="btn-users" onClick={() => navigate('/admin/users')}>
            👥 Gestion Utilisateurs & Firebase
          </button>
        </div>
      </div>

      {/* Message de synchronisation */}
      {syncMessage && (
        <div className={`sync-message ${syncMessage.type}`}>
          {syncMessage.text}
          <button className="close-btn" onClick={() => setSyncMessage(null)}>×</button>
        </div>
      )}

      {/* Stats */}
      <div className="admin-stats">
        <div className="stat-card total">
          <span className="num">{signalements.length}</span>
          <span className="label">Total</span>
        </div>
        <div className="stat-card nouveau">
          <span className="num">{countByStatus('NOUVEAU')}</span>
          <span className="label">Nouveaux</span>
        </div>
        <div className="stat-card en-cours">
          <span className="num">{countByStatus('EN_COURS')}</span>
          <span className="label">En cours</span>
        </div>
        <div className="stat-card termine">
          <span className="num">{countByStatus('TERMINE')}</span>
          <span className="label">Terminés</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters">
        <h3>🔍 Filtres</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Statut</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Tous</option>
              <option value="NOUVEAU">Nouveau</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Utilisateur</label>
            <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
              <option value="">Tous</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.email})</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Date début</label>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
          </div>

          <div className="filter-group">
            <label>Date fin</label>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
          </div>

          <button className="btn-reset" onClick={() => {
            setFilterStatus('');
            setFilterUser('');
            setFilterDateFrom('');
            setFilterDateTo('');
          }}>
            ✕ Réinitialiser
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="table-container">
        <h3>📋 Signalements ({filteredSignalements.length})</h3>
        {loading ? (
          <p className="loading">Chargement...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Utilisateur</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSignalements.map(sig => (
                <tr key={sig.id}>
                  <td>#{sig.id}</td>
                  <td>{sig.description?.slice(0, 40) || 'N/A'}...</td>
                  <td>
                    <span className="status-badge" style={{ background: getStatusColor(sig.status) }}>
                      {sig.status}
                    </span>
                  </td>
                  <td>{formatDate(sig)}</td>
                  <td>{sig.user ? `${sig.user.prenom} ${sig.user.nom}` : 'N/A'}</td>
                  <td>
                    <button className="btn-view" onClick={() => navigate(`/signalement/${sig.id}`)}>
                      Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
