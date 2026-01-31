import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import '../assets/css/SignalementDetail.css';

// Fix Leaflet icons
const defaultIconPrototype = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void };
if (defaultIconPrototype._getIconUrl) delete defaultIconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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
  entreprise?: { id: number; nom: string } | null;
  user?: { id: number; email: string; nom?: string; prenom?: string } | null;
};

const SignalementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [signalement, setSignalement] = useState<Signalement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignalement();
  }, [id]);

  const fetchSignalement = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/signalements/${id}`);
      if (response.ok) {
        setSignalement(await response.json());
      }
    } catch (error) {
      console.error('Erreur:', error);
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

  const formatDate = (dateStr?: string) => {
    const d = dateStr || signalement?.date_signalement;
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="detail-page"><div className="loading">⏳ Chargement...</div></div>;
  }

  if (!signalement) {
    return (
      <div className="detail-page">
        <div className="not-found">
          <h2>😕 Signalement non trouvé</h2>
          <button onClick={() => navigate('/')}>Retour à la carte</button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="detail-map">
        <MapContainer
          center={[signalement.latitude, signalement.longitude]}
          zoom={15}
          className="map"
          scrollWheelZoom={true}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Cercle coloré pour visualiser la zone */}
          <Circle
            center={[signalement.latitude, signalement.longitude]}
            radius={50}
            pathOptions={{
              color: getStatusColor(signalement.status),
              fillColor: getStatusColor(signalement.status),
              fillOpacity: 0.3,
              weight: 3,
            }}
          />
          
          {/* Marqueur standard Leaflet */}
          <Marker position={[signalement.latitude, signalement.longitude]} />
        </MapContainer>
      </div>

      <div className="detail-panel">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Retour à la carte
        </button>

        <div className="detail-header">
          <span className="status-badge" style={{ background: getStatusColor(signalement.status) }}>
            {getStatusLabel(signalement.status)}
          </span>
          <h1>{signalement.description || 'Sans description'}</h1>
        </div>

        <div className="detail-info">
          <div className="info-card">
            <span className="info-icon">📅</span>
            <div>
              <label>Date de signalement</label>
              <strong>{formatDate(signalement.dateSignalement)}</strong>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">📐</span>
            <div>
              <label>Surface</label>
              <strong>{signalement.surfaceM2 ? `${signalement.surfaceM2} m²` : 'Non renseignée'}</strong>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">💰</span>
            <div>
              <label>Budget estimé</label>
              <strong>{signalement.budget ? `${signalement.budget.toLocaleString()} Ar` : 'Non renseigné'}</strong>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">🏢</span>
            <div>
              <label>Entreprise assignée</label>
              <strong>{signalement.entreprise?.nom || 'Aucune'}</strong>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">📍</span>
            <div>
              <label>Coordonnées GPS</label>
              <strong>{signalement.latitude.toFixed(6)}, {signalement.longitude.toFixed(6)}</strong>
            </div>
          </div>

          {signalement.user && (
            <div className="info-card">
              <span className="info-icon">👤</span>
              <div>
                <label>Signalé par</label>
                <strong>{signalement.user.prenom} {signalement.user.nom}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignalementDetailPage;
