import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/BlockedUsers.css';

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

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8080/api/users');
      
      if (response.ok) {
        const data = await response.json();
        console.log('All users:', data);
        
        // Filtrer les users bloqués (vérifier tous les formats possibles)
        const blocked = (data as User[]).filter((u) => {
          const isBlocked = u.isBlocked === true || 
                           u.is_blocked === true || 
                           u.blocked === true ||
                           (u as any).isBlocked === true;
          console.log(`User ${u.email}: isBlocked=${u.isBlocked}, is_blocked=${u.is_blocked}`, isBlocked);
          return isBlocked;
        });
        
        console.log('Blocked users:', blocked);
        setUsers(blocked);
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

  const handleUnblock = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/users/${userId}/unblock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        alert('✅ Utilisateur débloqué avec succès !');
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.message || 'Erreur lors du déblocage');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur de connexion');
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
          <h1>🚫 Utilisateurs Bloqués</h1>
        </div>

        {loading && <div className="loading">⏳ Chargement des utilisateurs...</div>}
        
        {error && <div className="error-message">{error}</div>}

        {!loading && !error && users.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">✅</span>
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
                    🔴 {getFailedAttempts(user)} tentatives de connexion échouées
                  </span>
                </div>
                <button 
                  className="btn-unblock"
                  onClick={() => handleUnblock(user.id)}
                >
                  ✓ Débloquer
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
