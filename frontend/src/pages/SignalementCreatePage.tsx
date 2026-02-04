import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import '../assets/css/SignalementCreate.css';

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

type UserInfo = {
  userId: number;
  token?: string;
};

type Entreprise = {
  id: number;
  nom: string;
  adresse?: string;
};

const SignalementCreatePage = () => {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [surfaceM2, setSurfaceM2] = useState('');
  const [budget, setBudget] = useState('');
  const [dateSignalement, setDateSignalement] = useState(
    new Date().toISOString().slice(0, 16) // Format datetime-local
  );
  const [entrepriseId, setEntrepriseId] = useState<number | null>(null);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Écouter les changements de connexion
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    fetchEntreprises();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchEntreprises = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/entreprises');
      if (response.ok) {
        const data = await response.json();
        setEntreprises(data as Entreprise[]);
      }
    } catch (err) {
      console.error('Erreur chargement entreprises:', err);
    }
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (event) => {
        setLatitude(event.latlng.lat);
        setLongitude(event.latlng.lng);
      },
    });
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (latitude === null || longitude === null) {
      setError('Veuillez cliquer sur la carte pour sélectionner un emplacement.');
      return;
    }

    setLoading(true);

    try {
      const storedUser = localStorage.getItem('user');
      const user: UserInfo | null = storedUser ? JSON.parse(storedUser) : null;

      const payload = {
        description,
        latitude,
        longitude,
        surfaceM2: surfaceM2 ? parseFloat(surfaceM2) : null,
        budget: budget ? parseFloat(budget) : null,
        status: 'NOUVEAU',
        dateSignalement: new Date(dateSignalement).toISOString(),
        entreprise: entrepriseId ? { id: entrepriseId } : null,
        user: user ? { id: user.userId } : null,
      };

      console.log('Envoi signalement:', payload);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Ajouter le token d'authentification si présent
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch('http://localhost:8080/api/signalements', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => null);
      console.log('Réponse création:', response.status, responseData);

      if (response.ok) {
        navigate('/user');
      } else if (response.status === 403 || response.status === 401) {
        setError('Accès refusé. Veuillez vous reconnecter.');
      } else {
        setError(responseData?.message || responseData?.error || 'Erreur lors de la création du signalement');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // URL de la carte selon le mode online/offline
  const tileUrl = isOnline
    ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    : 'http://localhost:8085/data/antananarivo/{z}/{x}/{y}.pbf';

  return (
    <div className="signalement-create-container">
      <div className="signalement-map">

        <MapContainer center={DEFAULT_CENTER} zoom={13} className="map">
          <TileLayer
            url={tileUrl}
            attribution="&copy; OpenStreetMap contributors"
          />
          {/* Fallback si offline et tileserver ne marche pas */}
          {!isOnline && (
            <TileLayer
              url="http://localhost:8085/styles/osm-bright/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
          )}
          <MapClickHandler />
          {latitude !== null && longitude !== null && (
            <Marker position={[latitude, longitude]} />
          )}
        </MapContainer>
        <div className="map-hint">
          👆 Cliquez sur la carte pour marquer l'emplacement du problème
        </div>
      </div>

      <div className="signalement-form-panel">
        <button className="btn-back" onClick={() => navigate('/user')} type="button">
          ← Retour
        </button>

        <h1>📍 Nouveau Signalement</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Description du problème *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le problème de la route..."
              required
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Surface (m²)</label>
              <input
                type="number"
                value={surfaceM2}
                onChange={(e) => setSurfaceM2(e.target.value)}
                placeholder="Ex: 10"
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Budget estimé (Ar)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Ex: 500000"
                min="0"
                step="1"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Entreprise assignée</label>
            <select
              value={entrepriseId ?? ''}
              onChange={(e) => setEntrepriseId(e.target.value ? Number(e.target.value) : null)}
              className="select-entreprise"
            >
              <option value="">-- Aucune entreprise --</option>
              {entreprises.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.nom} {ent.adresse ? `(${ent.adresse})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Statut</label>
            <input type="text" value="NOUVEAU" disabled className="disabled-input" />
          </div>

          <div className="form-group">
            <label>Date de signalement</label>
            <input
              type="datetime-local"
              value={dateSignalement}
              onChange={(e) => setDateSignalement(e.target.value)}
              className="date-input"
            />
          </div>

          <div className="form-group coordinates">
            <label>Coordonnées sélectionnées</label>
            {latitude !== null && longitude !== null ? (
              <div className="coords-display">
                <span>📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
              </div>
            ) : (
              <div className="coords-empty">
                Aucun emplacement sélectionné
              </div>
            )}
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '⏳ Envoi en cours...' : '✓ Créer le signalement'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignalementCreatePage;
