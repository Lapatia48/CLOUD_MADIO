import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import '../assets/css/MainDashboard.css';

type UserInfo = {
  userId: number;
  email: string;
  nom?: string;
  prenom?: string;
  role: string;
};

type Entreprise = { id: number; nom: string; };

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
  user?: { id: number } | null;
};

const defaultIconPrototype = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void };
if (defaultIconPrototype._getIconUrl) delete defaultIconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER: [number, number] = [-18.8792, 47.5079];

const MainDashboard = () => {
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
        const u = JSON.parse(storedUser) as UserInfo;
        setUser(u);
      } catch (error) {
        console.error('Erreur lecture utilisateur:', error);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user) {
      void fetchSignalements();
    }
  }, [user]);

  const fetchSignalements = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/signalements');
      if (response.ok) {
        const data = await response.json();
        let list = Array.isArray(data) ? data : [];
        // User simple : filtrer ses propres signalements
        if (user && user.role === 'USER') {
          list = list.filter((s: Signalement) => s.user?.id === user.userId);
        }
        setSignalements(list);
      }
    } catch (error) {
      console.error('Erreur chargement signalements:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setSignalements([]);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch('http://localhost:8080/api/sync', { method: 'POST' });
      await fetchSignalements();
      alert('Synchronisation réussie !');
    } catch {
      alert('Erreur de synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOUVEAU': return '#e74c3c';
      case 'EN_COURS': return '#f39c12';
      case 'TERMINE': return '#27ae60';
      default: return '#3498db';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NOUVEAU': return '🔴 Nouveau';
      case 'EN_COURS': return '🟠 En cours';
      case 'TERMINE': return '🟢 Terminé';
      default: return status;
    }
  };

  const formatDate = (sig: Signalement) => {
    const dateStr = sig.dateSignalement || sig.date_signalement;
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const getSurface = (sig: Signalement) => sig.surfaceM2 || sig.surface_m2;
  const formatBudget = (val?: number | null) => val ? val.toLocaleString('fr-FR') + ' Ar' : 'N/A';

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const tileUrl = isOnline
    ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    : 'http://localhost:8085/styles/basic/{z}/{x}/{y}.png';

  return (
    <div className="main-dashboard">
      <div className="map-section">
        <div className={`connection-badge ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}
        </div>

        <MapContainer center={DEFAULT_CENTER} zoom={13} className="map-container">
          <TileLayer url={tileUrl} attribution="&copy; OpenStreetMap" />
          
          {user && signalements.map((sig) => (
            <Marker
              key={sig.id}
              position={[sig.latitude, sig.longitude]}
              icon={L.divIcon({
                className: 'custom-marker',
                html: `<div style="background:${getStatusColor(sig.status)};width:24px;height:24px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
              eventHandlers={{
                click: () => navigate(`/signalement/${sig.id}`),
              }}
            >
              <Tooltip direction="right" offset={[15, 0]} opacity={1} permanent={false}>
                <div className="marker-tooltip">
                  <strong>{sig.description?.slice(0, 30) || 'Signalement'}</strong>
                  <div className="tooltip-row">
                    <span>{getStatusLabel(sig.status)}</span>
                  </div>
                  <div className="tooltip-row">
                    <span>📅 {formatDate(sig)}</span>
                  </div>
                  {getSurface(sig) && (
                    <div className="tooltip-row">
                      <span>📐 {getSurface(sig)} m²</span>
                    </div>
                  )}
                  <div className="tooltip-row">
                    <span>💰 {formatBudget(sig.budget)}</span>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="sidebar">
        <div className="sidebar-header">
          <h1>🛣️ MADIO</h1>
          <p>Gestion des routes</p>
        </div>

        {/* User info ou guest */}
        {user ? (
          <div className="user-card">
            <div className="user-avatar">{user.prenom?.charAt(0) || user.email.charAt(0)}</div>
            <div className="user-info">
              <strong>{user.prenom || user.email}</strong>
              <span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
            </div>
          </div>
        ) : (
          <div className="guest-card">
            <div className="guest-icon">👋</div>
            <p>Bienvenue !</p>
            <small>Connectez-vous pour voir et signaler des problèmes</small>
          </div>
        )}

        {/* Actions */}
        <div className="actions">
          {user ? (
            <>
              <button className="btn btn-primary" onClick={() => navigate('/signalement/new')}>
                ➕ Nouveau signalement
              </button>

              <button className="btn btn-secondary" onClick={() => void fetchSignalements()}>
                🔄 Rafraîchir
              </button>

              <button className="btn btn-sync" onClick={() => void handleSync()} disabled={syncing}>
                {syncing ? '⏳ Sync...' : '🔁 Synchroniser'}
              </button>

              {isAdmin && (
                <>
                  <button className="btn btn-admin" onClick={() => navigate('/admin')}>
                    📊 Dashboard Admin
                  </button>
                  <button className="btn btn-warning" onClick={() => navigate('/admin/blocked-users')}>
                    🚫 Users bloqués
                  </button>
                </>
              )}

              <button className="btn btn-danger" onClick={handleLogout}>
                🚪 Déconnexion
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>
                🔐 Se connecter
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/register')}>
                📝 Créer un compte
              </button>
            </>
          )}
        </div>

        {/* Liste signalements - seulement pour user connecté */}
        {user && (
          <div className="signalements-list">
            <h3>📋 {isAdmin ? 'Tous les signalements' : 'Mes signalements'} ({signalements.length})</h3>
            {signalements.length === 0 ? (
              <p className="empty">Aucun signalement</p>
            ) : (
              <ul>
                {signalements.slice(0, 8).map((sig) => (
                  <li key={sig.id} onClick={() => navigate(`/signalement/${sig.id}`)}>
                    <span className="status-dot" style={{ backgroundColor: getStatusColor(sig.status) }} />
                    <div>
                      <strong>{sig.description?.slice(0, 20) || 'Signalement'}...</strong>
                      <small>{formatDate(sig)}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainDashboard;
