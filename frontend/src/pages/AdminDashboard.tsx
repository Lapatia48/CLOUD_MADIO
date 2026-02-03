import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/AdminDashboard.css';

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

  // Filtres
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Modal de modification
  const [editingSignalement, setEditingSignalement] = useState<Signalement | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    status: '',
    surfaceM2: '',
    budget: '',
  });
  const [saving, setSaving] = useState(false);

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

  const getProgressPercent = (status: string) => {
    switch (status) {
      case 'NOUVEAU': return 0;
      case 'EN_COURS': return 50;
      case 'TERMINE': return 100;
      default: return 0;
    }
  };

  const formatDate = (sig: Signalement) => {
    const dateStr = sig.dateSignalement || sig.date_signalement;
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  // Ouvrir le modal de modification
  const openEditModal = (sig: Signalement) => {
    setEditingSignalement(sig);
    setEditForm({
      description: sig.description || '',
      status: sig.status || 'NOUVEAU',
      surfaceM2: sig.surfaceM2?.toString() || '',
      budget: sig.budget?.toString() || '',
    });
  };

  // Fermer le modal
  const closeEditModal = () => {
    setEditingSignalement(null);
    setEditForm({ description: '', status: '', surfaceM2: '', budget: '' });
  };

  // Sauvegarder la modification
  const handleSaveEdit = async () => {
    if (!editingSignalement) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/signalements/${editingSignalement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          description: editForm.description,
          status: editForm.status,
          latitude: editingSignalement.latitude,
          longitude: editingSignalement.longitude,
          surfaceM2: editForm.surfaceM2 ? parseFloat(editForm.surfaceM2) : null,
          budget: editForm.budget ? parseFloat(editForm.budget) : null,
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        setSignalements(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
        closeEditModal();
        alert('✅ Signalement modifié avec succès !');
      } else {
        alert('❌ Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <button className="btn-back" onClick={() => navigate('/')}>← Retour</button>
        <h1>📊 Dashboard Admin</h1>
      </div>

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
                <th>Avancement</th>
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
                  <td>
                    <div className="progress-cell">
                      <div className="progress-bar-mini">
                        <div 
                          className="progress-fill-mini" 
                          style={{ width: `${getProgressPercent(sig.status)}%`, background: getStatusColor(sig.status) }}
                        />
                      </div>
                      <span className="progress-text">{getProgressPercent(sig.status)}%</span>
                    </div>
                  </td>
                  <td>{formatDate(sig)}</td>
                  <td>{sig.user ? `${sig.user.prenom} ${sig.user.nom}` : 'N/A'}</td>
                  <td className="actions-cell">
                    <button className="btn-edit" onClick={() => openEditModal(sig)}>
                      ✏️ Modifier
                    </button>
                    <button className="btn-view" onClick={() => navigate(`/signalement/${sig.id}`)}>
                      👁️ Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de modification */}
      {editingSignalement && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Modifier le signalement #{editingSignalement.id}</h2>
              <button className="modal-close" onClick={closeEditModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  placeholder="Description du problème..."
                />
              </div>
              <div className="form-group">
                <label>Statut</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="NOUVEAU">🔴 Nouveau</option>
                  <option value="EN_COURS">🟠 En cours</option>
                  <option value="TERMINE">🟢 Terminé</option>
                </select>
              </div>
              <div className="form-row-modal">
                <div className="form-group">
                  <label>Surface (m²)</label>
                  <input
                    type="number"
                    value={editForm.surfaceM2}
                    onChange={(e) => setEditForm({ ...editForm, surfaceM2: e.target.value })}
                    placeholder="Ex: 150"
                  />
                </div>
                <div className="form-group">
                  <label>Budget (Ar)</label>
                  <input
                    type="number"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                    placeholder="Ex: 500000"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeEditModal}>
                ❌ Annuler
              </button>
              <button className="btn-save" onClick={handleSaveEdit} disabled={saving}>
                {saving ? '⏳ Enregistrement...' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
