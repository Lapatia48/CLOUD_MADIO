import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f5f5f5;
  }

  .main-dashboard {
    display: flex;
    height: 100vh;
    background: white;
  }

  .sidebar {
    width: 320px;
    background: linear-gradient(180deg, #1a3a52 0%, #2c5282 100%);
    color: white;
    overflow-y: auto;
    box-shadow: 2px 0 15px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }

  .sidebar-header {
    padding: 30px 20px;
    background: linear-gradient(135deg, #0f2438 0%, #1a3a52 100%);
    border-bottom: 4px solid #f5a623;
    text-align: center;
  }

  .sidebar-header h1 {
    font-size: 2em;
    font-weight: 700;
    letter-spacing: 2px;
    margin-bottom: 5px;
  }

  .sidebar-header p {
    font-size: 0.85em;
    opacity: 0.8;
    font-weight: 300;
  }

  .manager-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background: rgba(245, 166, 35, 0.1);
    margin: 15px;
    border-radius: 10px;
    border-left: 4px solid #f5a623;
  }

  .manager-avatar {
    font-size: 1.8em;
  }

  .manager-details {
    flex: 1;
  }

  .manager-details strong {
    display: block;
    font-size: 0.95em;
  }

  .manager-details small {
    display: block;
    font-size: 0.8em;
    opacity: 0.8;
  }

  .btn-logout {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.2em;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-logout:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }

  .sync-message {
    padding: 12px 15px;
    margin: 15px;
    border-radius: 8px;
    font-size: 0.85em;
    position: relative;
    padding-right: 30px;
    animation: slideInLeft 0.4s ease-out;
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .sync-message.success {
    background: rgba(39, 174, 96, 0.2);
    border-left: 4px solid #27ae60;
    color: #27ae60;
  }

  .sync-message.error {
    background: rgba(231, 76, 60, 0.2);
    border-left: 4px solid #e74c3c;
    color: #e74c3c;
  }

  .close-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: inherit;
    font-size: 1.2em;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }

  .close-btn:hover {
    opacity: 1;
  }

  .manager-card {
    margin: 15px;
    padding: 20px;
    background: rgba(245, 166, 35, 0.15);
    border-radius: 10px;
    border-left: 4px solid #f5a623;
    text-align: center;
  }

  .manager-icon {
    font-size: 2em;
    margin-bottom: 10px;
  }

  .manager-card p {
    font-weight: 600;
    margin-bottom: 5px;
    font-size: 0.95em;
  }

  .manager-card small {
    display: block;
    opacity: 0.75;
    font-size: 0.8em;
  }

  .actions {
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .btn {
    padding: 12px 15px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9em;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-firebase {
    background: linear-gradient(135deg, #f5a623 0%, #d68910 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(245, 166, 35, 0.3);
  }

  .btn-firebase:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(245, 166, 35, 0.4);
  }

  .btn-outline {
    background: transparent;
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }

  .btn-outline:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.6);
  }

  .btn-admin {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }

  .btn-admin:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);
  }

  .stats-section {
    padding: 20px 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .stats-section h3 {
    font-size: 0.95em;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 15px;
    opacity: 0.8;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .stat-item {
    background: rgba(255, 255, 255, 0.1);
    padding: 15px;
    border-radius: 8px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
  }

  .stat-item:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .stat-item.nouveau {
    border-left-color: #e74c3c;
  }

  .stat-item.en-cours {
    border-left-color: #f39c12;
  }

  .stat-item.termine {
    border-left-color: #27ae60;
  }

  .stat-num {
    display: block;
    font-size: 1.8em;
    font-weight: 700;
    margin-bottom: 5px;
  }

  .stat-label {
    display: block;
    font-size: 0.75em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.8;
  }

  .signalements-list {
    padding: 20px 15px;
  }

  .signalements-list h3 {
    font-size: 0.95em;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 15px;
    opacity: 0.8;
  }

  .signalements-list ul {
    list-style: none;
  }

  .signalements-list li {
    padding: 12px;
    margin-bottom: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    gap: 10px;
    align-items: flex-start;
    border-left: 4px solid transparent;
  }

  .signalements-list li:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(5px);
  }

  .status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 4px;
  }

  .signalements-list li div {
    flex: 1;
    min-width: 0;
  }

  .signalements-list li strong {
    display: block;
    font-size: 0.9em;
    margin-bottom: 3px;
    word-break: break-word;
  }

  .signalements-list li small {
    display: block;
    font-size: 0.75em;
    opacity: 0.7;
    word-break: break-word;
  }

  .empty {
    text-align: center;
    opacity: 0.6;
    font-size: 0.9em;
    padding: 20px;
  }

  .map-section {
    flex: 1;
    position: relative;
  }

  .map-container {
    width: 100%;
    height: 100%;
  }

  .leaflet-container {
    height: 100%;
  }

  .custom-marker {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  .marker-tooltip {
    padding: 8px;
    min-width: 150px;
    font-size: 0.9em;
  }

  .marker-tooltip strong {
    display: block;
    margin-bottom: 8px;
    color: #2c5282;
  }

  .tooltip-row {
    padding: 4px 0;
    color: #333;
    font-size: 0.85em;
  }

  @media (max-width: 768px) {
    .main-dashboard {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
      max-height: 40vh;
      border-bottom: 2px solid #f5a623;
    }

    .map-section {
      flex: 1;
    }

    .stats-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

type Manager = {
  id: number;
  email: string;
  nom?: string;
  prenom?: string;
  role: string;
};

type Entreprise = { id: number; nom: string };

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
    const storedManager = localStorage.getItem('manager');
    if (!storedManager) {
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
          text: `Synchronisation réussie : ${successCount} importé(s), ${skipped} ignoré(s), ${failedCount} échec(s) sur ${total} au total`
        });
        
        await fetchSignalements();
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
      case 'NOUVEAU': return 'Nouveau';
      case 'EN_COURS': return 'En cours';
      case 'TERMINE': return 'Terminé';
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
    <>
      <style>{styles}</style>
      <div className="main-dashboard">
        <div className="sidebar">
          <div className="sidebar-header">
            <h1>MADIO</h1>
            <p>Gestion des routes</p>
          </div>

          {manager && (
            <div className="manager-info">
              <div className="manager-avatar">M</div>
              <div className="manager-details">
                <strong>{manager.nom || manager.email}</strong>
                <small>Manager</small>
              </div>
              <button className="btn-logout" onClick={handleLogout} title="Se déconnecter">
                Q
              </button>
            </div>
          )}

          {syncMessage && (
            <div className={`sync-message ${syncMessage.type}`}>
              {syncMessage.text}
              <button className="close-btn" onClick={() => setSyncMessage(null)}>×</button>
            </div>
          )}

          <div className="manager-card">
            <div className="manager-icon">↻</div>
            <p>Synchronisation Firebase</p>
            <small>Importez les signalements depuis l'application mobile</small>
          </div>

          <div className="actions">
            <button 
              className="btn btn-firebase" 
              onClick={() => void syncFromFirebase()}
              disabled={syncingFirebase}
            >
              {syncingFirebase ? 'Synchronisation...' : 'Synchroniser Firebase'}
            </button>

            <button className="btn btn-outline" onClick={() => navigate('/accounts')}>
              Gestion des comptes
            </button>

            <button className="btn btn-admin" onClick={() => navigate('/admin')}>
              Dashboard Admin
            </button>
          </div>

          <div className="stats-section">
            <h3>Statistiques</h3>
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

          <div className="signalements-list">
            <h3>Signalements récents ({signalements.length})</h3>
            {signalements.length === 0 ? (
              <p className="empty">Aucun signalement. Synchronisez Firebase pour importer.</p>
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
                      <span>Date: {formatDate(sig)}</span>
                    </div>
                    {getSurface(sig) && (
                      <div className="tooltip-row">
                        <span>Surface: {getSurface(sig)} m²</span>
                      </div>
                    )}
                    <div className="tooltip-row">
                      <span>Budget: {formatBudget(sig.budget)}</span>
                    </div>
                    {sig.entreprise && (
                      <div className="tooltip-row">
                        <span>Entreprise: {sig.entreprise.nom}</span>
                      </div>
                    )}
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </>
  );
};

export default MainDashboard;

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



          {/* Gestion des comptes (menu complet) */}
          <button className="btn btn-outline" onClick={() => navigate('/accounts')}>
            👥 Gestion des comptes
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
