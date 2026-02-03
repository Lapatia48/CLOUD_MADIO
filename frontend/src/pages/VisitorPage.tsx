import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import '../assets/css/VisitorPage.css';

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
        <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}
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
