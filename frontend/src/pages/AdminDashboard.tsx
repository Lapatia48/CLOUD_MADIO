import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
          text: `Synchronisation terminée ! ${successCount} signalement(s) importé(s), ${failedCount} échec(s) sur ${total} total.`
        });
        
        // Rafraîchir les données
        await fetchData();
      } else {
        setSyncMessage({
          type: 'error',
          text: `Erreur : ${result.error || 'Échec de la synchronisation'}`
        });
      }
    } catch (error) {
      console.error('Erreur sync Firebase:', error);
      setSyncMessage({
        type: 'error',
        text: `Erreur de connexion au serveur`
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
        <h1>Dashboard Admin</h1>
        <div className="header-buttons">
          <button 
            className="btn-firebase-sync" 
            onClick={syncFromFirebase}
            disabled={syncingFirebase}
          >
            {syncingFirebase ? 'Synchronisation...' : 'Sync Firebase → PostgreSQL'}
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
            ✕ Réinitialiser
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="table-container">
        <h3>Signalements ({filteredSignalements.length})</h3>
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
