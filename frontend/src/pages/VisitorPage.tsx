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
    background: #f5f7fa;
  }

  .visitor-page {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: white;
  }

  .visitor-header {
    background: linear-gradient(135deg, #1a3a52 0%, #2c5282 100%);
    color: white;
    padding: 15px 25px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    z-index: 20;
  }

  .btn-back {
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9em;
    transition: all 0.3s ease;
  }

  .btn-back:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.6);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .header-title span:first-child {
    font-size: 1.8em;
  }

  .header-title h1 {
    font-size: 1.5em;
    font-weight: 700;
    letter-spacing: 2px;
  }

  .badge-visitor {
    background: linear-gradient(135deg, #f5a623 0%, #d68910 100%);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .map-fullscreen {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .map-container {
    width: 100%;
    height: 100%;
  }

  .leaflet-container {
    height: 100%;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(26, 58, 82, 0.9) 0%, rgba(44, 82, 130, 0.9) 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-overlay p {
    color: white;
    font-weight: 500;
    font-size: 1.1em;
  }

  .legend-panel {
    position: absolute;
    bottom: 30px;
    right: 30px;
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    z-index: 15;
    min-width: 250px;
    animation: slideInRight 0.4s ease-out;
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .legend-panel h3 {
    color: #2c5282;
    font-size: 1em;
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .legend-items {
    margin-bottom: 15px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    font-size: 0.9em;
    color: #333;
  }

  .legend-item:last-child {
    margin-bottom: 0;
  }

  .legend-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .legend-total {
    padding: 12px;
    background: linear-gradient(135deg, #f5a623 0%, #d68910 100%);
    color: white;
    border-radius: 8px;
    text-align: center;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .legend-total strong {
    display: block;
    font-size: 1.3em;
  }

  .btn-refresh {
    width: 100%;
    padding: 10px;
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9em;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn-refresh:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }

  .marker-tooltip {
    padding: 8px;
    min-width: 160px;
  }

  .marker-tooltip strong {
    display: block;
    margin-bottom: 8px;
    color: #2c5282;
    font-weight: 700;
  }

  .tooltip-row {
    padding: 4px 0;
    color: #333;
    font-size: 0.85em;
  }

  @media (max-width: 768px) {
    .visitor-header {
      padding: 12px 15px;
      gap: 10px;
    }

    .header-title h1 {
      font-size: 1.2em;
    }

    .legend-panel {
      bottom: 15px;
      right: 15px;
      min-width: auto;
      max-width: 90vw;
    }
  }
`;

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
};

const defaultIconPrototype = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void };
if (defaultIconPrototype._getIconUrl) delete defaultIconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER: [number, number] = [-18.8792, 47.5079];

const VisitorPage = () => {
  const navigate = useNavigate();
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    void fetchSignalements();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchSignalements = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/signalements');
      if (response.ok) {
        const data = await response.json();
        setSignalements(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erreur chargement signalements:', error);
    } finally {
      setLoading(false);
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
      <div className="visitor-page">
        <div className="visitor-header">
          <button className="btn-back" onClick={() => navigate('/')}>
            Accueil
          </button>
          <div className="header-title">
            <span>ROUTE</span>
            <h1>MADIO</h1>
            <span className="badge-visitor">Mode Visiteur</span>
          </div>
        </div>

        <div className="map-fullscreen">
          {loading ? (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Chargement de la carte...</p>
            </div>
          ) : (
            <MapContainer center={DEFAULT_CENTER} zoom={13} className="map-container">
              <TileLayer url={tileUrl} attribution="&copy; OpenStreetMap" />
              
              {signalements.map((sig) => (
                <Marker
                  key={sig.id}
                  position={[sig.latitude, sig.longitude]}
                  icon={L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background:${getStatusColor(sig.status)};width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                  })}
                >
                  <Tooltip direction="right" offset={[15, 0]} opacity={1} permanent={false}>
                    <div className="marker-tooltip">
                      <strong>{sig.description?.slice(0, 40) || 'Signalement'}</strong>
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
          )}
        </div>

        <div className="legend-panel">
          <h3>Légende</h3>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#e74c3c' }}></span>
              <span>Nouveau ({signalements.filter(s => s.status === 'NOUVEAU').length})</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#f39c12' }}></span>
              <span>En cours ({signalements.filter(s => s.status === 'EN_COURS').length})</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#27ae60' }}></span>
              <span>Terminé ({signalements.filter(s => s.status === 'TERMINE').length})</span>
            </div>
          </div>
          <div className="legend-total">
            Total: <strong>{signalements.length}</strong> signalement(s)
          </div>
          <button className="btn-refresh" onClick={() => void fetchSignalements()}>
            Actualiser
          </button>
        </div>
      </div>
    </>
  );
};

export default VisitorPage;

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
};

const defaultIconPrototype = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void };
if (defaultIconPrototype._getIconUrl) delete defaultIconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER: [number, number] = [-18.8792, 47.5079];

const VisitorPage = () => {
  const navigate = useNavigate();
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    void fetchSignalements();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchSignalements = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/signalements');
      if (response.ok) {
        const data = await response.json();
        setSignalements(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erreur chargement signalements:', error);
    } finally {
      setLoading(false);
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
    <div className="visitor-page">
      {/* Header flottant */}
      <div className="visitor-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Accueil
        </button>
        <div className="header-title">
          <span>🛣️</span>
          <h1>MADIO</h1>
          <span className="badge-visitor">Mode Visiteur</span>
        </div>

      </div>

      {/* Carte plein écran */}
      <div className="map-fullscreen">
        {loading ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Chargement de la carte...</p>
          </div>
        ) : (
          <MapContainer center={DEFAULT_CENTER} zoom={13} className="map-container">
            <TileLayer url={tileUrl} attribution="&copy; OpenStreetMap" />
            
            {signalements.map((sig) => (
              <Marker
                key={sig.id}
                position={[sig.latitude, sig.longitude]}
                icon={L.divIcon({
                  className: 'custom-marker',
                  html: `<div style="background:${getStatusColor(sig.status)};width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.3);"></div>`,
                  iconSize: [28, 28],
                  iconAnchor: [14, 14],
                })}
              >
                <Tooltip direction="right" offset={[15, 0]} opacity={1} permanent={false}>
                  <div className="marker-tooltip">
                    <strong>{sig.description?.slice(0, 40) || 'Signalement'}</strong>
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
        )}
      </div>

      {/* Légende flottante */}
      <div className="legend-panel">
        <h3>📊 Légende</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#e74c3c' }}></span>
            <span>Nouveau ({signalements.filter(s => s.status === 'NOUVEAU').length})</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#f39c12' }}></span>
            <span>En cours ({signalements.filter(s => s.status === 'EN_COURS').length})</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#27ae60' }}></span>
            <span>Terminé ({signalements.filter(s => s.status === 'TERMINE').length})</span>
          </div>
        </div>
        <div className="legend-total">
          Total: <strong>{signalements.length}</strong> signalement(s)
        </div>
        <button className="btn-refresh" onClick={() => void fetchSignalements()}>
          🔄 Actualiser
        </button>
      </div>
    </div>
  );
};

export default VisitorPage;
