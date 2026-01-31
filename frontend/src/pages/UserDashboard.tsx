import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import '../assets/UserDashboard.css';

type UserInfo = {
  userId: number;
  email: string;
  nom?: string;
  prenom?: string;
  role: string;
};

type Entreprise = {
  id: number;
  nom: string;
};

type Signalement = {
  id: number;
  description?: string;
  latitude: number;
  longitude: number;
  status: string;
  surfaceM2?: number | null;
  surface_m2?: number | null;
  budget?: number | null;
  dateSignalement?: string;
  date_signalement?: string;
  entreprise?: Entreprise | null;
  id_entreprise?: number | null;
};

const defaultIconPrototype = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void };
if (defaultIconPrototype._getIconUrl) {
  delete defaultIconPrototype._getIconUrl;
}

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER: [number, number] = [-18.8792, 47.5079];

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as UserInfo);
      } catch (error) {
        console.error('Erreur lecture utilisateur stocké:', error);
      }
    }

    void fetchSignalements();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchSignalements = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/signalements');
      if (!response.ok) {
        throw new Error(`Statut HTTP inattendu: ${response.status}`);
      }
      const data = await response.json();
      console.log('Signalements reçus:', data);
      setSignalements(Array.isArray(data) ? (data as Signalement[]) : []);
    } catch (error) {
      console.error('Erreur chargement signalements:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('http://localhost:8080/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        alert('Synchronisation réussie !');
        await fetchSignalements();
      } else {
        alert('Erreur lors de la synchronisation');
      }
    } catch (error) {
      console.error('Erreur sync:', error);
      alert('Erreur de connexion pour la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOUVEAU':     return '#e74c3c';
      case 'EN_COURS':    return '#f39c12';
      case 'TERMINE':     return '#27ae60';
      default:            return '#3498db';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NOUVEAU':     return '🔴 Nouveau';
      case 'EN_COURS':    return '🟠 En cours';
      case 'TERMINE':     return '🟢 Terminé';
      default:            return status;
    }
  };

  const formatDate = (signalement: Signalement) => {
    const dateStr = signalement.dateSignalement || signalement.date_signalement;
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSurface = (signalement: Signalement) => {
    return signalement.surfaceM2 || signalement.surface_m2;
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const formatBudget = (value?: number | null) => {
    if (!value) return 'N/A';
    return value.toLocaleString('fr-FR') + ' Ar';
  };

  // Détermination de l'URL des tuiles (plus simple que getTileUrl inutilisée)
  const tileUrl = isOnline
    ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    : 'http://localhost:8085/styles/basic/{z}/{x}/{y}.png'; // ou ton style préféré

  const tileAttribution = isOnline
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    : '&copy; Carte locale (TileServer-GL)';

  return (
    <div className="dashboard-container">
      {/* Carte à gauche */}
      <div className="map-section">
        <div className={`connection-indicator ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}
        </div>

        <MapContainer center={DEFAULT_CENTER} zoom={13} className="map-container">
          <TileLayer
            url={tileUrl}
            attribution={tileAttribution}
          />

          {signalements.map((signalement) => (
            <Marker
              key={signalement.id}
              position={[signalement.latitude, signalement.longitude]}
              icon={L.divIcon({
                className: 'custom-marker',
                html: `<div style="background-color: ${getStatusColor(signalement.status)}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
            >
              <Popup>
                <div className="popup-content">
                  <h4>{signalement.description ?? 'Sans description'}</h4>
                  <table className="popup-table">
                    <tbody>
                      <tr>
                        <td><strong>Statut:</strong></td>
                        <td>{getStatusLabel(signalement.status)}</td>
                      </tr>
                      <tr>
                        <td><strong>Surface:</strong></td>
                        <td>{getSurface(signalement) ? `${getSurface(signalement)} m²` : 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Budget:</strong></td>
                        <td>{formatBudget(signalement.budget)}</td>
                      </tr>
                      <tr>
                        <td><strong>Date:</strong></td>
                        <td>{formatDate(signalement)}</td>
                      </tr>
                      <tr>
                        <td><strong>Entreprise:</strong></td>
                        <td>{signalement.entreprise?.nom ?? 'Non assignée'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Panneau latéral droit */}
      <div className="sidebar">
        {/* Infos utilisateur */}
        <div className="user-info">
          <h2>👤 Mon Profil</h2>
          {user ? (
            <div className="user-details">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Nom:</strong> {user.nom ?? 'Non renseigné'}</p>
              <p><strong>Prénom:</strong> {user.prenom ?? 'Non renseigné'}</p>
              <p><strong>Rôle:</strong> <span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span></p>
            </div>
          ) : (
            <p>Chargement...</p>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/user/signalements/new')}
            type="button"
          >
            ➕ Nouveau signalement
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => void fetchSignalements()}
            type="button"
          >
            🔄 Rafraîchir la carte
          </button>

          <button
            className="btn btn-sync"
            onClick={() => void handleSync()}
            disabled={syncing}
            type="button"
          >
            {syncing ? '⏳ Synchronisation...' : '🔁 Synchroniser données'}
          </button>

          {isAdmin && (
            <button
              className="btn btn-admin"
              onClick={() => navigate('/admin/blocked-users')}
              type="button"
            >
              🚫 Utilisateurs bloqués
            </button>
          )}

          <button
            className="btn btn-danger"
            onClick={handleLogout}
            type="button"
          >
            🚪 Déconnexion
          </button>
        </div>

        {/* Liste des signalements */}
        <div className="signalements-list">
          <h3>📋 Signalements ({signalements.length})</h3>
          {signalements.length === 0 ? (
            <p className="empty">Aucun signalement pour le moment</p>
          ) : (
            <ul>
              {signalements.slice(0, 10).map((signalement) => (
                <li key={signalement.id}>
                  <span className="status-dot" style={{ backgroundColor: getStatusColor(signalement.status) }} />
                  <div>
                    <strong>{signalement.description?.slice(0, 25) ?? 'Signalement'}...</strong>
                    <small>{getStatusLabel(signalement.status)} • {formatDate(signalement)}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;