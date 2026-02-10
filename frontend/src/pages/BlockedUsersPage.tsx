import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type User = {
  id: number;
  email: string;
  nom?: string;
  prenom?: string;
  failedAttempts?: number;
  failed_attempts?: number;
  isBlocked?: boolean;
  is_blocked?: boolean;
  blocked?: boolean;
};

const BlockedUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unblocking, setUnblocking] = useState<number | null>(null);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Utiliser le nouvel endpoint dédié aux utilisateurs bloqués
      const response = await fetch('http://localhost:8080/api/users/blocked');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Blocked users:', data);
        setUsers(data);
      } else {
        setError('Erreur lors du chargement des utilisateurs');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (user: User) => {
    setUnblocking(user.id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${user.id}/unblock`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== user.id));
        alert(`${user.prenom || user.email} a été débloqué avec succès !`);
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.message || 'Erreur lors du déblocage');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur de connexion');
    } finally {
      setUnblocking(null);
    }
  };

  const getFailedAttempts = (user: User) => {
    return user.failedAttempts || user.failed_attempts || 0;
  };

  return (
    <div className="blocked-users-page">
      <div className="blocked-users-container">
        <div className="header">
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Retour à la carte
          </button>
          <h1>Utilisateurs Bloqués</h1>
        </div>

        {loading && <div className="loading">Chargement des utilisateurs...</div>}
        
        {error && <div className="error-message">{error}</div>}

        {!loading && !error && users.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon"></span>
            <p>Aucun utilisateur bloqué</p>
            <small>Tous les comptes sont actuellement actifs</small>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="users-list">
            {users.map((user) => (
              <div key={user.id} className="user-item">
                <div className="user-avatar">
                  {(user.prenom?.charAt(0) || user.email.charAt(0)).toUpperCase()}
                </div>
                <div className="user-details">
                  <strong>{user.prenom || ''} {user.nom || user.email}</strong>
                  <span className="email">{user.email}</span>
                  <span className="attempts">
                    {getFailedAttempts(user)} tentatives de connexion échouées
                  </span>
                </div>
                <button 
                  className="btn-unblock"
                  onClick={() => handleUnblock(user)}
                  disabled={unblocking === user.id}
                >
                  {unblocking === user.id ? '...' : 'Débloquer'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedUsersPage;
