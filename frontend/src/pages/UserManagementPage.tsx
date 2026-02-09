import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../api/http';

type User = {
  id: number;
  email: string;
  nom?: string;
  prenom?: string;
  role: string;
  isBlocked: boolean;
  firebaseUid?: string | null;
};

type SyncModalData = {
  user: User | null;
  isOpen: boolean;
};

const UserManagementPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncModal, setSyncModal] = useState<SyncModalData>({ user: null, isOpen: false });
  const [password, setPassword] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await http.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const openSyncModal = (user: User) => {
    setSyncModal({ user, isOpen: true });
    setPassword('');
    setSyncMessage(null);
  };

  const closeSyncModal = () => {
    setSyncModal({ user: null, isOpen: false });
    setPassword('');
    setSyncMessage(null);
  };

  const handleSyncUser = async () => {
    if (!syncModal.user || !password) {
      setSyncMessage({ type: 'error', text: 'Veuillez entrer le mot de passe de l\'utilisateur' });
      return;
    }

    setSyncing(true);
    setSyncMessage(null);

    try {
      const response = await http.post('/api/firebase/sync/user', {
        userId: syncModal.user.id,
        plainPassword: password
      });

      if (response.data.success) {
        setSyncMessage({ 
          type: 'success', 
          text: `Synchronisation réussie ! Firebase UID: ${response.data.firebaseUid}` 
        });
        // Rafraîchir la liste des utilisateurs
        await fetchUsers();
        // Fermer le modal après 2 secondes
        setTimeout(() => {
          closeSyncModal();
        }, 2000);
      } else {
        setSyncMessage({ type: 'error', text: `${response.data.message}` });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur de synchronisation';
      setSyncMessage({ type: 'error', text: `${errorMessage}` });
    } finally {
      setSyncing(false);
    }
  };

  const handleBlockUser = async (userId: number, block: boolean) => {
    try {
      await http.post(`/api/users/${userId}/${block ? 'block' : 'unblock'}`);
      await fetchUsers();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="user-management">
      <div className="header">
        <button className="btn-back" onClick={() => navigate('/')}>← Retour</button>
        <h1>Gestion des Utilisateurs</h1>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="num">{users.length}</span>
          <span className="label">Total</span>
        </div>
        <div className="stat-card synced">
          <span className="num">{users.filter(u => u.firebaseUid).length}</span>
          <span className="label">Synchronisés Firebase</span>
        </div>
        <div className="stat-card not-synced">
          <span className="num">{users.filter(u => !u.firebaseUid).length}</span>
          <span className="label">Non synchronisés</span>
        </div>
        <div className="stat-card blocked">
          <span className="num">{users.filter(u => u.isBlocked).length}</span>
          <span className="label">Bloqués</span>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <p className="loading">Chargement...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Firebase</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={user.isBlocked ? 'blocked-row' : ''}>
                  <td>#{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.nom || '-'}</td>
                  <td>{user.prenom || '-'}</td>
                  <td>
                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.isBlocked ? (
                      <span className="status-badge blocked">Bloqué</span>
                    ) : (
                      <span className="status-badge active">Actif</span>
                    )}
                  </td>
                  <td>
                    {user.firebaseUid ? (
                      <span className="firebase-badge synced" title={user.firebaseUid}>
                        Synchronisé
                      </span>
                    ) : (
                      <span className="firebase-badge not-synced">Non sync</span>
                    )}
                  </td>
                  <td className="actions">
                    {!user.firebaseUid && (
                      <button 
                        className="btn-sync" 
                        onClick={() => openSyncModal(user)}
                        title="Synchroniser vers Firebase"
                      >
                        Sync Firebase
                      </button>
                    )}
                    {user.isBlocked ? (
                      <button 
                        className="btn-unblock" 
                        onClick={() => handleBlockUser(user.id, false)}
                      >
                        Débloquer
                      </button>
                    ) : (
                      <button 
                        className="btn-block" 
                        onClick={() => handleBlockUser(user.id, true)}
                      >
                        Bloquer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de synchronisation */}
      {syncModal.isOpen && syncModal.user && (
        <div className="modal-overlay" onClick={closeSyncModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Synchroniser vers Firebase</h2>
            <p>
              Utilisateur: <strong>{syncModal.user.email}</strong>
            </p>
            <p className="info-text">
              Entrez le mot de passe de l'utilisateur pour créer son compte Firebase.
              Ce mot de passe sera utilisé pour l'authentification sur l'application mobile.
            </p>
            
            <div className="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez le mot de passe"
                disabled={syncing}
              />
            </div>

            {syncMessage && (
              <div className={`sync-message ${syncMessage.type}`}>
                {syncMessage.text}
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={closeSyncModal}
                disabled={syncing}
              >
                Annuler
              </button>
              <button 
                className="btn-confirm" 
                onClick={handleSyncUser}
                disabled={syncing || !password}
              >
                {syncing ? 'Synchronisation...' : 'Synchroniser'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
