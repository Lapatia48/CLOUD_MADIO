import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
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

  .signalement-create-container {
    display: flex;
    height: 100vh;
    background: white;
  }

  .signalement-map {
    flex: 1;
    position: relative;
    background: linear-gradient(135deg, #1a3a52 0%, #2c5282 100%);
  }

  .map {
    width: 100%;
    height: 100%;
  }

  .leaflet-container {
    height: 100%;
  }

  .map-hint {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #f5a623 0%, #d68910 100%);
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    font-weight: 600;
    text-align: center;
    z-index: 10;
    animation: bounce 1s infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50% { transform: translateX(-50%) translateY(-10px); }
  }

  .signalement-form-panel {
    width: 380px;
    background: white;
    padding: 30px;
    overflow-y: auto;
    box-shadow: -5px 0 20px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
  }

  .btn-back {
    align-self: flex-start;
    padding: 10px 16px;
    background: linear-gradient(135deg, #2c5282 0%, #1a3a52 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9em;
    margin-bottom: 20px;
    transition: all 0.3s ease;
  }

  .btn-back:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(44, 82, 130, 0.3);
  }

  .signalement-form-panel h1 {
    font-size: 1.8em;
    color: #2c5282;
    margin-bottom: 20px;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .error-message {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: white;
    padding: 12px 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 0.9em;
    border-left: 4px solid #f5a623;
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }

  form {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .form-row .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #2c5282;
    font-size: 0.9em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 0.95em;
    font-family: inherit;
    transition: all 0.3s ease;
    background-color: #f9f9f9;
  }

  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: #2c5282;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
  }

  .form-group textarea {
    resize: vertical;
    min-height: 100px;
  }

  .form-group input::placeholder,
  .form-group textarea::placeholder {
    color: #999;
  }

  .disabled-input {
    background-color: #f0f0f0;
    color: #999;
    cursor: not-allowed;
  }

  .select-entreprise {
    cursor: pointer;
  }

  .coordinates {
    margin-top: auto;
    padding-top: 20px;
    border-top: 2px solid #e0e0e0;
  }

  .coords-display {
    background: linear-gradient(135deg, #f5a623 0%, #d68910 100%);
    color: white;
    padding: 12px 15px;
    border-radius: 8px;
    font-weight: 600;
    text-align: center;
  }

  .coords-empty {
    background: linear-gradient(135deg, #e0e0e0 0%, #bfbfbf 100%);
    color: white;
    padding: 12px 15px;
    border-radius: 8px;
    text-align: center;
    font-weight: 500;
  }

  .btn-submit {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #2c5282 0%, #1a3a52 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 20px;
    box-shadow: 0 4px 15px rgba(44, 82, 130, 0.3);
  }

  .btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(44, 82, 130, 0.4);
  }

  .btn-submit:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .signalement-create-container {
      flex-direction: column;
    }

    .signalement-map {
      height: 50%;
    }

    .signalement-form-panel {
      width: 100%;
      height: 50%;
    }

    .form-row {
      grid-template-columns: 1fr;
    }
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(44, 82, 130, 0.3);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(44, 82, 130, 0.5);
  }
`;

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
    new Date().toISOString().slice(0, 16)
  );
  const [entrepriseId, setEntrepriseId] = useState<number | null>(null);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
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

  const tileUrl = isOnline
    ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    : 'http://localhost:8085/data/antananarivo/{z}/{x}/{y}.pbf';

  return (
    <>
      <style>{styles}</style>
      <div className="signalement-create-container">
        <div className="signalement-map">
          <MapContainer center={DEFAULT_CENTER} zoom={13} className="map">
            <TileLayer
              url={tileUrl}
              attribution="&copy; OpenStreetMap contributors"
            />
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
            Cliquez sur la carte pour marquer l'emplacement du problème
          </div>
        </div>

        <div className="signalement-form-panel">
          <button className="btn-back" onClick={() => navigate('/user')} type="button">
            Retour
          </button>

          <h1>Nouveau Signalement</h1>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Description du problème *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le problème de la route..."
                required
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
              />
            </div>

            <div className="form-group coordinates">
              <label>Coordonnées sélectionnées</label>
              {latitude !== null && longitude !== null ? (
                <div className="coords-display">
                  Latitude: {latitude.toFixed(6)}, Longitude: {longitude.toFixed(6)}
                </div>
              ) : (
                <div className="coords-empty">
                  Aucun emplacement sélectionné
                </div>
              )}
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Envoi en cours...' : 'Créer le signalement'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default SignalementCreatePage;

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
