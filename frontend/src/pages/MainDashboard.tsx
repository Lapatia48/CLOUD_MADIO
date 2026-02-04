import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import '../assets/css/MainDashboard.css';

type Manager = {
  id: number;
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
  const [manager, setManager] = useState<Manager | null>(null);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [syncingFirebase, setSyncingFirebase] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Vérifier si le manager est connecté
    const storedManager = localStorage.getItem('manager');
    if (!storedManager) {
      // Rediriger vers la page de login manager (pas landing)
      navigate('/manager-login');
      return;
    }
    
    try {
      const parsedManager = JSON.parse(storedManager) as Manager;
      setManager(parsedManager);
    } catch {
      localStorage.removeItem('manager');
      localStorage.removeItem('managerToken');
      navigate('/manager-login');
      return;
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Charger les signalements au démarrage
    void fetchSignalements();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('manager');
    localStorage.removeItem('managerToken');
    navigate('/');
  };

  const fetchSignalements = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/signalements');
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setSignalements(list);
      }
    } catch (error) {
      console.error('Erreur chargement signalements:', error);
    }
  };

  // Synchroniser les signalements depuis Firebase vers PostgreSQL
  const syncFromFirebase = async () => {
    setSyncingFirebase(true);
    setSyncMessage(null);
    
    try {
      const response = await fetch('http://localhost:8080/api/firebase/sync/signalements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        const successCount = result.success || 0;
        const failedCount = result.failed || 0;
        const skipped = result.skipped || 0;
        const total = result.totalFound || 0;
        
        setSyncMessage({
          type: 'success',
          text: `✅ ${successCount} importé(s), ${skipped} ignoré(s), ${failedCount} échec(s) sur ${total} dans Firebase`
        });
        
        // Rafraîchir les signalements sur la carte
        await fetchSignalements();
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

  const tileUrl = isOnline
    ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    : 'http://localhost:8085/styles/basic/{z}/{x}/{y}.png';

  return (
    <div className="main-dashboard">
      <div className="map-section">


        <MapContainer center={DEFAULT_CENTER} zoom={13} className="map-container">
          <TileLayer url={tileUrl} attribution="&copy; OpenStreetMap" />
          
          {signalements.map((sig) => (
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
                  {sig.entreprise && (
                    <div className="tooltip-row">
                      <span>🏢 {sig.entreprise.nom}</span>
                    </div>
                  )}
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

        {/* Infos Manager connecté */}
        {manager && (
          <div className="manager-info">
            <div className="manager-avatar">👨‍💼</div>
            <div className="manager-details">
              <strong>{manager.nom || manager.email}</strong>
              <small>Manager</small>
            </div>
            <button className="btn-logout" onClick={handleLogout} title="Se déconnecter">
              🚪
            </button>
          </div>
        )}

        {/* Message de synchronisation */}
        {syncMessage && (
          <div className={`sync-message ${syncMessage.type}`}>
            {syncMessage.text}
            <button className="close-btn" onClick={() => setSyncMessage(null)}>×</button>
          </div>
        )}

        {/* Section principale - Gestionnaire */}
        <div className="manager-card">
          <div className="manager-icon">🔄</div>
          <p>Synchronisation Firebase</p>
          <small>Importez les signalements depuis l'application mobile</small>
        </div>

        {/* Actions */}
        <div className="actions">
          {/* Bouton principal - Sync Firebase */}
          <button 
            className="btn btn-firebase" 
            onClick={() => void syncFromFirebase()}
            disabled={syncingFirebase}
          >
            {syncingFirebase ? '⏳ Synchronisation...' : '🔥 Synchroniser Firebase → PostgreSQL'}
          </button>

          <button className="btn btn-secondary" onClick={() => void fetchSignalements()}>
            🔄 Rafraîchir la carte
          </button>

          {/* Créer un compte (sync vers Firebase) */}
          <button className="btn btn-outline" onClick={() => navigate('/register')}>
            📝 Créer un compte utilisateur
          </button>

          {/* Accès Admin */}
          <button className="btn btn-admin" onClick={() => navigate('/admin')}>
            📊 Dashboard Admin
          </button>
        </div>

        {/* Stats signalements */}
        <div className="stats-section">
          <h3>📊 Statistiques</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-num">{signalements.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item nouveau">
              <span className="stat-num">{signalements.filter(s => s.status === 'NOUVEAU').length}</span>
              <span className="stat-label">Nouveaux</span>
            </div>
            <div className="stat-item en-cours">
              <span className="stat-num">{signalements.filter(s => s.status === 'EN_COURS').length}</span>
              <span className="stat-label">En cours</span>
            </div>
            <div className="stat-item termine">
              <span className="stat-num">{signalements.filter(s => s.status === 'TERMINE').length}</span>
              <span className="stat-label">Terminés</span>
            </div>
          </div>
        </div>

        {/* Liste signalements */}
        <div className="signalements-list">
          <h3>📋 Signalements récents ({signalements.length})</h3>
          {signalements.length === 0 ? (
            <p className="empty">Aucun signalement. Cliquez sur "Synchroniser Firebase" pour importer.</p>
          ) : (
            <ul>
              {signalements.slice(0, 10).map((sig) => (
                <li key={sig.id} onClick={() => navigate(`/signalement/${sig.id}`)}>
                  <span className="status-dot" style={{ backgroundColor: getStatusColor(sig.status) }} />
                  <div>
                    <strong>{sig.description?.slice(0, 25) || 'Signalement'}...</strong>
                    <small>{formatDate(sig)} {sig.entreprise ? `• ${sig.entreprise.nom}` : ''}</small>
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

export default MainDashboard;
