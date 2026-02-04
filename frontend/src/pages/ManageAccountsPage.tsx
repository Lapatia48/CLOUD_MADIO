import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../api/http';
import '../assets/css/AccountManagement.css';

type User = {
  id: number;
  email: string;
  password: string;
  nom: string | null;
  prenom: string | null;
  role: string;
  blocked: boolean;
  firebaseUid: string | null;
};

type EditModalData = {
  user: User | null;
  isOpen: boolean;
};

type DeleteModalData = {
  user: User | null;
  isOpen: boolean;
};

const ManageAccountsPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<EditModalData>({ user: null, isOpen: false });
  const [deleteModal, setDeleteModal] = useState<DeleteModalData>({ user: null, isOpen: false });
  const [editForm, setEditForm] = useState({ nom: '', prenom: '', role: 'USER', password: '' });
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await http.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le modal d'édition
  const openEditModal = (user: User) => {
    setEditModal({ user, isOpen: true });
    setEditForm({
      nom: user.nom || '',
      prenom: user.prenom || '',
      role: user.role,
      password: ''
    });
    setMessage(null);
  };

  const closeEditModal = () => {
    setEditModal({ user: null, isOpen: false });
    setMessage(null);
  };

  // Ouvrir le modal de suppression
  const openDeleteModal = (user: User) => {
    setDeleteModal({ user, isOpen: true });
    setMessage(null);
  };

  const closeDeleteModal = () => {
    setDeleteModal({ user: null, isOpen: false });
    setMessage(null);
  };

  // Sauvegarder les modifications
  const handleSaveEdit = async () => {
    if (!editModal.user) return;

    setProcessing(true);
    try {
      const payload: any = {
        nom: editForm.nom,
        prenom: editForm.prenom,
        role: editForm.role
      };
      // Ajouter le password seulement s'il est renseigné
      if (editForm.password && editForm.password.trim() !== '') {
        payload.password = editForm.password;
      }
      
      await http.put(`/api/users/${editModal.user.id}`, payload);
      
      setMessage({ type: 'success', text: '✅ Utilisateur modifié et synchronisé avec Firebase!' });
      await fetchUsers();
      setTimeout(closeEditModal, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de la modification' });
    } finally {
      setProcessing(false);
    }
  };

  // Supprimer un utilisateur
  const handleDelete = async () => {
    if (!deleteModal.user) return;

    setProcessing(true);
    try {
      await http.delete(`/api/users/${deleteModal.user.id}`);
      
      setMessage({ type: 'success', text: '✅ Utilisateur supprimé (PostgreSQL et Firebase)!' });
      await fetchUsers();
      setTimeout(closeDeleteModal, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de la suppression' });
    } finally {
      setProcessing(false);
    }
  };

  // Débloquer un utilisateur (met à jour PostgreSQL ET Firebase)
  const handleUnblock = async (user: User) => {
    setProcessing(true);
    try {
      await http.post(`/api/users/${user.id}/unblock`);
      setMessage({ type: 'success', text: `✅ ${user.email} débloqué et synchronisé vers Firebase!` });
      await fetchUsers();
    } catch (error) {
      console.error('Erreur déblocage:', error);
      setMessage({ type: 'error', text: 'Erreur lors du déblocage' });
    } finally {
      setProcessing(false);
    }
  };

  // Synchroniser les statuts blocked depuis Firebase
  const handleSyncFromFirebase = async () => {
    setProcessing(true);
    setMessage(null);
    try {
      const response = await http.post('/api/users/sync-from-firebase');
      const data = response.data;
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `🔥 Sync Firebase → PostgreSQL: ${data.updated} utilisateurs mis à jour` 
        });
        await fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur sync' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erreur sync Firebase' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="manage-accounts">
      <div className="header">
        <button className="btn-back" onClick={() => navigate('/accounts')}>← Retour</button>
        <h1>📋 Liste des utilisateurs</h1>
        <button 
          className="btn-sync" 
          onClick={handleSyncFromFirebase}
          disabled={processing}
        >
          🔄 Sync Firebase
        </button>
      </div>

      {message && (
        <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </div>
      )}

      <div className="users-table">
        {loading ? (
          <div className="loading-spinner" style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>
            Chargement...
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>id</th>
                <th>email</th>
                <th>password</th>
                <th>nom</th>
                <th>prenom</th>
                <th>role</th>
                <th>is_blocked</th>
                <th>firebase_uid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.password}
                  </td>
                  <td>{user.nom || ''}</td>
                  <td>{user.prenom || ''}</td>
                  <td>{user.role}</td>
                  <td>{user.blocked ? 'true' : 'false'}</td>
                  <td>{user.firebaseUid || ''}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-edit" onClick={() => openEditModal(user)}>
                        ✏️ Modifier
                      </button>
                      {user.blocked && (
                        <button 
                          className="btn-action btn-unblock"
                          onClick={() => handleUnblock(user)}
                          disabled={processing}
                        >
                          🔓 Débloquer
                        </button>
                      )}
                      <button className="btn-action btn-delete" onClick={() => openDeleteModal(user)}>
                        🗑️ Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal d'édition */}
      {editModal.isOpen && editModal.user && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>✏️ Modifier l'utilisateur</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
              {editModal.user.email}
            </p>
            
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                value={editForm.nom}
                onChange={e => setEditForm({ ...editForm, nom: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label>Prénom</label>
              <input
                type="text"
                value={editForm.prenom}
                onChange={e => setEditForm({ ...editForm, prenom: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label>Rôle</label>
              <select
                value={editForm.role}
                onChange={e => setEditForm({ ...editForm, role: e.target.value })}
              >
                <option value="USER">USER</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Nouveau mot de passe (laisser vide pour ne pas changer)</label>
              <input
                type="password"
                value={editForm.password}
                onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Nouveau mot de passe..."
              />
            </div>

            {message && (
              <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
                {message.text}
              </div>
            )}

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={closeEditModal}>Annuler</button>
              <button className="btn-confirm" onClick={handleSaveEdit} disabled={processing}>
                {processing ? '⏳...' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {deleteModal.isOpen && deleteModal.user && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>🗑️ Supprimer l'utilisateur</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '1rem 0' }}>
              Êtes-vous sûr de vouloir supprimer <strong>{deleteModal.user.email}</strong> ?
            </p>
            <p style={{ color: '#e74c3c', fontSize: '0.9rem' }}>
              ⚠️ Cette action est irréversible. L'utilisateur sera supprimé de PostgreSQL et Firebase.
            </p>

            {message && (
              <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
                {message.text}
              </div>
            )}

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={closeDeleteModal}>Annuler</button>
              <button className="btn-confirm btn-confirm-delete" onClick={handleDelete} disabled={processing}>
                {processing ? '⏳...' : '🗑️ Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAccountsPage;
